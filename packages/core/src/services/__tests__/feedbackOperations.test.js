const {
  buildFeedbackEmail,
  buildFeedbackMailto,
} = require('../feedbackOperations');

describe('buildFeedbackEmail', () => {
  test('defaults to beta feedback and embeds build + platform', () => {
    const {subject, body} = buildFeedbackEmail({
      buildTag: 'implementation-pass-1',
      platform: 'ios',
    });
    expect(subject).toBe('NordicFleet beta feedback');
    expect(body).toContain('Build: implementation-pass-1');
    expect(body).toContain('Platform: ios');
  });

  test('bug kind changes the subject and prompt', () => {
    const {subject, body} = buildFeedbackEmail({kind: 'bug', buildTag: 't'});
    expect(subject).toBe('NordicFleet bug report');
    expect(body).toContain('Describe the problem');
  });

  test('uses placeholders when build / platform are missing', () => {
    const {body} = buildFeedbackEmail({});
    expect(body).toContain('Build: unknown');
    expect(body).toContain('Platform: unknown');
  });

  test('no em dashes in user-facing copy', () => {
    const {subject, body} = buildFeedbackEmail({kind: 'bug'});
    expect(subject).not.toMatch(/—/);
    expect(body).not.toMatch(/—/);
  });
});

describe('buildFeedbackMailto', () => {
  test('builds a mailto with encoded subject + body', () => {
    const uri = buildFeedbackMailto('beta@x.example', {
      buildTag: 't',
      platform: 'ios',
    });
    expect(uri.startsWith('mailto:beta@x.example?')).toBe(true);
    expect(uri).toContain('subject=NordicFleet%20beta%20feedback');
    expect(uri).toContain('body=');
  });

  test('returns empty string when no recipient is given', () => {
    expect(buildFeedbackMailto('', {buildTag: 't'})).toBe('');
    expect(buildFeedbackMailto(null)).toBe('');
  });
});
