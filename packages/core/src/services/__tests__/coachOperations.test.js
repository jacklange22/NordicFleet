const {
  buildCoachRequestCreatePayload,
  buildCoachRequestStatusPayload,
} = require('../coachOperations');

describe('buildCoachRequestCreatePayload', () => {
  const valid = {
    athleteUid: 'ath',
    athleteEmail: 'Ath@example.com',
    coachUid: 'coach',
    coachEmail: 'Coach@example.com',
  };

  test('requires athleteUid and coachUid', () => {
    expect(() =>
      buildCoachRequestCreatePayload({...valid, athleteUid: ''}),
    ).toThrow();
    expect(() =>
      buildCoachRequestCreatePayload({...valid, coachUid: ''}),
    ).toThrow();
  });

  test('rejects self-link', () => {
    expect(() =>
      buildCoachRequestCreatePayload({
        ...valid,
        coachUid: valid.athleteUid,
      }),
    ).toThrow(/own coach/);
  });

  test('rejects invalid emails', () => {
    expect(() =>
      buildCoachRequestCreatePayload({...valid, coachEmail: 'not-email'}),
    ).toThrow(/coachEmail/);
    expect(() =>
      buildCoachRequestCreatePayload({...valid, athleteEmail: 'still bad'}),
    ).toThrow(/athleteEmail/);
  });

  test('normalizes emails to lowercase', () => {
    const out = buildCoachRequestCreatePayload(valid);
    expect(out.athleteEmail).toBe('ath@example.com');
    expect(out.coachEmail).toBe('coach@example.com');
  });

  test('starts as pending with no respondedAt', () => {
    const out = buildCoachRequestCreatePayload(valid);
    expect(out.status).toBe('pending');
    expect(out.respondedAt).toBeNull();
  });
});

describe('buildCoachRequestStatusPayload', () => {
  test.each([
    ['accept', 'accepted'],
    ['decline', 'declined'],
    ['cancel', 'cancelled'],
    ['end', 'ended'],
  ])('action %s → status %s', (action, status) => {
    expect(buildCoachRequestStatusPayload(action)).toEqual({status});
  });

  test('rejects unknown action', () => {
    expect(() => buildCoachRequestStatusPayload('shrug')).toThrow(/Unknown/);
  });
});
