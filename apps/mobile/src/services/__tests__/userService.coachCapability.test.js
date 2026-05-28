import firestoreMock from '@react-native-firebase/firestore';
import {
  createProfile,
  setCoachCapability,
  backfillCoachCapability,
  getProfile,
} from '../userService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('createProfile — capability model', () => {
  it('defaults new users to non-coach with the role mirror', async () => {
    await createProfile('u1', {email: 'a@b.com'});
    const doc = firestoreMock.__getStore().get('users/u1');
    expect(doc.isCoach).toBe(false);
    expect(doc.role).toBe('athlete');
  });

  it('honors isCoach:true and mirrors role', async () => {
    await createProfile('c1', {email: 'c@b.com', isCoach: true});
    const doc = firestoreMock.__getStore().get('users/c1');
    expect(doc.isCoach).toBe(true);
    expect(doc.role).toBe('coach');
  });

  it('still accepts the legacy role:coach input', async () => {
    await createProfile('c2', {email: 'c2@b.com', role: 'coach'});
    const doc = firestoreMock.__getStore().get('users/c2');
    expect(doc.isCoach).toBe(true);
    expect(doc.role).toBe('coach');
  });
});

describe('backfillCoachCapability — migrate on read', () => {
  it('writes isCoach derived from legacy role when missing', async () => {
    firestoreMock.__seedDoc('users/legacy', {email: 'l@b.com', role: 'coach'});
    const profile = await getProfile('legacy');
    const isCoach = await backfillCoachCapability('legacy', profile);
    expect(isCoach).toBe(true);
    expect(firestoreMock.__getStore().get('users/legacy').isCoach).toBe(true);
  });

  it('no-ops when isCoach already present', async () => {
    firestoreMock.__seedDoc('users/modern', {
      email: 'm@b.com',
      isCoach: false,
      role: 'athlete',
    });
    const profile = await getProfile('modern');
    const isCoach = await backfillCoachCapability('modern', profile);
    expect(isCoach).toBe(false);
    expect(firestoreMock.__getStore().get('users/modern').isCoach).toBe(false);
  });
});

describe('setCoachCapability', () => {
  it('enabling flips isCoach + role without touching athletes', async () => {
    firestoreMock.__seedDoc('users/u1', {
      email: 'u@b.com',
      isCoach: false,
      role: 'athlete',
    });
    const {clearedAthletes} = await setCoachCapability('u1', true);
    const doc = firestoreMock.__getStore().get('users/u1');
    expect(doc.isCoach).toBe(true);
    expect(doc.role).toBe('coach');
    expect(clearedAthletes).toBe(0);
  });

  it('disabling cascades — unlinks every athlete pointing at the coach', async () => {
    firestoreMock.__seedDoc('users/coach1', {
      email: 'coach@b.com',
      isCoach: true,
      role: 'coach',
    });
    firestoreMock.__seedDoc('users/ath1', {email: 'a1@b.com', coachId: 'coach1'});
    firestoreMock.__seedDoc('users/ath2', {email: 'a2@b.com', coachId: 'coach1'});
    firestoreMock.__seedDoc('users/other', {email: 'o@b.com', coachId: 'someoneelse'});

    const {clearedAthletes} = await setCoachCapability('coach1', false);

    const store = firestoreMock.__getStore();
    expect(store.get('users/coach1').isCoach).toBe(false);
    expect(store.get('users/coach1').role).toBe('athlete');
    expect(clearedAthletes).toBe(2);
    // The two linked athletes lose their coachId…
    expect(store.get('users/ath1').coachId).toBeNull();
    expect(store.get('users/ath2').coachId).toBeNull();
    // …but an athlete linked to a DIFFERENT coach is untouched.
    expect(store.get('users/other').coachId).toBe('someoneelse');
  });

  it('rejects without a uid', async () => {
    await expect(setCoachCapability()).rejects.toThrow(/uid is required/);
  });
});
