const {parseStickerText, toSkiInput} = require('../stickerParser');

describe('parseStickerText — happy path', () => {
  test('Fischer Speedmax 3D sticker', () => {
    const lines = [
      'FISCHER',
      'SPEEDMAX 3D',
      'SKATE PLUS COLD',
      '192',
      '75',
      '1234567', // serial, should be ignored
    ];
    const parsed = parseStickerText(lines);
    expect(parsed.brand.value).toBe('Fischer');
    expect(parsed.brand.confidence).toBe('high');
    expect(parsed.model.value).toBe('Speedmax 3D');
    expect(parsed.model.confidence).toBe('high');
    // Speedmax 3D is technique-neutral, so the parser falls back to
    // the SKATE word on the build line.
    expect(parsed.technique.value).toBe('skate');
    expect(parsed.type.value).toBe('cold');
    expect(parsed.length.value).toBe(192);
    expect(parsed.flex.value).toBe(75);
  });

  test('Salomon S/Lab Carbon Skate sticker (compact form)', () => {
    const lines = [
      'SALOMON',
      'S/LAB CARBON SKATE',
      '186 cm',
      '80 kg',
      'Cold',
    ];
    const parsed = parseStickerText(lines);
    expect(parsed.brand.value).toBe('Salomon');
    expect(parsed.model.value).toBe('S/Lab Carbon Skate');
    expect(parsed.technique.value).toBe('skate');
    expect(parsed.type.value).toBe('cold');
    expect(parsed.length.value).toBe(186);
    expect(parsed.length.confidence).toBe('high'); // cm-labeled
    expect(parsed.flex.value).toBe(80);
    expect(parsed.flex.confidence).toBe('high');   // kg-labeled
  });

  test('Madshus Redline with brand + model on same line', () => {
    const lines = [
      'MADSHUS REDLINE',
      'CARBON SKATE',
      '188',
      'F3',
    ];
    const parsed = parseStickerText(lines);
    expect(parsed.brand.value).toBe('Madshus');
    // The model lookup catches "MADSHUS REDLINE" via the
    // 'madshusredline' substring fallback.
    expect(parsed.model.value).toContain('Redline');
    expect(parsed.length.value).toBe(188);
    expect(parsed.build.value).toBe('F3'); // matched a known build
  });
});

describe('parseStickerText — partial sticker (low confidence is honest)', () => {
  test('only brand visible — no model, length, etc.', () => {
    const lines = ['FISCHER'];
    const parsed = parseStickerText(lines);
    expect(parsed.brand.value).toBe('Fischer');
    expect(parsed.model).toBeUndefined();
    expect(parsed.length).toBeUndefined();
    expect(parsed.flex).toBeUndefined();
  });

  test('OCR noise — gibberish lines stay in `unmatched`', () => {
    const lines = [
      'FISCHER',
      'SPEEDMAX 3D',
      '@#$%^', // OCR garbage
      'Manufactured Austria', // factory marking
      '192',
    ];
    const parsed = parseStickerText(lines);
    expect(parsed.brand.value).toBe('Fischer');
    expect(parsed.length.value).toBe(192);
    expect(parsed.unmatched).toEqual(
      expect.arrayContaining(['@#$%^', 'Manufactured Austria']),
    );
  });

  test('no recognisable brand — returns mostly-empty result', () => {
    const lines = ['Some Random Text', 'More Random Stuff'];
    const parsed = parseStickerText(lines);
    expect(parsed.brand).toBeUndefined();
    expect(parsed.model).toBeUndefined();
    expect(parsed.rawLines).toEqual(['Some Random Text', 'More Random Stuff']);
  });

  test('length / flex range guards work', () => {
    // 5 is a serial-digit count, not a length. 999 is junk. 60 is in
    // flex range. The parser should pick 60 as flex.
    const lines = ['FISCHER', 'SPEEDMAX', '5', '999', '60'];
    const parsed = parseStickerText(lines);
    expect(parsed.length).toBeUndefined();
    expect(parsed.flex.value).toBe(60);
  });
});

describe('parseStickerText — technique inference', () => {
  test('classic-only model auto-fills technique even without keyword', () => {
    const lines = ['SALOMON', 'S/LAB CARBON CLASSIC', '202'];
    const parsed = parseStickerText(lines);
    expect(parsed.technique.value).toBe('classic');
    expect(parsed.technique.source).toMatch(/model/);
  });

  test('technique-neutral model — keyword on build line wins', () => {
    const lines = ['FISCHER', 'SPEEDMAX 3D', 'CLASSIC PLUS COLD', '202'];
    const parsed = parseStickerText(lines);
    expect(parsed.technique.value).toBe('classic');
    expect(parsed.type.value).toBe('cold');
  });
});

describe('parseStickerText — year detection', () => {
  test('4-digit year', () => {
    const parsed = parseStickerText(['FISCHER SPEEDMAX', '2024']);
    expect(parsed.year.value).toBe(2024);
    expect(parsed.year.confidence).toBe('medium');
  });

  test('season notation falls back to low confidence', () => {
    const parsed = parseStickerText(['FISCHER SPEEDMAX', '23/24']);
    expect(parsed.year.value).toBe(2023);
    expect(parsed.year.confidence).toBe('low');
  });
});

describe('parseStickerText — edge cases', () => {
  test('empty input → empty shape', () => {
    const parsed = parseStickerText([]);
    expect(parsed.rawLines).toEqual([]);
    expect(parsed.unmatched).toEqual([]);
    expect(parsed.brand).toBeUndefined();
  });

  test('non-array input does not throw', () => {
    expect(parseStickerText(null).rawLines).toEqual([]);
    expect(parseStickerText('FISCHER').rawLines).toEqual([]);
  });

  test('whitespace + empty lines stripped', () => {
    const parsed = parseStickerText(['', '  ', 'FISCHER', '  SPEEDMAX 3D  ']);
    expect(parsed.brand.value).toBe('Fischer');
    expect(parsed.model.value).toBe('Speedmax 3D');
  });
});

describe('toSkiInput', () => {
  test('reduces ConfidentField shape to flat SkiInput', () => {
    const parsed = parseStickerText([
      'FISCHER',
      'SPEEDMAX 3D',
      'SKATE COLD',
      '192',
      '75',
    ]);
    const input = toSkiInput(parsed);
    expect(input).toMatchObject({
      brand: 'Fischer',
      model: 'Speedmax 3D',
      technique: 'skate',
      type: 'cold',
      length: 192,
      flex: 75,
    });
  });

  test('empty parsed → empty object', () => {
    expect(toSkiInput({rawLines: [], unmatched: []})).toEqual({});
    expect(toSkiInput(null)).toEqual({});
  });
});
