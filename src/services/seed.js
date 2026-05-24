// Idempotent seed routine. Reads `seedData.json` and writes the first user's
// skis under the given uid. Calling it twice does NOT create duplicates because
// each Firestore ski doc stores a `seedId` matching its source JSON id; we
// skip any whose seedId is already present.

import seedData from '../seedData.json';
import {listSkis, createSki} from './skiService';
import {createProfile} from './userService';

/**
 * Seed the current authenticated user with the sample skis.
 *
 * @param {string} uid
 * @returns {Promise<{created: number, skipped: number}>}
 */
export async function seedCurrentUser(uid) {
  if (!uid) {
    throw new Error('seedCurrentUser: uid is required');
  }
  const source = (seedData.users && seedData.users[0]) || null;
  if (!source) {
    return {created: 0, skipped: 0};
  }

  // Make sure the profile doc exists with the seed fields.
  await createProfile(uid, {
    email: source.email,
    displayName: source.displayName || source.email,
    weight: source.weight ?? null,
    height: source.height ?? null,
    team: source.team || null,
    location: source.location || null,
  });

  const existing = await listSkis(uid);
  const existingSeedIds = new Set(existing.map(s => s.seedId).filter(Boolean));

  let created = 0;
  let skipped = 0;
  for (const ski of source.skis || []) {
    if (existingSeedIds.has(ski.id)) {
      skipped += 1;
      continue;
    }
    await createSki(uid, {
      seedId: ski.id,
      name: ski.name,
      brand: ski.brand,
      model: ski.model || ski.name,
      technique: ski.technique,
      type: ski.type,
      build: ski.build,
      base: ski.base,
      grind: ski.grind,
      length: ski.length,
      flex: ski.flex,
      year: ski.year,
      notes: ski.notes || '',
    });
    created += 1;
  }
  return {created, skipped};
}
