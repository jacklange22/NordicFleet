const {
  buildMessageCreatePayload,
  buildMarkReadPayload,
} = require('../messageOperations');

describe('buildMessageCreatePayload', () => {
  test('requires fromUid + toUid + non-empty body', () => {
    expect(() =>
      buildMessageCreatePayload({fromUid: '', toUid: 'a', body: 'x'}),
    ).toThrow();
    expect(() =>
      buildMessageCreatePayload({fromUid: 'c', toUid: '', body: 'x'}),
    ).toThrow();
    expect(() =>
      buildMessageCreatePayload({fromUid: 'c', toUid: 'a', body: '   '}),
    ).toThrow(/body is required/);
  });

  test('rejects self-send', () => {
    expect(() =>
      buildMessageCreatePayload({fromUid: 'x', toUid: 'x', body: 'hi'}),
    ).toThrow(/yourself/);
  });

  test('trims body and clamps subject length', () => {
    const out = buildMessageCreatePayload({
      fromUid: 'c',
      toUid: 'a',
      body: '  hello  ',
      subject: 'x'.repeat(200),
    });
    expect(out.body).toBe('hello');
    expect(out.subject.length).toBe(120);
  });

  test('subject is null when missing', () => {
    const out = buildMessageCreatePayload({
      fromUid: 'c',
      toUid: 'a',
      body: 'x',
    });
    expect(out.subject).toBeNull();
  });

  test('attachedSkiIds defaults to []', () => {
    const out = buildMessageCreatePayload({
      fromUid: 'c',
      toUid: 'a',
      body: 'x',
    });
    expect(out.attachedSkiIds).toEqual([]);
  });

  test('attachedSkiIds drops non-string entries', () => {
    const out = buildMessageCreatePayload({
      fromUid: 'c',
      toUid: 'a',
      body: 'x',
      attachedSkiIds: ['s1', '', null, 's2'],
    });
    expect(out.attachedSkiIds).toEqual(['s1', 's2']);
  });

  test('read defaults to false', () => {
    const out = buildMessageCreatePayload({
      fromUid: 'c',
      toUid: 'a',
      body: 'x',
    });
    expect(out.read).toBe(false);
  });
});

describe('buildMarkReadPayload', () => {
  test('returns {read: true}', () => {
    expect(buildMarkReadPayload()).toEqual({read: true});
  });
});
