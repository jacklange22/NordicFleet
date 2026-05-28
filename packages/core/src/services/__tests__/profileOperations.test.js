const {
  deriveIsCoach,
  needsCoachBackfill,
  buildProfileCreatePayload,
  buildCoachCapabilityPayload,
} = require('../profileOperations');

describe('deriveIsCoach', () => {
  test('reads isCoach when present', () => {
    expect(deriveIsCoach({isCoach: true})).toBe(true);
    expect(deriveIsCoach({isCoach: false})).toBe(false);
  });

  test('isCoach wins even when role disagrees', () => {
    expect(deriveIsCoach({isCoach: false, role: 'coach'})).toBe(false);
    expect(deriveIsCoach({isCoach: true, role: 'athlete'})).toBe(true);
  });

  test('falls back to legacy role when isCoach absent (migration window)', () => {
    expect(deriveIsCoach({role: 'coach'})).toBe(true);
    expect(deriveIsCoach({role: 'athlete'})).toBe(false);
    expect(deriveIsCoach({})).toBe(false);
  });

  test('null / non-object → false', () => {
    expect(deriveIsCoach(null)).toBe(false);
    expect(deriveIsCoach(undefined)).toBe(false);
    expect(deriveIsCoach('coach')).toBe(false);
  });
});

describe('needsCoachBackfill', () => {
  test('true only when isCoach is missing on a real profile', () => {
    expect(needsCoachBackfill({role: 'coach'})).toBe(true);
    expect(needsCoachBackfill({role: 'athlete'})).toBe(true);
    expect(needsCoachBackfill({})).toBe(true);
  });

  test('false when isCoach already present', () => {
    expect(needsCoachBackfill({isCoach: true})).toBe(false);
    expect(needsCoachBackfill({isCoach: false})).toBe(false);
  });

  test('false for null / non-object', () => {
    expect(needsCoachBackfill(null)).toBe(false);
    expect(needsCoachBackfill(undefined)).toBe(false);
  });
});

describe('buildProfileCreatePayload', () => {
  test('defaults to non-coach', () => {
    const out = buildProfileCreatePayload({email: 'a@b.com'});
    expect(out.isCoach).toBe(false);
    expect(out.role).toBe('athlete');
    expect(out.email).toBe('a@b.com');
    expect(out.coachId).toBeNull();
  });

  test('isCoach:true sets role mirror to coach', () => {
    const out = buildProfileCreatePayload({isCoach: true});
    expect(out.isCoach).toBe(true);
    expect(out.role).toBe('coach');
  });

  test('legacy role:coach input still produces isCoach:true', () => {
    const out = buildProfileCreatePayload({role: 'coach'});
    expect(out.isCoach).toBe(true);
    expect(out.role).toBe('coach');
  });

  test('passes through profile fields', () => {
    const out = buildProfileCreatePayload({
      email: 'x@y.com',
      displayName: 'X',
      weight: 70,
      height: 180,
      team: 'NTG',
      location: 'Oslo',
      coachId: 'coach1',
    });
    expect(out).toMatchObject({
      email: 'x@y.com',
      displayName: 'X',
      weight: 70,
      height: 180,
      team: 'NTG',
      location: 'Oslo',
      coachId: 'coach1',
    });
  });
});

describe('buildCoachCapabilityPayload', () => {
  test('enabling sets both isCoach + role mirror', () => {
    expect(buildCoachCapabilityPayload(true)).toEqual({
      isCoach: true,
      role: 'coach',
    });
  });

  test('disabling sets both back to athlete', () => {
    expect(buildCoachCapabilityPayload(false)).toEqual({
      isCoach: false,
      role: 'athlete',
    });
  });

  test('coerces truthy / falsy', () => {
    expect(buildCoachCapabilityPayload(1).isCoach).toBe(true);
    expect(buildCoachCapabilityPayload(0).isCoach).toBe(false);
  });
});

describe('@nordicfleet/core barrel re-exports', () => {
  test('all four helpers exposed', () => {
    const core = require('../../');
    expect(typeof core.deriveIsCoach).toBe('function');
    expect(typeof core.needsCoachBackfill).toBe('function');
    expect(typeof core.buildProfileCreatePayload).toBe('function');
    expect(typeof core.buildCoachCapabilityPayload).toBe('function');
  });
});
