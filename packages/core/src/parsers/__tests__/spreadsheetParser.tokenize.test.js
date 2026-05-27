const {
  detectDelimiter,
  tokenizeRows,
  parseSpreadsheet,
} = require('../spreadsheetParser');

describe('detectDelimiter', () => {
  test('tabs (Excel paste)', () => {
    expect(detectDelimiter('Brand\tModel\tLength\nFischer\tSpeedmax\t200')).toEqual({
      kind: 'tab',
      char: '\t',
    });
  });

  test('commas (CSV)', () => {
    expect(detectDelimiter('Brand,Model,Length\nFischer,Speedmax,200')).toEqual({
      kind: 'comma',
      char: ',',
    });
  });

  test('markdown table', () => {
    expect(detectDelimiter('| A | B |\n|---|---|\n| 1 | 2 |').kind).toBe(
      'markdown',
    );
  });

  test('pipe-only (no markdown frame)', () => {
    expect(detectDelimiter('A|B|C\n1|2|3').kind).toBe('pipe');
  });

  test('whitespace fallback when nothing else matches', () => {
    expect(detectDelimiter('A B C\n1 2 3').kind).toBe('whitespace');
  });

  test('prefers tabs over commas when both appear', () => {
    // Comma-rich product names + tabs as actual column separators
    // — the tab count is the real delimiter.
    expect(
      detectDelimiter('Brand\tModel, Variant\tLength\nFischer\tCarbonLite, Cold\t200')
        .kind,
    ).toBe('tab');
  });

  test('quoted commas do not count', () => {
    expect(
      detectDelimiter('Brand,Model,"Notes, with commas"').kind,
    ).toBe('comma');
  });

  test('empty input returns a sane default', () => {
    expect(detectDelimiter('').kind).toBe('tab');
    expect(detectDelimiter('   \n  ').kind).toBe('tab');
  });
});

describe('tokenizeRows', () => {
  test('drops blank lines', () => {
    const out = tokenizeRows('a,b\n\n\nc,d\n');
    expect(out.rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('TSV from Excel paste preserves cells with spaces', () => {
    const input = 'Brand\tModel\nFischer\tSpeedmax 3D\nSalomon\tS/Lab Classic';
    expect(tokenizeRows(input).rows).toEqual([
      ['Brand', 'Model'],
      ['Fischer', 'Speedmax 3D'],
      ['Salomon', 'S/Lab Classic'],
    ]);
  });

  test('CSV honors quoted fields containing the delimiter', () => {
    const input = 'name,notes\n"Speedmax","Cold race, used 2024"';
    expect(tokenizeRows(input).rows).toEqual([
      ['name', 'notes'],
      ['Speedmax', 'Cold race, used 2024'],
    ]);
  });

  test('CSV honors doubled quotes inside a quoted field', () => {
    const input = 'name,notes\n"A","She said ""nice""."';
    const out = tokenizeRows(input).rows;
    expect(out[1]).toEqual(['A', 'She said "nice".']);
  });

  test('markdown table — separator row skipped, body rows kept', () => {
    const input = `
| Name | Brand | Length |
|------|-------|--------|
| Speedmax | Fischer | 200 |
| S/Lab    | Salomon | 192 |
    `;
    const out = tokenizeRows(input);
    expect(out.delimiter.kind).toBe('markdown');
    expect(out.rows).toEqual([
      ['Name', 'Brand', 'Length'],
      ['Speedmax', 'Fischer', '200'],
      ['S/Lab', 'Salomon', '192'],
    ]);
  });

  test('whitespace-separated lines', () => {
    const input = 'Name   Brand   Length\nSpeedmax   Fischer   200';
    const out = tokenizeRows(input);
    expect(out.delimiter.kind).toBe('whitespace');
    expect(out.rows).toEqual([
      ['Name', 'Brand', 'Length'],
      ['Speedmax', 'Fischer', '200'],
    ]);
  });

  test('mixed-length rows still tokenize independently', () => {
    const out = tokenizeRows('a,b,c\nd,e\nf,g,h,i');
    expect(out.rows.map(r => r.length)).toEqual([3, 2, 4]);
  });

  test('CRLF line endings (Windows) are handled', () => {
    const out = tokenizeRows('a,b\r\nc,d\r\n');
    expect(out.rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('empty input → no rows', () => {
    expect(tokenizeRows('').rows).toEqual([]);
    expect(tokenizeRows('   \n  ').rows).toEqual([]);
  });
});

describe('parseSpreadsheet (1.1 — passthrough)', () => {
  test('returns delimiter + rawRows', () => {
    const out = parseSpreadsheet('a,b\nc,d');
    expect(out.delimiter.kind).toBe('comma');
    expect(out.rawRows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});
