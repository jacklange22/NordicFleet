const {
  fieldForHeader,
  looksLikeHeaderRow,
  mapHeadersToFields,
  normalizeRow,
  parseSpreadsheet,
  applyMapping,
  missingRequiredFields,
  duplicateMappings,
} = require('../spreadsheetParser');

describe('fieldForHeader', () => {
  test.each([
    ['Name', 'name'],
    ['ski name', 'name'],
    ['ski-name', 'name'],
    ['Brand', 'brand'],
    ['Manufacturer', 'brand'],
    ['Make', 'brand'],
    ['Model', 'model'],
    ['Ski Model', 'model'],
    ['Technique', 'technique'],
    ['Discipline', 'technique'],
    ['Type', 'type'],
    ['Snow Type', 'type'],
    ['Length', 'length'],
    ['Length (cm)', 'length'],
    ['Flex', 'flex'],
    ['Hardness', 'flex'],
    ['Year', 'year'],
    ['Notes', 'notes'],
    ['Comments', 'notes'],
    ['Grind', 'grind'],
    ['Structure', 'grind'],
  ])('"%s" → %s', (input, expected) => {
    expect(fieldForHeader(input)).toBe(expected);
  });

  test('returns null for unknown headers', () => {
    expect(fieldForHeader('Foo')).toBeNull();
    expect(fieldForHeader('')).toBeNull();
    expect(fieldForHeader(undefined)).toBeNull();
  });

  test('case + punctuation insensitive', () => {
    expect(fieldForHeader('BRAND')).toBe('brand');
    expect(fieldForHeader('  Brand!  ')).toBe('brand');
    expect(fieldForHeader('Ski_Model')).toBe('model');
  });
});

describe('looksLikeHeaderRow', () => {
  test('header-ish row', () => {
    expect(
      looksLikeHeaderRow(['Brand', 'Model', 'Length']),
    ).toBe(true);
  });

  test('pure data row (numbers)', () => {
    expect(looksLikeHeaderRow(['200', '90', 'Speedmax'])).toBe(false);
  });

  test('numeric beats mapped → not a header', () => {
    expect(looksLikeHeaderRow(['200', '90', '180', 'Brand'])).toBe(false);
  });

  test('empty input → false', () => {
    expect(looksLikeHeaderRow([])).toBe(false);
    expect(looksLikeHeaderRow(null)).toBe(false);
  });
});

describe('mapHeadersToFields', () => {
  test('basic mapping', () => {
    expect(mapHeadersToFields(['Brand', 'Model', 'Length'])).toEqual([
      'brand',
      'model',
      'length',
    ]);
  });

  test('unknown header → null in slot', () => {
    expect(mapHeadersToFields(['Brand', 'WhoKnows', 'Length'])).toEqual([
      'brand',
      null,
      'length',
    ]);
  });
});

