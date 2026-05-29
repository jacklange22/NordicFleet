const {
  ANALYTICS_EVENTS,
  SAFE_PROPERTY_KEYS,
  countBucket,
  buildAnalyticsEvent,
} = require('../analytics');

describe('countBucket', () => {
  test('bucket boundaries', () => {
    expect(countBucket(0)).toBe('0');
    expect(countBucket(-3)).toBe('0');
    expect(countBucket(1)).toBe('1-5');
    expect(countBucket(5)).toBe('1-5');
    expect(countBucket(6)).toBe('6-15');
    expect(countBucket(15)).toBe('6-15');
    expect(countBucket(16)).toBe('16+');
    expect(countBucket(999)).toBe('16+');
  });
  test('non-numbers → 0 bucket', () => {
    expect(countBucket(undefined)).toBe('0');
    expect(countBucket(NaN)).toBe('0');
    expect(countBucket('abc')).toBe('0');
  });
});

describe('buildAnalyticsEvent', () => {
  test('shapes a valid event with only safe props', () => {
    const e = buildAnalyticsEvent(ANALYTICS_EVENTS.SKI_ADDED, {
      platform: 'ios',
      isCoach: false,
      ski_count_bucket: '1-5',
    });
    expect(e.name).toBe('ski_added');
    expect(e.params).toEqual({
      platform: 'ios',
      isCoach: false,
      ski_count_bucket: '1-5',
    });
  });

  test('drops any property not on the allow-list (PII vectors)', () => {
    const e = buildAnalyticsEvent(ANALYTICS_EVENTS.MESSAGE_SENT, {
      platform: 'web',
      // all of these must be dropped:
      email: 'jo@example.com',
      athleteName: 'Jo Skier',
      body: 'secret message',
      waxName: 'hand mix',
      serial: 'ABC123',
      lat: 1.23,
    });
    expect(e.params).toEqual({platform: 'web'});
    for (const k of ['email', 'athleteName', 'body', 'waxName', 'serial', 'lat']) {
      expect(e.params[k]).toBeUndefined();
    }
  });

  test('drops non-scalar values even on allowed keys', () => {
    const e = buildAnalyticsEvent(ANALYTICS_EVENTS.SKI_ADDED, {
      platform: 'ios',
      isCoach: {nested: true},
      ski_count_bucket: ['1-5'],
    });
    expect(e.params).toEqual({platform: 'ios'});
  });

  test('throws on an unknown event name', () => {
    expect(() => buildAnalyticsEvent('totally_made_up', {})).toThrow(
      /Unknown analytics event/,
    );
  });

  test('all 13 required events exist', () => {
    const names = Object.values(ANALYTICS_EVENTS);
    for (const required of [
      'sign_up_completed',
      'ski_added',
      'ski_import_started',
      'ski_import_completed',
      'wax_log_created',
      'test_log_created',
      'wax_truck_test_created',
      'wax_truck_winner_selected',
      'coach_mode_enabled',
      'coach_request_sent',
      'message_sent',
      'data_export_requested',
      'account_deleted',
    ]) {
      expect(names).toContain(required);
    }
  });

  test('SAFE_PROPERTY_KEYS excludes obvious PII', () => {
    for (const banned of ['email', 'name', 'body', 'waxName', 'serial', 'lat', 'lng']) {
      expect(SAFE_PROPERTY_KEYS).not.toContain(banned);
    }
  });
});
