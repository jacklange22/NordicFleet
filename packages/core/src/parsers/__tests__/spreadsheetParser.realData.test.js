// End-to-end test against a real user paste. The fixture in
// fixtures/real-ski-data.tsv is verbatim what the user pasted; the
// parser should make it through the whole import flow without
// dropping rows or flagging errors that aren't really errors.
//
// Before the import-fix session: 0 of 32 rows passed validation.
// After: 30 of 30 rows pass, with the two section-header rows
// correctly filtered, all techniques inherited from the section
// markers, all annotation columns (jl project, number) folded into
// notes.

const fs = require('fs');
const path = require('path');
const {parseSpreadsheet} = require('../spreadsheetParser');

const INPUT = fs.readFileSync(
  path.join(__dirname, 'fixtures/real-ski-data.tsv'),
  'utf8',
);

describe('real-world ski data fixture', () => {
  const result = parseSpreadsheet(INPUT);

  test('detects tab as the delimiter', () => {
    expect(result.delimiter.kind).toBe('tab');
  });

  test('detects the header row + maps real-world aliases', () => {
    expect(result.headers[1]).toBe('grind');
    expect(result.headers[2]).toBe('uni/cold/warm');
    expect(result.headers[5]).toBe('year bought');
    // Column 0 has an empty header — auto-detected as `name`.
    expect(result.mapping[0]).toBe('name');
    expect(result.mapping[1]).toBe('grind');
    expect(result.mapping[2]).toBe('type');
    expect(result.mapping[4]).toBe('flex');
    expect(result.mapping[5]).toBe('year');
    expect(result.mapping[8]).toBe('notes');
  });

  test('does NOT need manual mapping (technique comes from section headers)', () => {
    expect(result.needsManualMapping).toBe(false);
  });

  test('section-header rows ("skate", "classic") are filtered from output', () => {
    const rawNames = result.rows.map(r => r.data.name);
    expect(rawNames).not.toContain('skate');
    expect(rawNames).not.toContain('classic');
  });

  test('produces 30 data rows (17 skate + 13 classic), all without errors', () => {
    const skate = result.rows.filter(
      r => r.data.technique === 'skate' && r.errors.length === 0,
    );
    const classic = result.rows.filter(
      r => r.data.technique === 'classic' && r.errors.length === 0,
    );
    expect(skate.length).toBeGreaterThanOrEqual(15);
    expect(classic.length).toBeGreaterThanOrEqual(10);
    expect(skate.length + classic.length).toBe(result.rows.length);
    // Per brief: of ~30 expected rows, all should be valid.
    expect(result.rows.length).toBe(30);
    expect(result.rows.every(r => r.errors.length === 0)).toBe(true);
  });

  // ─── Spot-checks: specific rows from the fixture ───────────────────

  function findByName(needle) {
    return result.rows.find(r => r.data.name === needle);
  }

  test('"skate red" — full skate-section row with all fields', () => {
    const ski = findByName('skate red');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('skate');
    expect(ski.data.grind).toBe('363+');
    expect(ski.data.type).toBe('warm');
    expect(ski.data.flex).toBe(91);
    expect(ski.data.year).toBe(2019);
    expect(ski.data.notes).toContain('been good for a while in slush');
    // jl project + number folded into the same notes.
    expect(ski.data.notes).toContain('jl project: na');
    expect(ski.data.notes).toContain('number: 764');
  });

  test('"simi skis" — universal section, all fields populated', () => {
    const ski = findByName('simi skis');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('skate');
    expect(ski.data.type).toBe('universal');
    expect(ski.data.grind).toBe('g4');
    expect(ski.data.flex).toBe(90);
    expect(ski.data.year).toBe(2022);
    expect(ski.data.notes).toContain('just my best pair');
  });

  test('"voukatti" — minimal data row, no flex/year discrepancy', () => {
    const ski = findByName('voukatti');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('skate');
    expect(ski.data.type).toBe('cold');
    expect(ski.data.flex).toBe(101);
    expect(ski.data.year).toBe(2018);
    expect(ski.data.notes).toContain('good in really cold');
  });

  test('"ice klister gold ski" — inherits classic from section header', () => {
    const ski = findByName('ice klister gold ski');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('classic');
    expect(ski.data.type).toBe('universal');
    expect(ski.data.grind).toBe('363+');
    expect(ski.data.flex).toBe(43);
    expect(ski.data.year).toBe(2022);
    expect(ski.data.notes).toContain('good in a lot of thinner warm hardwax');
  });

  test('"zeros" — type=zero parses + literal "zero" word in number column gets rescued', () => {
    const ski = findByName('zeros');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('classic');
    expect(ski.data.type).toBe('zero');
    expect(ski.data.flex).toBe(39);
    expect(ski.data.year).toBe(2020);
    // "zero" sat in the number column (not a real number). Should
    // surface as part of the rescued-notes text rather than choke.
    expect(ski.data.notes || '').toMatch(/number: zero/);
  });

  test('"2025 univ" — newer-year entry parses cleanly', () => {
    const ski = findByName('2025 univ');
    expect(ski).toBeDefined();
    expect(ski.data.technique).toBe('classic');
    expect(ski.data.type).toBe('universal');
    expect(ski.data.grind).toBe('fp2-20');
    expect(ski.data.year).toBe(2025);
  });

  test('grind codes ("g4", "b363", "li3", "fp2-20") pass through as strings', () => {
    expect(findByName('simi skis').data.grind).toBe('g4');
    expect(findByName('universal').data.grind).toBe('b363');
    expect(findByName('new lower stiffer').data.grind).toBe('li3');
    expect(findByName('2025 univ').data.grind).toBe('fp2-20');
  });

  test('unmapped vs rescued headers reported correctly', () => {
    // confidence has data in only 3 of 30 rows → does NOT meet the
    // rescue threshold → stays in unmappedHeaders.
    expect(result.unmappedHeaders).toContain('confidence');
    // jl project + number are rescued into notes — they don't show
    // up as "ignored" anymore.
    expect(result.unmappedHeaders).not.toContain('jl project');
    expect(result.unmappedHeaders).not.toContain('number');
    expect(result.rescuedHeaders).toEqual(
      expect.arrayContaining(['jl project', 'number']),
    );
    // The empty col-0 header got auto-claimed as `name`, so it's
    // NOT in either list anymore.
    expect(result.unmappedHeaders).not.toContain('');
  });
});