describe('normalizeRow', () => {
  const fullMapping = [
    'brand',
    'model',
    'technique',
    'type',
    'length',
    'flex',
    'year',
    'notes',
  ];

  test('happy path with units stripped', () => {
    const {data, errors} = normalizeRow(
      ['Fischer', 'Speedmax', 'Classic', 'Cold', '200cm', '90 kg', '2019', 'note'],
      fullMapping,
    );
    expect(errors).toEqual([]);
    expect(data).toEqual({
      name: 'Fischer Speedmax', // auto-generated
      brand: 'Fischer',
      model: 'Speedmax',
      technique: 'classic',
      type: 'cold',
      length: 200,
      flex: 90,
      year: 2019,
      notes: 'note',
    });
  });

  test('flag missing required fields', () => {
    const {errors} = normalizeRow(
      ['Fischer', '', 'Classic', '', '', '', '', ''],
      fullMapping,
    );
    const fields = errors.map(e => e.field);
    expect(fields).toContain('model');
    // name auto-generates only when both brand+model present, so it's
    // also missing here
    expect(fields).toContain('name');
  });

  test('unparseable technique enum surfaces as error', () => {
    const {errors, data} = normalizeRow(
      ['Fischer', 'Speedmax', 'Mountain biking', 'Cold', '', '', '', ''],
      fullMapping,
    );
    expect(errors.some(e => e.field === 'technique')).toBe(true);
    expect(data.technique).toBeUndefined();
  });

  test('technique variants', () => {
    const tech = (raw) =>
      normalizeRow(['Fischer', 'X', raw], ['brand', 'model', 'technique']).data
        .technique;
    expect(tech('Classic')).toBe('classic');
    expect(tech('Classical')).toBe('classic');
    expect(tech('Skate')).toBe('skate');
    expect(tech('Skating')).toBe('skate');
    expect(tech('Freestyle')).toBe('skate');
  });

  test('type variants', () => {
    const type = (raw) =>
      normalizeRow(
        ['Fischer', 'X', 'Classic', raw],
        ['brand', 'model', 'technique', 'type'],
      ).data.type;
    expect(type('Cold')).toBe('cold');
    expect(type('Universal')).toBe('universal');
    expect(type('Uni')).toBe('universal');
    expect(type('all round')).toBe('universal');
    expect(type('Warm')).toBe('warm');
    expect(type('Zero')).toBe('zero');
  });

  test('length / flex non-numeric is flagged as error', () => {
    const {errors, data} = normalizeRow(
      ['Fischer', 'X', 'Classic', 'Cold', 'two hundred', 'pretty stiff', '', ''],
      fullMapping,
    );
    expect(errors.some(e => e.field === 'length')).toBe(true);
    expect(errors.some(e => e.field === 'flex')).toBe(true);
    expect(data.length).toBeUndefined();
    expect(data.flex).toBeUndefined();
  });

  test('year 2-digit gets 20-prefix', () => {
    const {data} = normalizeRow(
      ['Fischer', 'X', 'Classic', 'Cold', '', '', '24', ''],
      fullMapping,
    );
    expect(data.year).toBe(2024);
  });

  test('European decimal-comma in flex', () => {
    const {data} = normalizeRow(
      ['Fischer', 'X', 'Classic', 'Cold', '200', '90,5', '', ''],
      fullMapping,
    );
    expect(data.flex).toBe(91);
  });

  test('empty cells skip cleanly (no errors for optional)', () => {
    const {errors} = normalizeRow(
      ['Fischer', 'Speedmax', 'Classic', '', '', '', '', ''],
      fullMapping,
    );
    expect(errors).toEqual([]);
  });
});

describe('parseSpreadsheet (1.2 — end-to-end)', () => {
  test('clean TSV with headers', () => {
    const input = `Brand\tModel\tTechnique\tType\tLength\tFlex
Fischer\tSpeedmax\tClassic\tCold\t200\t90
Salomon\tS/Lab Carbon\tSkate\tCold\t192\t75`;
    const out = parseSpreadsheet(input);
    expect(out.delimiter.kind).toBe('tab');
    expect(out.headers).toEqual([
      'Brand',
      'Model',
      'Technique',
      'Type',
      'Length',
      'Flex',
    ]);
    expect(out.mapping).toEqual([
      'brand',
      'model',
      'technique',
      'type',
      'length',
      'flex',
    ]);
    expect(out.needsManualMapping).toBe(false);
    expect(out.rows.length).toBe(2);
    expect(out.rows[0].errors).toEqual([]);
    expect(out.rows[0].data).toMatchObject({
      brand: 'Fischer',
      model: 'Speedmax',
      technique: 'classic',
      type: 'cold',
      length: 200,
      flex: 90,
    });
  });

  test('CSV with messy capitalization + extra commas in notes', () => {
    const input = `make,model,technique,Notes
Fischer,Speedmax,classic,"Best for cold, used 2024"
salomon,"S/Lab Carbon",skate,"Backup, warm"`;
    const out = parseSpreadsheet(input);
    expect(out.needsManualMapping).toBe(false);
    expect(out.rows[0].data.notes).toBe('Best for cold, used 2024');
    expect(out.rows[1].data.notes).toBe('Backup, warm');
  });

  test('no headers (looks like data first row) → needs manual mapping', () => {
    const input = `Fischer\tSpeedmax\tClassic\t200
Salomon\tS/Lab\tSkate\t192`;
    const out = parseSpreadsheet(input);
    // The first row contains string-like cells but none of them slug to
    // a known alias, so the heuristic should treat it as data.
    expect(out.needsManualMapping).toBe(true);
    expect(out.headers).toEqual([]);
    expect(out.rows.length).toBe(2);
  });

  test('header row present but one required field absent → needs manual', () => {
    // Missing the "technique" column — required field unmapped.
    const input = `Brand\tModel\tLength
Fischer\tSpeedmax\t200`;
    const out = parseSpreadsheet(input);
    expect(out.needsManualMapping).toBe(true);
    expect(out.headers).toEqual(['Brand', 'Model', 'Length']);
  });

  test('markdown table input', () => {
    const input = `
| Brand | Model | Technique | Length |
|-------|-------|-----------|--------|
| Fischer | Speedmax | Classic | 200 |
| Salomon | S/Lab Carbon | Skate | 192 |
    `;
    const out = parseSpreadsheet(input);
    expect(out.delimiter.kind).toBe('markdown');
    expect(out.rows.length).toBe(2);
    expect(out.rows[0].data).toMatchObject({
      brand: 'Fischer',
      model: 'Speedmax',
      technique: 'classic',
      length: 200,
    });
  });

  test('unmapped headers reported separately', () => {
    const input = `Brand\tModel\tTechnique\tFavorite Color
Fischer\tSpeedmax\tClassic\tred`;
    const out = parseSpreadsheet(input);
    expect(out.unmappedHeaders).toEqual(['Favorite Color']);
    expect(out.rows[0].errors).toEqual([]);
  });

  test('per-row errors collected without short-circuiting', () => {
    const input = `Brand\tModel\tTechnique\tLength
Fischer\tSpeedmax\tClassic\t200
\t\tBatman\t220
Salomon\tS/Lab\tSkate\tlong`;
    const out = parseSpreadsheet(input);
    expect(out.rows.length).toBe(3);
    expect(out.rows[0].errors).toEqual([]);
    expect(out.rows[1].errors.length).toBeGreaterThan(0);
    expect(
      out.rows[2].errors.some(e => e.field === 'length'),
    ).toBe(true);
  });
});

