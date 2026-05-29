// Integration: paste → parse → (apply mapping) → buildSkiCreatePayload.
// Proves the import flow's full pipeline produces Firestore-savable docs
// that pass the same Ski validator the iOS app uses.

const {
  parseSpreadsheet,
  applyMapping,
  buildSkiCreatePayload,
} = require('../../');

describe('import pipeline end-to-end', () => {
  test('TSV with full headers → parseable, savable docs', () => {
    const input = `Brand\tModel\tTechnique\tType\tLength\tFlex\tYear
Fischer\tSpeedmax\tClassic\tCold\t200cm\t90kg\t2024
Salomon\tS/Lab Carbon\tSkate\tCold\t192\t75\t23`;
    const parsed = parseSpreadsheet(input);
    expect(parsed.needsManualMapping).toBe(false);
    expect(parsed.rows.length).toBe(2);

    for (const row of parsed.rows) {
      expect(row.errors).toEqual([]);
      // The validator throws on invalid input. If this line doesn't throw,
      // the row would have been accepted by Firestore writes too.
      const payload = buildSkiCreatePayload(row.data);
      expect(payload.name).toBeTruthy();
      expect(['classic', 'skate']).toContain(payload.technique);
      expect(['cold', 'universal', 'warm', 'zero']).toContain(payload.type);
    }

    // Specific value sanity (unit stripping + 2-digit year)
    expect(parsed.rows[0].data.length).toBe(200);
    expect(parsed.rows[0].data.flex).toBe(90);
    expect(parsed.rows[0].data.year).toBe(2024);
    expect(parsed.rows[1].data.year).toBe(2023);
  });

  test('CSV without snow-type column → type defaults to universal', () => {
    const input = `Brand,Model,Technique,Length
Fischer,Speedmax,Classic,200
Madshus,Redline,Skate,192`;
    const parsed = parseSpreadsheet(input);
    expect(parsed.needsManualMapping).toBe(false);
    for (const row of parsed.rows) {
      expect(row.errors).toEqual([]);
      const payload = buildSkiCreatePayload(row.data);
      expect(payload.type).toBe('universal');
    }
  });

  test('no header → manual mapping → savable docs', () => {
    // Pretend the user pasted bare data (no headers), then went through
    // the manual-mapping step in the UI.
    const input = `Fischer\tSpeedmax\tClassic\t200
Salomon\tS/Lab\tSkate\t192`;
    const parsed = parseSpreadsheet(input);
    expect(parsed.needsManualMapping).toBe(true);
    expect(parsed.headers).toEqual([]);

    // User picks the mapping by hand.
    const userMapping = ['brand', 'model', 'technique', 'length'];
    const remapped = applyMapping(
      parsed.rows.map(r => r.raw),
      userMapping,
    );
    for (const row of remapped) {
      expect(row.errors).toEqual([]);
      const payload = buildSkiCreatePayload(row.data);
      expect(payload.name).toBe(`${payload.brand} ${payload.model}`);
      expect(payload.length).toBe(
        Number(row.raw[3]),
      );
      // type wasn't in the mapping → defaulted to universal
      expect(payload.type).toBe('universal');
    }
  });

  test('re-mapping preserves section-technique inheritance + rescue', () => {
    // A header row, a JL-project rescue column, and two technique
    // sections. The user re-maps in the UI (e.g. fixes the length
    // column); the re-map must NOT lose the section technique or the
    // rescued column.
    const input = [
      'Name\tLength\tProject',
      'skate',
      'Speedmax\t192\tSprint',
      'Redline\t190\tSprint',
      'classic',
      'Carbonlite\t207\tDistance',
    ].join('\n');
    const parsed = parseSpreadsheet(input);
    expect(parsed.dataRows.length).toBeGreaterThan(0);

    // Sanity: the initial parse already inherited technique + rescued.
    expect(parsed.rows.map(r => r.data.technique)).toEqual([
      'skate',
      'skate',
      'classic',
    ]);

    // User keeps the same mapping but re-applies (simulating a manual
    // tweak). Re-mapping from dataRows + headers must reproduce the
    // inheritance and the rescued "project: ..." note.
    const remapped = applyMapping(parsed.dataRows, parsed.mapping, {
      headers: parsed.headers,
    });
    expect(remapped.map(r => r.data.technique)).toEqual([
      'skate',
      'skate',
      'classic',
    ]);
    expect(remapped[0].data.notes).toMatch(/project: sprint/i);
    expect(remapped[2].data.notes).toMatch(/project: distance/i);
    // No section-header rows leaked into the output.
    expect(remapped.length).toBe(3);
  });

  test('mixed-quality paste — bad rows isolated, good rows still save', () => {
    const input = `Brand\tModel\tTechnique\tLength
Fischer\tSpeedmax\tClassic\t200
\t\tBatman\t220
Salomon\tS/Lab\tSkate\tlong`;
    const parsed = parseSpreadsheet(input);
    expect(parsed.rows.length).toBe(3);
    expect(parsed.rows[0].errors).toEqual([]);
    expect(parsed.rows[1].errors.length).toBeGreaterThan(0);
    expect(parsed.rows[2].errors.length).toBeGreaterThan(0);

    // Only the good row would be sent to the writer.
    const validRows = parsed.rows.filter(r => r.errors.length === 0);
    expect(validRows.length).toBe(1);

    const payload = buildSkiCreatePayload(validRows[0].data);
    expect(payload.name).toBe('Fischer Speedmax');
    expect(payload.technique).toBe('classic');
    expect(payload.length).toBe(200);
  });

  test('markdown table paste → savable docs', () => {
    const input = `
| Brand | Model | Technique | Type |
|-------|-------|-----------|------|
| Fischer | Speedmax | Classic | Cold |
| Salomon | S/Lab Carbon | Skate | Warm |
    `;
    const parsed = parseSpreadsheet(input);
    expect(parsed.delimiter.kind).toBe('markdown');
    expect(parsed.rows.length).toBe(2);
    for (const row of parsed.rows) {
      expect(row.errors).toEqual([]);
      const payload = buildSkiCreatePayload(row.data);
      expect(['cold', 'warm']).toContain(payload.type);
    }
  });
});
