const {
  scrubErrorForReport,
  ALLOWED_CONTEXT_KEYS,
} = require('../errorReport');

describe('scrubErrorForReport', () => {
  test('extracts name/message/code/stack from an Error', () => {
    const e = new Error('boom');
    e.code = 'auth/keychain-error';
    const out = scrubErrorForReport(e, {platform: 'ios'});
    expect(out.name).toBe('Error');
    expect(out.message).toBe('boom');
    expect(out.code).toBe('auth/keychain-error');
    expect(typeof out.stack).toBe('string');
    expect(typeof out.at).toBe('string');
  });

  test('handles string + null errors without throwing', () => {
    expect(scrubErrorForReport('just a string').message).toBe('just a string');
    expect(scrubErrorForReport(null).message).toBe('Unknown error');
    expect(scrubErrorForReport(undefined).name).toBe('Error');
  });

  test('only allow-listed context keys survive', () => {
    const out = scrubErrorForReport(new Error('x'), {
      platform: 'web',
      isCoach: true,
      screen: 'WaxTestRunner',
      // everything below must be stripped (PII vectors):
      email: 'jo@example.com',
      skierName: 'Jo Skier',
      message: 'secret coach note',
      waxNotes: 'my hand mix',
      location: {lat: 1, lng: 2},
      skis: [{serial: 'ABC123'}],
    });
    expect(out.context).toEqual({
      platform: 'web',
      isCoach: true,
      screen: 'WaxTestRunner',
    });
    // Explicitly assert the PII keys are gone.
    for (const k of ['email', 'skierName', 'message', 'waxNotes', 'location', 'skis']) {
      expect(out.context[k]).toBeUndefined();
    }
  });

  test('drops object/array values even on allow-listed keys', () => {
    const out = scrubErrorForReport(new Error('x'), {
      // someone tries to smuggle an object through an allowed key
      code: {nested: 'should-drop'},
      action: ['array', 'should-drop'],
      screen: 'OK',
    });
    expect(out.context.code).toBeUndefined();
    expect(out.context.action).toBeUndefined();
    expect(out.context.screen).toBe('OK');
  });

  test('truncates very long messages', () => {
    const long = 'a'.repeat(2000);
    const out = scrubErrorForReport(new Error(long));
    expect(out.message.length).toBeLessThan(600);
    expect(out.message.endsWith('…[truncated]')).toBe(true);
  });

  test('ALLOWED_CONTEXT_KEYS excludes obvious PII', () => {
    for (const banned of ['email', 'name', 'displayName', 'notes', 'location', 'message', 'serial']) {
      expect(ALLOWED_CONTEXT_KEYS).not.toContain(banned);
    }
  });
});
