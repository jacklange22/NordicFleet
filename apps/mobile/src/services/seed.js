// Idempotent seed routine. Reads `seedData.json` and writes the first user's
// skis under the given uid. Calling it twice does NOT create duplicates because
// each Firestore ski doc stores a `seedId` matching its source JSON id; we
// skip any whose seedId is already present.

import {seedData} from '@nordicfleet/core';
import {listSkis, createSki} from './skiService';

/**
 * Seed the current authenticated user with sample skis.
 *
 * STRICTLY ADDITIVE: this function only writes to the user's `skis`
 * subcollection. It never touches the profile document (no weight /
 * height / team / location / role / coachId rewrites), and it never
 * touches the wax/test log subcollections.
 *
 * Idempotent: each sample ski carries a `seedId` matching its source
 * JSON id. A pre-flight read of the user's existing skis collects the
 * seedIds already present, and we skip those on re-run.
 *
 * (Previous versions of this function called `createProfile`, which
 * `set`-with-merge'd null defaults from the seed user. That clobbered
 * the real user's weight/height/team/location/role/coachId on every
 * call. See `scripts/verify-seed.sh` for the regression test.)
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
