import firestoreMock from '@react-native-firebase/firestore';
import {seedCurrentUser} from '../seed';
import {listSkis, getSki} from '../skiService';
import {getProfile} from '../userService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('seedCurrentUser', () => {
  it('throws when uid is missing', async () => {
    await expect(seedCurrentUser()).rejects.toThrow('uid is required');
  });

  it('creates profile and seeds skis on first run', async () => {
    const result = await seedCurrentUser('u1');
    expect(result.created).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);
    const profile = await getProfile('u1');
    expect(profile).not.toBeNull();
    expect(profile.email).toBe('user1@example.com');
    const skis = await listSkis('u1');
    expect(skis.length).toBe(result.created);
  });

  it('is idempotent — second call skips all skis', async () => {
    const first = await seedCurrentUser('u1');
    const second = await seedCurrentUser('u1');
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(first.created);
    const skis = await listSkis('u1');
    expect(skis.length).toBe(first.created);
  });

  it('records seedId on each ski', async () => {
    await seedCurrentUser('u1');
    const skis = await listSkis('u1');
    for (const ski of skis) {
      expect(typeof ski.seedId).toBe('string');
      // Sanity check round-trip read.
      const refetched = await getSki('u1', ski.id);
      expect(refetched.seedId).toBe(ski.seedId);
    }
  });

  it('skips only already-seeded skis on partial reseed', async () => {
    // Pre-seed one of the ski ids directly to simulate a partial state.
    firestoreMock.__seedDoc('users/u1/skis/manual', {
      name: 'Already here',
      seedId: '334', // matches first seedData ski
    });
    const result = await seedCurrentUser('u1');
    expect(result.skipped).toBe(1);
    expect(result.created).toBeGreaterThan(0);
  });
});