describe('applyMapping', () => {
  test('replays a user-supplied mapping over the raw rows', () => {
    const rawRows = [
      ['Fischer', 'Speedmax', 'Classic', '200'],
      ['Salomon', 'S/Lab', 'Skate', '192'],
    ];
    const mapping = ['brand', 'model', 'technique', 'length'];
    const out = applyMapping(rawRows, mapping);
    expect(out[0].data).toMatchObject({
      brand: 'Fischer',
      model: 'Speedmax',
      technique: 'classic',
      length: 200,
    });
    expect(out[0].errors).toEqual([]);
  });
});

describe('missingRequiredFields', () => {
  test('all three required fields present → empty', () => {
    expect(missingRequiredFields(['brand', 'model', 'technique'])).toEqual([]);
  });

  test('mapping with extras still has no missing', () => {
    expect(
      missingRequiredFields([
        'brand',
        'model',
        'technique',
        'length',
        'notes',
      ]),
    ).toEqual([]);
  });

  test('partial mapping → returns the missing ones in canonical order', () => {
    expect(missingRequiredFields(['brand', null, 'technique'])).toEqual(['model']);
    expect(missingRequiredFields(['brand'])).toEqual(['model', 'technique']);
    expect(missingRequiredFields([null, null, null])).toEqual([
      'brand',
      'model',
      'technique',
    ]);
  });

  test('empty / falsy input → all three missing', () => {
    expect(missingRequiredFields([])).toEqual(['brand', 'model', 'technique']);
    expect(missingRequiredFields(null)).toEqual(['brand', 'model', 'technique']);
    expect(missingRequiredFields(undefined)).toEqual([
      'brand',
      'model',
      'technique',
    ]);
  });
});

describe('duplicateMappings', () => {
  test('no duplicates → empty', () => {
    expect(duplicateMappings(['brand', 'model', 'technique'])).toEqual([]);
  });

  test('one field used twice → reported once', () => {
    expect(duplicateMappings(['brand', 'model', 'brand'])).toEqual(['brand']);
  });

  test('multiple duplicates each reported once', () => {
    const dupes = duplicateMappings(['brand', 'brand', 'model', 'model']);
    expect(dupes.sort()).toEqual(['brand', 'model']);
  });

  test('nulls in mapping are ignored', () => {
    expect(duplicateMappings(['brand', null, null])).toEqual([]);
  });

  test('falsy input → empty', () => {
    expect(duplicateMappings(null)).toEqual([]);
    expect(duplicateMappings(undefined)).toEqual([]);
    expect(duplicateMappings([])).toEqual([]);
  });
});
