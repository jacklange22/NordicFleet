const {validateWaxLogInput} = require('../waxLog');

describe('validateWaxLogInput', () => {
  test('requires skiId', () => {
    expect(() => validateWaxLogInput({})).toThrow(/skiId/);
  });

  test('defaults layers when omitted', () => {
    const out = validateWaxLogInput({skiId: 's1'});
    expect(out.kickLayers).toBe(0);
    expect(out.glideLayers).toBe(1);
  });

  test('glideWaxes resized to match glideLayers (padding)', () => {
    const out = validateWaxLogInput({
      skiId: 's1',
      glideLayers: 3,
      glideWaxes: ['CH6'],
    });
    expect(out.glideWaxes).toEqual(['CH6', '', '']);
  });

  test('glideWaxes resized to match glideLayers (trimming)', () => {
    const out = validateWaxLogInput({
      skiId: 's1',
      glideLayers: 1,
      glideWaxes: ['CH6', 'HF8', 'TR8'],
    });
    expect(out.glideWaxes).toEqual(['CH6']);
  });

  test('binder "None" normalizes to null', () => {
    const out = validateWaxLogInput({skiId: 's1', binder: 'None'});
    expect(out.binder).toBeNull();
  });

  test('empty kickWax becomes null', () => {
    const out = validateWaxLogInput({skiId: 's1', kickWax: '   '});
    expect(out.kickWax).toBeNull();
  });

  test('parallel glideWaxIds normalized to match layers', () => {
    const out = validateWaxLogInput({
      skiId: 's1',
      glideLayers: 2,
      glideWaxes: ['CH6', 'HF8'],
      glideWaxIds: ['swix-ch6'],
    });
    expect(out.glideWaxIds).toEqual(['swix-ch6', null]);
  });

  test('binderId passes through', () => {
    const out = validateWaxLogInput({
      skiId: 's1',
      binder: 'VG Swix',
      binderId: 'swix-vg40',
    });
    expect(out.binderId).toBe('swix-vg40');
  });
});
