const {
  buildDataExport,
  dataExportToJSON,
  dataExportFilename,
  EXPORT_VERSION,
} = require('../dataExport');

// A fake Firestore Timestamp (has toDate()).
const ts = iso => ({toDate: () => new Date(iso)});

describe('buildDataExport', () => {
  test('assembles the envelope with counts', () => {
    const out = buildDataExport({
      uid: 'u1',
      profile: {uid: 'u1', displayName: 'Jo'},
      skis: [{id: 's1', name: 'Speedmax'}],
      waxLogs: [{id: 'w1'}, {id: 'w2'}],
      testLogs: [],
      waxTests: [{id: 't1'}],
    });
    expect(out.app).toBe('NordicFleet');
    expect(out.exportVersion).toBe(EXPORT_VERSION);
    expect(out.uid).toBe('u1');
    expect(out.counts).toEqual({skis: 1, waxLogs: 2, testLogs: 0, waxTests: 1});
    expect(out.skis).toHaveLength(1);
    expect(typeof out.exportedAt).toBe('string');
  });

  test('converts Firestore Timestamps to ISO strings', () => {
    const out = buildDataExport({
      skis: [{id: 's1', createdAt: ts('2026-01-02T03:04:05.000Z')}],
    });
    expect(out.skis[0].createdAt).toBe('2026-01-02T03:04:05.000Z');
  });

  test('converts {seconds,nanoseconds} timestamps too', () => {
    const out = buildDataExport({
      testLogs: [{id: 't1', date: {seconds: 1735790645, nanoseconds: 0}}],
    });
    expect(typeof out.testLogs[0].date).toBe('string');
    expect(out.testLogs[0].date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('falls back to profile.uid when no uid given', () => {
    const out = buildDataExport({profile: {uid: 'p9'}});
    expect(out.uid).toBe('p9');
  });

  test('tolerates missing collections', () => {
    const out = buildDataExport({});
    expect(out.counts).toEqual({skis: 0, waxLogs: 0, testLogs: 0, waxTests: 0});
    expect(out.profile).toBeNull();
  });

  test('respects an explicit exportedAt', () => {
    const out = buildDataExport({exportedAt: '2026-05-29T00:00:00.000Z'});
    expect(out.exportedAt).toBe('2026-05-29T00:00:00.000Z');
  });
});

describe('dataExportToJSON + filename', () => {
  test('round-trips to valid JSON', () => {
    const out = buildDataExport({skis: [{id: 's1'}]});
    const json = dataExportToJSON(out);
    const parsed = JSON.parse(json);
    expect(parsed.skis[0].id).toBe('s1');
  });

  test('filename uses the export date', () => {
    const out = buildDataExport({exportedAt: '2026-05-29T12:00:00.000Z'});
    expect(dataExportFilename(out)).toBe('nordicfleet-export-2026-05-29.json');
  });
});
