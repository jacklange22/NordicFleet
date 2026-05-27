const {
  fieldForHeader,
  looksLikeHeaderRow,
  mapHeadersToFields,
  normalizeRow,
  parseSpreadsheet,
  applyMapping,
  missingRequiredFields,
  duplicateMappings,
  detectSectionTechnique,
  autoDetectNameColumn,
  findRescueColumns,
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

  test('brand-only row still gets a name + does not error on model', () => {
    // Brand alone is enough — name falls back to brand (model gone is
    // fine since brand+model are now both optional).
    const {data, errors} = normalizeRow(
      ['Fischer', '', 'Classic', '', '', '', '', ''],
      fullMapping,
    );
    const fields = errors.map(e => e.field);
    expect(fields).not.toContain('brand');
    expect(fields).not.toContain('model');
    expect(fields).not.toContain('name');
    expect(data.name).toBe('Fischer');
  });

  test('truly empty rows still flag missing name + technique', () => {
    const {errors} = normalizeRow(
      ['', '', '', '', '', '', '', ''],
      fullMapping,
    );
    const fields = errors.map(e => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('technique');
    // Brand + model are NOT in the required-error list anymore.
    expect(fields).not.toContain('brand');
    expect(fields).not.toContain('model');
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

  test('type defaults to universal when the cell is empty', () => {
    const {data, errors} = normalizeRow(
      ['Fischer', 'Speedmax', 'Classic', '', '', '', '', ''],
      fullMapping,
    );
    expect(errors).toEqual([]);
    expect(data.type).toBe('universal');
  });

  test('type defaults to universal when the field is unmapped', () => {
    const {data, errors} = normalizeRow(
      ['Fischer', 'Speedmax', 'Classic', '200'],
      ['brand', 'model', 'technique', 'length'],
    );
    expect(errors).toEqual([]);
    expect(data.type).toBe('universal');
  });

  test('unparseable type does NOT silently default — error stands', () => {
    const {data, errors} = normalizeRow(
      ['Fischer', 'Speedmax', 'Classic', 'Banana'],
      ['brand', 'model', 'technique', 'type'],
    );
    expect(errors.some(e => e.field === 'type')).toBe(true);
    expect(data.type).toBeUndefined();
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

  test('unmapped headers split into "rescued" vs "ignored" buckets', () => {
    // Two unmapped headers: one with data in every row (rescued
    // into notes), one with sparse data (ignored).
    const input = `Brand\tModel\tTechnique\tFavorite Color\tBlank Col
Fischer\tSpeedmax\tClassic\tred\t
Salomon\tS/Lab\tSkate\tblue\t
Madshus\tRedline\tClassic\tgreen\t`;
    const out = parseSpreadsheet(input);
    // Favorite Color is rescued (3/3 = 100% populated).
    expect(out.rescuedHeaders).toContain('Favorite Color');
    expect(out.unmappedHeaders).not.toContain('Favorite Color');
    // Blank Col has no data → stays in unmappedHeaders.
    expect(out.unmappedHeaders).toContain('Blank Col');
    expect(out.rows[0].errors).toEqual([]);
    // The rescued value lands in notes.
    expect(out.rows[0].data.notes).toContain('favorite color: red');
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
  // The required-field set is now ['name', 'technique']. Brand and
  // model are intentionally optional — real spreadsheets often skip
  // them.

  test('both required fields present → empty', () => {
    expect(missingRequiredFields(['name', 'technique'])).toEqual([]);
  });

  test('mapping with extras still has no missing', () => {
    expect(
      missingRequiredFields([
        'name',
        'brand',
        'model',
        'technique',
        'length',
        'notes',
      ]),
    ).toEqual([]);
  });

  test('partial mapping → returns the missing ones in canonical order', () => {
    expect(missingRequiredFields(['name', null])).toEqual(['technique']);
    expect(missingRequiredFields([null, 'technique'])).toEqual(['name']);
    expect(missingRequiredFields([null, null])).toEqual(['name', 'technique']);
  });

  test('brand/model alone do NOT satisfy the required set', () => {
    expect(missingRequiredFields(['brand', 'model'])).toEqual([
      'name',
      'technique',
    ]);
  });

  test('empty / falsy input → both missing', () => {
    expect(missingRequiredFields([])).toEqual(['name', 'technique']);
    expect(missingRequiredFields(null)).toEqual(['name', 'technique']);
    expect(missingRequiredFields(undefined)).toEqual(['name', 'technique']);
  });
});

describe('detectSectionTechnique', () => {
  test('single-cell "skate" row → "skate"', () => {
    expect(detectSectionTechnique(['skate'])).toBe('skate');
    expect(detectSectionTechnique(['Skate'])).toBe('skate');
    expect(detectSectionTechnique(['SKATE  '])).toBe('skate');
  });

  test('single-cell "classic" row → "classic"', () => {
    expect(detectSectionTechnique(['classic'])).toBe('classic');
    expect(detectSectionTechnique(['Classical'])).toBe('classic');
    expect(detectSectionTechnique(['Freestyle'])).toBe('skate');
  });

  test('multi-cell row → null even if a cell looks like a technique', () => {
    expect(detectSectionTechnique(['skate', 'red', 'extra'])).toBeNull();
  });

  test('row with one non-empty cell + trailing empty cells → section', () => {
    // This is what tokenizeRows produces from "skate\t\t\t\t" — the
    // empty cells survive but only "skate" is non-empty.
    expect(
      detectSectionTechnique(['skate', '', '', '', '', '', '', '', '']),
    ).toBe('skate');
  });

  test('non-technique single-cell row → null', () => {
    expect(detectSectionTechnique(['banana'])).toBeNull();
    expect(detectSectionTechnique(['skate red'])).toBeNull();
  });

  test('empty / non-array → null', () => {
    expect(detectSectionTechnique([])).toBeNull();
    expect(detectSectionTechnique(null)).toBeNull();
  });
});

describe('autoDetectNameColumn', () => {
  test('claims col 0 when it is unmapped and contains text', () => {
    const mapping = [null, 'grind', 'type'];
    const dataRows = [
      ['skate red', '363+', 'warm'],
      ['simi skis', 'g4', 'uni'],
      ['cold ski', 'g5+', 'cold'],
    ];
    expect(autoDetectNameColumn(mapping, dataRows)).toEqual([
      'name',
      'grind',
      'type',
    ]);
  });

  test('does NOT claim col 0 when already mapped', () => {
    const mapping = ['model', 'grind', 'type'];
    const dataRows = [['Speedmax', 'g4', 'cold']];
    expect(autoDetectNameColumn(mapping, dataRows)).toEqual([
      'model',
      'grind',
      'type',
    ]);
  });

  test('does NOT claim when col 0 is mostly numeric', () => {
    const mapping = [null, 'name'];
    const dataRows = [
      ['123', 'a'],
      ['456', 'b'],
      ['789', 'c'],
    ];
    expect(autoDetectNameColumn(mapping, dataRows)).toEqual([null, 'name']);
  });

  test('ignores section-header rows when sampling', () => {
    const mapping = [null, 'grind'];
    const dataRows = [
      ['skate'], // section header — should not bias the decision
      ['skate red', '363+'],
      ['simi skis', 'g4'],
    ];
    expect(autoDetectNameColumn(mapping, dataRows)).toEqual([
      'name',
      'grind',
    ]);
  });

  test('needs at least 2 non-empty samples', () => {
    const mapping = [null, 'grind'];
    const dataRows = [['only one', 'g4']];
    expect(autoDetectNameColumn(mapping, dataRows)).toEqual([null, 'grind']);
  });

  test('empty / non-array input → mapping returned unchanged', () => {
    expect(autoDetectNameColumn(null, [])).toBeNull();
    expect(autoDetectNameColumn([], [])).toEqual([]);
    expect(autoDetectNameColumn([null, 'a'], null)).toEqual([null, 'a']);
  });
});

describe('findRescueColumns', () => {
  test('picks up columns with majority of data', () => {
    const mapping = ['name', null, null, 'notes'];
    const headers = ['name', 'jl project', 'number', 'notes'];
    const dataRows = [
      ['Speedmax', 'u15', '870', 'a'],
      ['S/Lab', 'u14', '244', ''],
      ['Redline', 'u12', '', ''],
      ['Carbon', '', '100', ''],
    ];
    const rescued = findRescueColumns(mapping, headers, dataRows);
    expect(rescued).toEqual([
      {index: 1, header: 'jl project'},
      {index: 2, header: 'number'},
    ]);
  });

  test('drops sparse columns', () => {
    const mapping = ['name', null];
    const headers = ['name', 'rare'];
    const dataRows = [
      ['a', 'x'],
      ['b', ''],
      ['c', ''],
      ['d', ''],
      ['e', ''],
    ];
    // 1/5 = 20% < 25% threshold.
    expect(findRescueColumns(mapping, headers, dataRows)).toEqual([]);
  });

  test('skips columns whose header has no label', () => {
    const mapping = [null, 'name'];
    const headers = ['', 'name']; // no header text to use as key
    const dataRows = [
      ['a', 'one'],
      ['b', 'two'],
    ];
    expect(findRescueColumns(mapping, headers, dataRows)).toEqual([]);
  });

  test('ignores section-header rows when counting', () => {
    const mapping = ['name', null];
    const headers = ['name', 'extra'];
    const dataRows = [
      ['skate'], // section header — should not bias
      ['a', 'x'],
      ['b', 'y'],
    ];
    expect(findRescueColumns(mapping, headers, dataRows)).toEqual([
      {index: 1, header: 'extra'},
    ]);
  });
});

describe('parseSpreadsheet — section-header inheritance', () => {
  test('"skate" row sets technique on subsequent rows', () => {
    const input = `name\tlength
skate
Speedmax\t190
S/Lab\t186
classic
Redline\t200`;
    const out = parseSpreadsheet(input);
    // Section rows themselves don't appear in output
    expect(out.rows.length).toBe(3);
    expect(out.rows[0].data).toMatchObject({
      name: 'Speedmax',
      technique: 'skate',
      length: 190,
    });
    expect(out.rows[1].data.technique).toBe('skate');
    expect(out.rows[2].data).toMatchObject({
      name: 'Redline',
      technique: 'classic',
      length: 200,
    });
    // Every row should parse without a technique error
    out.rows.forEach(r => {
      expect(r.errors.find(e => e.field === 'technique')).toBeUndefined();
    });
  });

  test('explicit technique column overrides section', () => {
    const input = `name\ttechnique\tlength
skate
Speedmax\tclassic\t190`;
    const out = parseSpreadsheet(input);
    expect(out.rows[0].data.technique).toBe('classic');
  });

  test('section-header presence drops the manual-mapping flag for technique', () => {
    // No technique column, but a section header sets it.
    const input = `name\tlength
skate
Speedmax\t190`;
    const out = parseSpreadsheet(input);
    expect(out.needsManualMapping).toBe(false);
  });

  test('folds unmapped-but-populated columns into notes', () => {
    const input = `name\tjl project\tnumber\tnotes\ttechnique
Speedmax\tu15\t870\twas great\tclassic
S/Lab\tu14\t244\t\tskate
Redline\tu12\t610\t\tclassic
Carbon\tu11\t100\t\tskate`;
    const out = parseSpreadsheet(input);
    expect(out.rows.length).toBe(4);
    // jl project + number are both rescued (4/4 rows have data).
    expect(out.rows[0].data.notes).toBe(
      'was great\njl project: u15 · number: 870',
    );
    expect(out.rows[1].data.notes).toBe('jl project: u14 · number: 244');
  });

  test('does NOT fold a column that is sparsely populated', () => {
    // `flag` has data in 1/5 rows = 20% < 25% threshold → not
    // rescued. `jl project` has data in 5/5 → rescued.
    const input = `name\ttechnique\tjl project\tflag
Speedmax\tclassic\tu15\t!
S/Lab\tskate\tu14\t
Redline\tclassic\tu12\t
Carbon\tskate\tu11\t
RCS\tclassic\tu10\t`;
    const out = parseSpreadsheet(input);
    expect(out.rows.length).toBe(5);
    // Row 0 has data in both the rescued and sparse columns. Only
    // the rescued column should show up in notes.
    expect(out.rows[0].data.notes).toBe('jl project: u15');
    expect(out.rows[0].data.notes).not.toContain('flag');
  });

  test('rows with 0-1 non-empty cells are silently skipped', () => {
    const input = `name\ttechnique\tlength
Speedmax\tclassic\t190
stray
\t\t
S/Lab\tskate\t186`;
    const out = parseSpreadsheet(input);
    // "stray" is a 1-cell row that doesn't match a technique — skip.
    // The blank line gets dropped by the tokenizer.
    expect(out.rows.length).toBe(2);
    expect(out.rows[0].data.name).toBe('Speedmax');
    expect(out.rows[1].data.name).toBe('S/Lab');
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
