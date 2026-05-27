const {
  buildAdvisoryPayload,
  buildAdvisoryMessagePayload,
} = require('../advisoryOperations');

const baseInput = () => ({
  fromUid: 'coach1',
  toUid: 'athlete1',
  event: 'Birkebeineren 2026',
  eventDate: '2026-03-15',
  skiRecommendations: [
    {skiId: 'ski_primary', role: 'primary'},
  ],
});

describe('buildAdvisoryPayload — required fields', () => {
  test('happy path produces the canonical shape', () => {
    const out = buildAdvisoryPayload(baseInput());
    expect(out).toEqual({
      event: 'Birkebeineren 2026',
      eventDate: '2026-03-15',
      skiRecommendations: [{skiId: 'ski_primary', role: 'primary'}],
    });
    expect(out.conditions).toBeUndefined();
  });

  test('null / non-object input throws', () => {
    expect(() => buildAdvisoryPayload(null)).toThrow(/required/);
    expect(() => buildAdvisoryPayload(undefined)).toThrow(/required/);
    expect(() => buildAdvisoryPayload('hello')).toThrow(/required/);
  });

  test('blank event name → error', () => {
    expect(() =>
      buildAdvisoryPayload({...baseInput(), event: ''}),
    ).toThrow(/Event name is required/);
    expect(() =>
      buildAdvisoryPayload({...baseInput(), event: '   '}),
    ).toThrow(/Event name is required/);
  });

  test('event name length capped', () => {
    expect(() =>
      buildAdvisoryPayload({...baseInput(), event: 'x'.repeat(121)}),
    ).toThrow(/too long/);
  });

  test('event date validates ISO format', () => {
    expect(() =>
      buildAdvisoryPayload({...baseInput(), eventDate: 'March 15 2026'}),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      buildAdvisoryPayload({...baseInput(), eventDate: '2026-99-99'}),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      buildAdvisoryPayload({...baseInput(), eventDate: ''}),
    ).toThrow(/YYYY-MM-DD/);
  });

  test('eventDate is trimmed to yyyy-mm-dd even when given a full ISO timestamp', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      eventDate: '2026-03-15T12:00:00Z',
    });
    expect(out.eventDate).toBe('2026-03-15');
  });
});

describe('buildAdvisoryPayload — ski recommendations', () => {
  test('empty list → error', () => {
    expect(() =>
      buildAdvisoryPayload({...baseInput(), skiRecommendations: []}),
    ).toThrow(/at least one ski recommendation/);
  });

  test('non-array → error', () => {
    expect(() =>
      buildAdvisoryPayload({...baseInput(), skiRecommendations: null}),
    ).toThrow(/at least one/);
  });

  test('rejects entries missing skiId', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        skiRecommendations: [{role: 'primary'}],
      }),
    ).toThrow(/skiId/);
  });

  test('rejects unknown roles', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        skiRecommendations: [{skiId: 'a', role: 'tertiary'}],
      }),
    ).toThrow(/Role must be one of/);
  });

  test('defaults role to primary when omitted', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      skiRecommendations: [{skiId: 'a'}],
    });
    expect(out.skiRecommendations[0].role).toBe('primary');
  });

  test('rejects all-backup list (no primary)', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        skiRecommendations: [
          {skiId: 'a', role: 'backup'},
          {skiId: 'b', role: 'backup'},
        ],
      }),
    ).toThrow(/primary/);
  });

  test('rejects duplicate skiId', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        skiRecommendations: [
          {skiId: 'a', role: 'primary'},
          {skiId: 'a', role: 'backup'},
        ],
      }),
    ).toThrow(/listed more than once/);
  });

  test('per-ski notes survive + are trimmed / length-capped', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      skiRecommendations: [
        {skiId: 'a', role: 'primary', notes: '  switch in warm \n'},
        {skiId: 'b', role: 'backup', notes: 'x'.repeat(500)},
      ],
    });
    expect(out.skiRecommendations[0].notes).toBe('switch in warm');
    expect(out.skiRecommendations[1].notes.length).toBeLessThanOrEqual(300);
  });
});

