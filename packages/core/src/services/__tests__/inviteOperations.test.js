const {
  parseEmailList,
  buildInviteLink,
  buildInviteEmail,
  buildInviteMailto,
} = require('../inviteOperations');

describe('parseEmailList', () => {
  test('splits on commas, semicolons, whitespace and newlines', () => {
    const {emails} = parseEmailList(
      'a@b.com, c@d.com; e@f.com\n g@h.com',
    );
    expect(emails).toEqual(['a@b.com', 'c@d.com', 'e@f.com', 'g@h.com']);
  });

  test('lowercases and de-duplicates, preserving first-seen order', () => {
    const {emails} = parseEmailList('B@x.com, a@x.com, b@x.com');
    expect(emails).toEqual(['b@x.com', 'a@x.com']);
  });

  test('buckets invalid tokens separately', () => {
    const {emails, invalid} = parseEmailList('good@x.com, nope, also-bad@');
    expect(emails).toEqual(['good@x.com']);
    expect(invalid).toEqual(['nope', 'also-bad@']);
  });

  test('empty / non-string input yields empty buckets', () => {
    expect(parseEmailList('')).toEqual({emails: [], invalid: []});
    expect(parseEmailList(null)).toEqual({emails: [], invalid: []});
  });
});

describe('buildInviteLink', () => {
  test('appends an /invite path with coach params', () => {
    expect(
      buildInviteLink('https://site.example', {coachId: 'c1', coachName: 'Pat'}),
    ).toBe('https://site.example/invite?coach=c1&name=Pat');
  });

  test('trims a trailing slash and omits empty params', () => {
    expect(buildInviteLink('https://site.example/', {})).toBe(
      'https://site.example/invite',
    );
  });

  test('url-encodes param values', () => {
    expect(buildInviteLink('https://s.example', {coachName: 'A B'})).toContain(
      'name=A%20B',
    );
  });
});

describe('buildInviteEmail', () => {
  test('names the coach in the subject and body when provided', () => {
    const {subject, body} = buildInviteEmail({
      coachName: 'Coach Pat',
      inviteLink: 'https://s.example/invite?coach=c1',
    });
    expect(subject).toBe('Coach Pat invited you to NordicFleet');
    expect(body).toContain('Coach Pat wants to coach your skis');
    expect(body).toContain('https://s.example/invite?coach=c1');
  });

  test('falls back to a generic message with no coach name', () => {
    const {subject, body} = buildInviteEmail({});
    expect(subject).toBe('You are invited to NordicFleet');
    expect(body).toContain('You have been invited');
  });

  test('uses no em dashes in user-facing copy', () => {
    const {subject, body} = buildInviteEmail({coachName: 'X'});
    expect(subject).not.toMatch(/—/);
    expect(body).not.toMatch(/—/);
  });
});

describe('buildInviteMailto', () => {
  test('joins recipients and encodes subject + body', () => {
    const uri = buildInviteMailto(['a@x.com', 'b@x.com'], {coachName: 'Pat'});
    expect(uri.startsWith('mailto:a@x.com,b@x.com?')).toBe(true);
    expect(uri).toContain('subject=Pat%20invited%20you%20to%20NordicFleet');
    expect(uri).toContain('body=');
  });

  test('accepts a single string recipient', () => {
    const uri = buildInviteMailto('solo@x.com', {});
    expect(uri.startsWith('mailto:solo@x.com?')).toBe(true);
  });
});
