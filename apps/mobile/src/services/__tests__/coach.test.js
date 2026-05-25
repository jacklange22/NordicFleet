import firestoreMock from '@react-native-firebase/firestore';
import {
  createProfile,
  getProfile,
  findProfileByEmail,
  findCoachByEmail,
  setCoachByEmail,
  removeCoach,
  listAthletesForCoach,
  subscribeAthletesForCoach,
} from '../userService';
import {listSkisForAthlete} from '../skiService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('coach data model', () => {
  describe('createProfile', () => {
    it('defaults role to "athlete"', async () => {
      await createProfile('u1', {email: 'a@b.com'});
      const p = await getProfile('u1');
      expect(p.role).toBe('athlete');
      expect(p.coachId).toBeNull();
    });

    it('accepts role: "coach" and coachId stays null', async () => {
      await createProfile('coach1', {email: 'c@b.com', role: 'coach'});
      const p = await getProfile('coach1');
      expect(p.role).toBe('coach');
      expect(p.coachId).toBeNull();
    });

    it('coerces invalid role to "athlete"', async () => {
      await createProfile('u2', {email: 'a@b.com', role: 'admin'});
      const p = await getProfile('u2');
      expect(p.role).toBe('athlete');
    });
  });

  describe('findProfileByEmail', () => {
    it('returns null for unknown email', async () => {
      const p = await findProfileByEmail('ghost@example.com');
      expect(p).toBeNull();
    });

    it('returns the profile for an exact match', async () => {
      firestoreMock.__seedDoc('users/u1', {email: 'a@b.com', role: 'athlete'});
      const p = await findProfileByEmail('a@b.com');
      expect(p.uid).toBe('u1');
    });

    it('returns null for missing email arg', async () => {
      expect(await findProfileByEmail()).toBeNull();
      expect(await findProfileByEmail('')).toBeNull();
    });
  });

  describe('findCoachByEmail', () => {
    it('returns null when an athlete has the email', async () => {
      firestoreMock.__seedDoc('users/u1', {email: 'a@b.com', role: 'athlete'});
      expect(await findCoachByEmail('a@b.com')).toBeNull();
    });

    it('returns the coach when role matches', async () => {
      firestoreMock.__seedDoc('users/u1', {email: 'c@b.com', role: 'coach'});
      const p = await findCoachByEmail('c@b.com');
      expect(p.uid).toBe('u1');
      expect(p.role).toBe('coach');
    });

    it('returns null for missing email', async () => {
      expect(await findCoachByEmail()).toBeNull();
    });
  });

  describe('setCoachByEmail', () => {
    it("sets the athlete's coachId on success", async () => {
      await createProfile('athlete1', {email: 'ath@b.com', role: 'athlete'});
      await createProfile('coach1', {email: 'coach@b.com', role: 'coach'});

      const result = await setCoachByEmail('athlete1', 'coach@b.com');
      expect(result.coachUid).toBe('coach1');

      const athlete = await getProfile('athlete1');
      expect(athlete.coachId).toBe('coach1');
    });

    it('rejects unknown email with coach/not-found', async () => {
      await createProfile('athlete1', {email: 'ath@b.com'});
      await expect(
        setCoachByEmail('athlete1', 'nobody@b.com'),
      ).rejects.toMatchObject({code: 'coach/not-found'});
    });

    it('rejects non-coach target with coach/not-found', async () => {
      // findCoachByEmail filters by role==coach, so an athlete email
      // looks identical to a non-existent one from the caller's view.
      await createProfile('athlete1', {email: 'ath@b.com'});
      await createProfile('athlete2', {email: 'other@b.com', role: 'athlete'});
      await expect(
        setCoachByEmail('athlete1', 'other@b.com'),
      ).rejects.toMatchObject({code: 'coach/not-found'});
    });

    it('rejects self-link with coach/self-link', async () => {
      await createProfile('me', {email: 'me@b.com', role: 'coach'});
      await expect(setCoachByEmail('me', 'me@b.com')).rejects.toMatchObject({
        code: 'coach/self-link',
      });
    });

    it('throws on missing args', async () => {
      await expect(setCoachByEmail()).rejects.toThrow('athleteUid is required');
      await expect(setCoachByEmail('a1')).rejects.toThrow(
        'coachEmail is required',
      );
    });
  });

  describe('removeCoach', () => {
    it("clears the athlete's coachId", async () => {
      await createProfile('athlete1', {email: 'ath@b.com'});
      await createProfile('coach1', {email: 'coach@b.com', role: 'coach'});
      await setCoachByEmail('athlete1', 'coach@b.com');

      await removeCoach('athlete1');

      const a = await getProfile('athlete1');
      expect(a.coachId).toBeNull();
    });

    it('is a no-op when no coach is set', async () => {
      await createProfile('athlete1', {email: 'ath@b.com'});
      await removeCoach('athlete1');
      const a = await getProfile('athlete1');
      expect(a.coachId).toBeNull();
    });

    it('throws on missing uid', async () => {
      await expect(removeCoach()).rejects.toThrow('athleteUid is required');
    });
  });

  describe('listAthletesForCoach', () => {
    it('returns [] when coach has no athletes', async () => {
      await createProfile('c1', {email: 'c@b.com', role: 'coach'});
      expect(await listAthletesForCoach('c1')).toEqual([]);
    });

    it('returns [] for missing uid', async () => {
      expect(await listAthletesForCoach()).toEqual([]);
    });

    it('returns the full profile for every linked athlete', async () => {
      await createProfile('c1', {email: 'c@b.com', role: 'coach'});
      await createProfile('a1', {email: 'a1@b.com'});
      await createProfile('a2', {email: 'a2@b.com'});
      await setCoachByEmail('a1', 'c@b.com');
      await setCoachByEmail('a2', 'c@b.com');

      const list = await listAthletesForCoach('c1');
      const emails = list.map(p => p.email).sort();
      expect(emails).toEqual(['a1@b.com', 'a2@b.com']);
    });
  });

  describe('subscribeAthletesForCoach', () => {
    it('fires with empty array for missing uid', () => {
      const cb = jest.fn();
      const unsub = subscribeAthletesForCoach(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe('function');
    });

    it('returns an unsubscribe function', () => {
      const cb = jest.fn();
      const unsub = subscribeAthletesForCoach('c1', cb);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('listSkisForAthlete', () => {
    it('reads athlete skis via the existing listSkis path', async () => {
      firestoreMock.__seedDoc('users/a1/skis/s1', {name: 'A1 ski'});
      const skis = await listSkisForAthlete('coach1', 'a1');
      expect(skis.length).toBe(1);
      expect(skis[0].name).toBe('A1 ski');
    });
  });
});
