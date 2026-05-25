import firestoreMock from '@react-native-firebase/firestore';
import {seedCurrentUser} from '../seed';
import {listSkis, getSki} from '../skiService';
import {getProfile, updateProfile} from '../userService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('seedCurrentUser', () => {
  it('throws when uid is missing', async () => {
    await expect(seedCurrentUser()).rejects.toThrow('uid is required');
  });

  it('seeds skis without touching the profile (additive only)', async () => {
    const result = await seedCurrentUser('u1');
    expect(result.created).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);
    // Seed must NOT create/clobber a profile doc.
    const profile = await getProfile('u1');
    expect(profile).toBeNull();
    const skis = await listSkis('u1');
    expect(skis.length).toBe(result.created);
  });

  it("does not overwrite the user's existing profile fields", async () => {
    // Set up a real user profile with role=coach + custom data.
    await updateProfile('u1', {
      email: 'real@user.com',
      role: 'coach',
      weight: 80,
      height: 185,
      team: 'My Real Team',
      location: 'Park City, UT',
      coachId: null,
    });
    const before = await getProfile('u1');

    await seedCurrentUser('u1');

    const after = await getProfile('u1');
    // Every profile field must be untouched.
    expect(after.email).toBe(before.email);
    expect(after.role).toBe('coach');
    expect(after.weight).toBe(80);
    expect(after.height).toBe(185);
    expect(after.team).toBe('My Real Team');
    expect(after.location).toBe('Park City, UT');
  });

  it("does not touch the user's existing wax / test logs", async () => {
    // Pre-seed a wax log and a test log.
    firestoreMock.__seedDoc('users/u1/waxLogs/preexisting', {
      skiId: 'real-ski',
      kickWax: 'VR40',
    });
    firestoreMock.__seedDoc('users/u1/testLogs/preexisting', {
      skiId: 'real-ski',
      glideRating: 9,
    });

    await seedCurrentUser('u1');

    const store = firestoreMock.__getStore();
    expect(store.get('users/u1/waxLogs/preexisting')).toEqual(
      expect.objectContaining({skiId: 'real-ski', kickWax: 'VR40'}),
    );
    expect(store.get('users/u1/testLogs/preexisting')).toEqual(
      expect.objectContaining({skiId: 'real-ski', glideRating: 9}),
    );
  });

  it('is idempotent — second call skips all skis', async () => {
    const first = await seedCurrentUser('u1');
    const second = await seedCurrentUser('u1');
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(first.created);
    const skis = await listSkis('u1');
    expect(skis.length).toBe(first.created);
  });

  it("does not delete or modify the user's real (non-seed) skis", async () => {
    // Pre-seed a real ski that has no seedId.
    firestoreMock.__seedDoc('users/u1/skis/real', {
      name: 'My real ski',
      technique: 'classic',
    });
    await seedCurrentUser('u1');
    const skis = await listSkis('u1');
    const realSki = skis.find(s => s.id === 'real');
    expect(realSki).toBeDefined();
    expect(realSki.name).toBe('My real ski');
  });

  it('records seedId on each ski', async () => {
    await seedCurrentUser('u1');
    const skis = await listSkis('u1');
    for (const ski of skis) {
      expect(typeof ski.seedId).toBe('string');
      const refetched = await getSki('u1', ski.id);
      expect(refetched.seedId).toBe(ski.seedId);
    }
  });

  it('skips only already-seeded skis on partial reseed', async () => {
    firestoreMock.__seedDoc('users/u1/skis/manual', {
      name: 'Already here',
      seedId: '334',
    });
    const result = await seedCurrentUser('u1');
    expect(result.skipped).toBe(1);
    expect(result.created).toBeGreaterThan(0);
  });
});