describe('buildAdvisoryPayload — conditions block', () => {
  test('omitted conditions stay out of the payload', () => {
    const out = buildAdvisoryPayload(baseInput());
    expect(out.conditions).toBeUndefined();
  });

  test('empty conditions object also yields no conditions key', () => {
    const out = buildAdvisoryPayload({...baseInput(), conditions: {}});
    expect(out.conditions).toBeUndefined();
  });

  test('partial conditions survive — only set fields appear', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      conditions: {snowType: 'cold', notes: 'just groomed'},
    });
    expect(out.conditions).toEqual({snowType: 'cold', notes: 'just groomed'});
  });

  test('lowercases snowType', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      conditions: {snowType: 'Cold'},
    });
    expect(out.conditions.snowType).toBe('cold');
  });

  test('rejects invalid snowType', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        conditions: {snowType: 'banana'},
      }),
    ).toThrow(/Snow type must be one of/);
  });

  test('temperature fields accept negatives + strings', () => {
    const out = buildAdvisoryPayload({
      ...baseInput(),
      conditions: {snowTemperature: '-8', airTemperature: -10},
    });
    expect(out.conditions.snowTemperature).toBe(-8);
    expect(out.conditions.airTemperature).toBe(-10);
  });

  test('non-numeric temperature → error', () => {
    expect(() =>
      buildAdvisoryPayload({
        ...baseInput(),
        conditions: {snowTemperature: 'chilly'},
      }),
    ).toThrow(/number/);
  });

  test('humidity 0..100 range', () => {
    expect(
      buildAdvisoryPayload({...baseInput(), conditions: {humidity: 0}})
        .conditions.humidity,
    ).toBe(0);
    expect(
      buildAdvisoryPayload({...baseInput(), conditions: {humidity: 100}})
        .conditions.humidity,
    ).toBe(100);
    expect(() =>
      buildAdvisoryPayload({...baseInput(), conditions: {humidity: 120}}),
    ).toThrow(/between 0 and 100/);
    expect(() =>
      buildAdvisoryPayload({...baseInput(), conditions: {humidity: -5}}),
    ).toThrow(/between 0 and 100/);
  });

  test('newSnow coerces to boolean', () => {
    expect(
      buildAdvisoryPayload({...baseInput(), conditions: {newSnow: 1}})
        .conditions.newSnow,
    ).toBe(true);
    expect(
      buildAdvisoryPayload({...baseInput(), conditions: {newSnow: 0}})
        .conditions.newSnow,
    ).toBe(false);
  });

  test('notes are trimmed + length-capped', () => {
    const long = '   ' + 'a'.repeat(600) + '   ';
    const out = buildAdvisoryPayload({
      ...baseInput(),
      conditions: {notes: long},
    });
    expect(out.conditions.notes.startsWith('a')).toBe(true);
    expect(out.conditions.notes.length).toBeLessThanOrEqual(500);
  });
});

describe('buildAdvisoryMessagePayload — composition with the message builder', () => {
  test('happy path produces a Firestore-ready doc', () => {
    const out = buildAdvisoryMessagePayload(baseInput());
    expect(out).toMatchObject({
      fromUid: 'coach1',
      toUid: 'athlete1',
      type: 'advisory',
      read: false,
      attachedSkiIds: ['ski_primary'],
      advisory: {event: 'Birkebeineren 2026', eventDate: '2026-03-15'},
    });
    expect(out.subject).toContain('Birkebeineren 2026');
  });

  test('attachedSkiIds comes from the recommendations list', () => {
    const out = buildAdvisoryMessagePayload({
      ...baseInput(),
      skiRecommendations: [
        {skiId: 'A', role: 'primary'},
        {skiId: 'B', role: 'backup'},
      ],
    });
    expect(out.attachedSkiIds).toEqual(['A', 'B']);
  });

  test('caller-supplied subject + body win over the defaults', () => {
    const out = buildAdvisoryMessagePayload({
      ...baseInput(),
      subject: 'Last call before Sunday',
      body: 'Snow turned soft overnight — see updated plan.',
    });
    expect(out.subject).toBe('Last call before Sunday');
    expect(out.body).toContain('Snow turned soft');
  });

  test('default body falls back to the event name', () => {
    const out = buildAdvisoryMessagePayload(baseInput());
    expect(out.body).toBe('Birkebeineren 2026');
  });

  test('inherits the same fromUid/toUid checks as buildMessageCreatePayload', () => {
    expect(() =>
      buildAdvisoryMessagePayload({...baseInput(), fromUid: ''}),
    ).toThrow(/fromUid and toUid/);
    expect(() =>
      buildAdvisoryMessagePayload({
        ...baseInput(),
        fromUid: 'athlete1',
        toUid: 'athlete1',
      }),
    ).toThrow(/yourself/);
  });
});

describe('exposed via @nordicfleet/core barrel', () => {
  test('both builders are re-exported', () => {
    const core = require('../../');
    expect(typeof core.buildAdvisoryPayload).toBe('function');
    expect(typeof core.buildAdvisoryMessagePayload).toBe('function');
  });
});
