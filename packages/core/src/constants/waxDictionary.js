// Curated wax dictionary — common manufacturer products from the main
// nordic ski racing brands.
//
// Sources: manufacturer product catalogs (Swix, Toko, Star, Vauhti,
// Rode, Holmenkol, Briko-Maplus). Where a temperature range is
// well-established in the public catalog it's included; uncertain
// ranges are null.
//
// Conventions:
//   - id   kebab-case: <manufacturer>-<product>-<variant?> lowercased,
//          underscores for spaces inside the product name only.
//   - searchKeywords   lowercase. Always include the bare product name
//          ("vr40") and a "manufacturer product" combo ("swix vr40"),
//          plus the color/variant ("blue") when applicable.
//   - tempRange.unit  always 'C' here. The UI converts for display.
//
// This list is intentionally not exhaustive — it covers the most-used
// products in current/recent racing. Add entries as they come up in
// real test logs. Each entry must be verifiable on the manufacturer's
// product page; do not fabricate.

const C = 'C';

const t = (min, max) => ({min, max, unit: C});

const RAW_WAXES = [
  // ───────────────────────────────────────────────────────────────────
  // Swix — base preparation
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-bp99-base-prep',
    manufacturer: 'Swix',
    product: 'BP99',
    variant: 'Base Prep',
    type: 'base',
    fullName: 'Swix BP99 Base Prep',
    searchKeywords: ['bp99', 'swix bp99', 'swix base prep', 'base prep'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-pn19-pure-nordic',
    manufacturer: 'Swix',
    product: 'PN19',
    variant: 'Pure Nordic',
    type: 'base',
    fullName: 'Swix PN19 Pure Nordic',
    searchKeywords: ['pn19', 'swix pn19', 'pure nordic'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Swix — Marathon (no fluoro, race-day all-temp glide)
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-ms60-marathon-medium',
    manufacturer: 'Swix',
    product: 'MS60',
    variant: 'Marathon Medium',
    type: 'glide',
    fullName: 'Swix MS60 Marathon Medium',
    searchKeywords: ['ms60', 'swix ms60', 'marathon medium', 'swix marathon'],
    tempRange: t(-15, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ms70-marathon-cold',
    manufacturer: 'Swix',
    product: 'MS70',
    variant: 'Marathon Cold',
    type: 'glide',
    fullName: 'Swix MS70 Marathon Cold',
    searchKeywords: ['ms70', 'swix ms70', 'marathon cold'],
    tempRange: t(-25, -5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ms77-marathon-warm',
    manufacturer: 'Swix',
    product: 'MS77',
    variant: 'Marathon Warm',
    type: 'glide',
    fullName: 'Swix MS77 Marathon Warm',
    searchKeywords: ['ms77', 'swix ms77', 'marathon warm'],
    tempRange: t(-4, 2),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Swix — Pro CH (hydrocarbon glide)
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-ch4-green',
    manufacturer: 'Swix',
    product: 'CH4',
    variant: 'Green',
    type: 'glide',
    fullName: 'Swix CH4 Green',
    searchKeywords: ['ch4', 'swix ch4', 'green', 'swix green'],
    tempRange: t(-32, -10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ch6-blue',
    manufacturer: 'Swix',
    product: 'CH6',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Swix CH6 Blue',
    searchKeywords: ['ch6', 'swix ch6', 'blue', 'swix blue'],
    tempRange: t(-12, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ch7-violet',
    manufacturer: 'Swix',
    product: 'CH7',
    variant: 'Violet',
    type: 'glide',
    fullName: 'Swix CH7 Violet',
    searchKeywords: ['ch7', 'swix ch7', 'violet', 'swix violet'],
    tempRange: t(-7, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ch8-red',
    manufacturer: 'Swix',
    product: 'CH8',
    variant: 'Red',
    type: 'glide',
    fullName: 'Swix CH8 Red',
    searchKeywords: ['ch8', 'swix ch8', 'red', 'swix red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ch10-yellow',
    manufacturer: 'Swix',
    product: 'CH10',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Swix CH10 Yellow',
    searchKeywords: ['ch10', 'swix ch10', 'yellow', 'swix yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: null,
  },

  // Swix — Pro LF (low-fluoro, older line, still common in clubs)
  {
    id: 'swix-lf4-green',
    manufacturer: 'Swix',
    product: 'LF4',
    variant: 'Green',
    type: 'glide',
    fullName: 'Swix LF4 Green',
    searchKeywords: ['lf4', 'swix lf4', 'low fluoro green'],
    tempRange: t(-32, -10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-lf6-blue',
    manufacturer: 'Swix',
    product: 'LF6',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Swix LF6 Blue',
    searchKeywords: ['lf6', 'swix lf6', 'low fluoro blue'],
    tempRange: t(-12, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-lf7-violet',
    manufacturer: 'Swix',
    product: 'LF7',
    variant: 'Violet',
    type: 'glide',
    fullName: 'Swix LF7 Violet',
    searchKeywords: ['lf7', 'swix lf7', 'low fluoro violet'],
    tempRange: t(-7, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-lf8-red',
    manufacturer: 'Swix',
    product: 'LF8',
    variant: 'Red',
    type: 'glide',
    fullName: 'Swix LF8 Red',
    searchKeywords: ['lf8', 'swix lf8', 'low fluoro red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-lf10-yellow',
    manufacturer: 'Swix',
    product: 'LF10',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Swix LF10 Yellow',
    searchKeywords: ['lf10', 'swix lf10', 'low fluoro yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: null,
  },

  // Swix — Pro HF (high-fluoro, mostly phased out post-2025 fluoro ban
  // but still found in older bags + legacy logs)
  {
    id: 'swix-hf6-blue',
    manufacturer: 'Swix',
    product: 'HF6',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Swix HF6 Blue',
    searchKeywords: ['hf6', 'swix hf6', 'high fluoro blue'],
    tempRange: t(-12, -4),
    humidityRange: null,
    notes: 'Legacy high-fluoro; banned in many race series after 2025.',
  },
  {
    id: 'swix-hf7-violet',
    manufacturer: 'Swix',
    product: 'HF7',
    variant: 'Violet',
    type: 'glide',
    fullName: 'Swix HF7 Violet',
    searchKeywords: ['hf7', 'swix hf7', 'high fluoro violet'],
    tempRange: t(-7, -2),
    humidityRange: null,
    notes: 'Legacy high-fluoro; banned in many race series after 2025.',
  },
  {
    id: 'swix-hf8-red',
    manufacturer: 'Swix',
    product: 'HF8',
    variant: 'Red',
    type: 'glide',
    fullName: 'Swix HF8 Red',
    searchKeywords: ['hf8', 'swix hf8', 'high fluoro red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: 'Legacy high-fluoro; banned in many race series after 2025.',
  },
  {
    id: 'swix-hf10-yellow',
    manufacturer: 'Swix',
    product: 'HF10',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Swix HF10 Yellow',
    searchKeywords: ['hf10', 'swix hf10', 'high fluoro yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: 'Legacy high-fluoro; banned in many race series after 2025.',
  },

  // Swix — TS Triac Pro (race-grade fluoro-free, current top tier)
  {
    id: 'swix-ts6-blue',
    manufacturer: 'Swix',
    product: 'TS6',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Swix TS6 Triac Pro Blue',
    searchKeywords: ['ts6', 'swix ts6', 'triac blue', 'triac pro blue'],
    tempRange: t(-14, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ts7-violet',
    manufacturer: 'Swix',
    product: 'TS7',
    variant: 'Violet',
    type: 'glide',
    fullName: 'Swix TS7 Triac Pro Violet',
    searchKeywords: ['ts7', 'swix ts7', 'triac violet', 'triac pro violet'],
    tempRange: t(-7, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ts8-red',
    manufacturer: 'Swix',
    product: 'TS8',
    variant: 'Red',
    type: 'glide',
    fullName: 'Swix TS8 Triac Pro Red',
    searchKeywords: ['ts8', 'swix ts8', 'triac red', 'triac pro red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-ts10-yellow',
    manufacturer: 'Swix',
    product: 'TS10',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Swix TS10 Triac Pro Yellow',
    searchKeywords: ['ts10', 'swix ts10', 'triac yellow', 'triac pro yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Swix — V series hardwax (kick)
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-v20-green',
    manufacturer: 'Swix',
    product: 'V20',
    variant: 'Green',
    type: 'kick',
    fullName: 'Swix V20 Green',
    searchKeywords: ['v20', 'swix v20', 'green kick', 'swix kick green'],
    tempRange: t(-15, -8),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-v30-blue',
    manufacturer: 'Swix',
    product: 'V30',
    variant: 'Blue',
    type: 'kick',
    fullName: 'Swix V30 Blue',
    searchKeywords: ['v30', 'swix v30', 'blue kick', 'swix kick blue'],
    tempRange: t(-7, -1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-v40-blue-extra',
    manufacturer: 'Swix',
    product: 'V40',
    variant: 'Blue Extra',
    type: 'kick',
    fullName: 'Swix V40 Blue Extra',
    searchKeywords: ['v40', 'swix v40', 'blue extra'],
    tempRange: t(-4, 0),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-v45-violet-special',
    manufacturer: 'Swix',
    product: 'V45',
    variant: 'Violet Special',
    type: 'kick',
    fullName: 'Swix V45 Violet Special',
    searchKeywords: ['v45', 'swix v45', 'violet special'],
    tempRange: t(-2, 1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-v55-red-special',
    manufacturer: 'Swix',
    product: 'V55',
    variant: 'Red Special',
    type: 'kick',
    fullName: 'Swix V55 Red Special',
    searchKeywords: ['v55', 'swix v55', 'red special'],
    tempRange: t(-1, 3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-v60-red',
    manufacturer: 'Swix',
    product: 'V60',
    variant: 'Red',
    type: 'kick',
    fullName: 'Swix V60 Red',
    searchKeywords: ['v60', 'swix v60', 'red kick'],
    tempRange: t(0, 3),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Swix — VR series hardwax (kick, racing line)
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-vr30-blue',
    manufacturer: 'Swix',
    product: 'VR30',
    variant: 'Blue',
    type: 'kick',
    fullName: 'Swix VR30 Blue',
    searchKeywords: ['vr30', 'swix vr30', 'vr blue', 'vr 30'],
    tempRange: t(-7, -1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr40-blue',
    manufacturer: 'Swix',
    product: 'VR40',
    variant: 'Blue',
    type: 'kick',
    fullName: 'Swix VR40 Blue',
    searchKeywords: ['vr40', 'swix vr40', 'vr 40'],
    tempRange: t(-4, 0),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr45-violet',
    manufacturer: 'Swix',
    product: 'VR45',
    variant: 'Violet',
    type: 'kick',
    fullName: 'Swix VR45 Violet',
    searchKeywords: ['vr45', 'swix vr45', 'vr violet', 'vr 45'],
    tempRange: t(-2, 1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr50-violet',
    manufacturer: 'Swix',
    product: 'VR50',
    variant: 'Violet',
    type: 'kick',
    fullName: 'Swix VR50 Violet',
    searchKeywords: ['vr50', 'swix vr50', 'vr 50'],
    tempRange: t(-1, 2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr55-red',
    manufacturer: 'Swix',
    product: 'VR55',
    variant: 'Red',
    type: 'kick',
    fullName: 'Swix VR55 Red',
    searchKeywords: ['vr55', 'swix vr55', 'vr 55', 'vr red'],
    tempRange: t(0, 2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr60-red',
    manufacturer: 'Swix',
    product: 'VR60',
    variant: 'Red',
    type: 'kick',
    fullName: 'Swix VR60 Red',
    searchKeywords: ['vr60', 'swix vr60', 'vr 60'],
    tempRange: t(1, 3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr65-yellow',
    manufacturer: 'Swix',
    product: 'VR65',
    variant: 'Yellow',
    type: 'kick',
    fullName: 'Swix VR65 Yellow',
    searchKeywords: ['vr65', 'swix vr65', 'vr 65', 'vr yellow'],
    tempRange: t(0, 3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vr70-yellow',
    manufacturer: 'Swix',
    product: 'VR70',
    variant: 'Yellow',
    type: 'kick',
    fullName: 'Swix VR70 Yellow',
    searchKeywords: ['vr70', 'swix vr70', 'vr 70'],
    tempRange: t(1, 4),
    humidityRange: null,
    notes: null,
  },

  // Swix — VG / klister binders
  {
    id: 'swix-vg30-base-binder',
    manufacturer: 'Swix',
    product: 'VG30',
    variant: 'Base Binder',
    type: 'binder',
    fullName: 'Swix VG30 Base Binder',
    searchKeywords: [
      'vg30',
      'swix vg30',
      'base binder',
      'vg binder',
      'vg swix',
    ],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-vg35-base-binder',
    manufacturer: 'Swix',
    product: 'VG35',
    variant: 'Base Klister Binder',
    type: 'binder',
    fullName: 'Swix VG35 Base Klister Binder',
    searchKeywords: ['vg35', 'swix vg35', 'klister binder'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-k21n-base-klister',
    manufacturer: 'Swix',
    product: 'K21N',
    variant: 'Base Klister',
    type: 'klister',
    fullName: 'Swix K21N Base Klister',
    searchKeywords: ['k21n', 'swix k21n', 'base klister'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-k22n-blue-klister',
    manufacturer: 'Swix',
    product: 'K22N',
    variant: 'Blue Klister',
    type: 'klister',
    fullName: 'Swix K22N Blue Klister',
    searchKeywords: ['k22n', 'swix k22n', 'blue klister'],
    tempRange: t(-12, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-k70n-violet-klister',
    manufacturer: 'Swix',
    product: 'K70N',
    variant: 'Violet Klister',
    type: 'klister',
    fullName: 'Swix K70N Violet Klister',
    searchKeywords: ['k70n', 'swix k70n', 'violet klister'],
    tempRange: t(-3, 3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-kr20-red-klister',
    manufacturer: 'Swix',
    product: 'KR20',
    variant: 'Red Klister',
    type: 'klister',
    fullName: 'Swix KR20 Red Klister',
    searchKeywords: ['kr20', 'swix kr20', 'red klister'],
    tempRange: t(0, 5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-kr30-silver-klister',
    manufacturer: 'Swix',
    product: 'KR30',
    variant: 'Silver Klister',
    type: 'klister',
    fullName: 'Swix KR30 Silver Klister',
    searchKeywords: ['kr30', 'swix kr30', 'silver klister'],
    tempRange: t(-1, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'swix-kr60-extra-wet',
    manufacturer: 'Swix',
    product: 'KR60',
    variant: 'Extra Wet Klister',
    type: 'klister',
    fullName: 'Swix KR60 Extra Wet Klister',
    searchKeywords: ['kr60', 'swix kr60', 'extra wet klister'],
    tempRange: t(0, 8),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Toko — glide
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'toko-base-performance',
    manufacturer: 'Toko',
    product: 'Base Performance',
    variant: null,
    type: 'base',
    fullName: 'Toko Base Performance',
    searchKeywords: ['toko base', 'base performance', 'toko base performance'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-performance-cold',
    manufacturer: 'Toko',
    product: 'Performance',
    variant: 'Cold',
    type: 'glide',
    fullName: 'Toko Performance Cold (Blue)',
    searchKeywords: ['toko performance cold', 'toko cold', 'performance blue'],
    tempRange: t(-30, -8),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-performance-blue',
    manufacturer: 'Toko',
    product: 'Performance',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Toko Performance Blue',
    searchKeywords: ['toko performance blue', 'toko blue'],
    tempRange: t(-10, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-performance-red',
    manufacturer: 'Toko',
    product: 'Performance',
    variant: 'Red',
    type: 'glide',
    fullName: 'Toko Performance Red',
    searchKeywords: ['toko performance red', 'toko red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-performance-yellow',
    manufacturer: 'Toko',
    product: 'Performance',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Toko Performance Yellow',
    searchKeywords: ['toko performance yellow', 'toko yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-world-cup-blue',
    manufacturer: 'Toko',
    product: 'World Cup',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Toko World Cup Blue',
    searchKeywords: ['toko world cup blue', 'world cup blue', 'wc blue toko'],
    tempRange: t(-12, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-world-cup-red',
    manufacturer: 'Toko',
    product: 'World Cup',
    variant: 'Red',
    type: 'glide',
    fullName: 'Toko World Cup Red',
    searchKeywords: ['toko world cup red', 'world cup red', 'wc red toko'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-world-cup-yellow',
    manufacturer: 'Toko',
    product: 'World Cup',
    variant: 'Yellow',
    type: 'glide',
    fullName: 'Toko World Cup Yellow',
    searchKeywords: ['toko world cup yellow', 'world cup yellow'],
    tempRange: t(0, 10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-jetstream-3-blue',
    manufacturer: 'Toko',
    product: 'JetStream',
    variant: '3.0 Blue',
    type: 'glide',
    fullName: 'Toko JetStream 3.0 Blue',
    searchKeywords: ['jetstream', 'toko jetstream', 'jetstream blue'],
    tempRange: t(-12, -4),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-jetstream-3-red',
    manufacturer: 'Toko',
    product: 'JetStream',
    variant: '3.0 Red',
    type: 'glide',
    fullName: 'Toko JetStream 3.0 Red',
    searchKeywords: ['jetstream red', 'toko jetstream red'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: null,
  },

  // Toko — kick
  {
    id: 'toko-grip-green',
    manufacturer: 'Toko',
    product: 'Grip',
    variant: 'Green',
    type: 'kick',
    fullName: 'Toko Grip Green',
    searchKeywords: ['toko grip green', 'grip green'],
    tempRange: t(-30, -10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-grip-blue',
    manufacturer: 'Toko',
    product: 'Grip',
    variant: 'Blue',
    type: 'kick',
    fullName: 'Toko Grip Blue',
    searchKeywords: ['toko grip blue'],
    tempRange: t(-10, -3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-grip-violet',
    manufacturer: 'Toko',
    product: 'Grip',
    variant: 'Violet',
    type: 'kick',
    fullName: 'Toko Grip Violet',
    searchKeywords: ['toko grip violet'],
    tempRange: t(-4, 0),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'toko-grip-red',
    manufacturer: 'Toko',
    product: 'Grip',
    variant: 'Red',
    type: 'kick',
    fullName: 'Toko Grip Red',
    searchKeywords: ['toko grip red'],
    tempRange: t(-2, 2),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Star — kick line
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'star-skigo-green',
    manufacturer: 'Star',
    product: 'Skigo Green',
    variant: null,
    type: 'kick',
    fullName: 'Star Skigo Green',
    searchKeywords: ['skigo green', 'star skigo green'],
    tempRange: t(-30, -10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'star-skigo-blue',
    manufacturer: 'Star',
    product: 'Skigo Blue',
    variant: null,
    type: 'kick',
    fullName: 'Star Skigo Blue',
    searchKeywords: ['skigo blue', 'star skigo blue'],
    tempRange: t(-10, -3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'star-skigo-violet',
    manufacturer: 'Star',
    product: 'Skigo Violet',
    variant: null,
    type: 'kick',
    fullName: 'Star Skigo Violet',
    searchKeywords: ['skigo violet', 'star skigo violet'],
    tempRange: t(-3, 0),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'star-skigo-red',
    manufacturer: 'Star',
    product: 'Skigo Red',
    variant: null,
    type: 'kick',
    fullName: 'Star Skigo Red',
    searchKeywords: ['skigo red', 'star skigo red'],
    tempRange: t(-1, 3),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Vauhti — kick + glide
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'vauhti-fkm-cool',
    manufacturer: 'Vauhti',
    product: 'FKM',
    variant: 'Cool',
    type: 'glide',
    fullName: 'Vauhti FKM Cool',
    searchKeywords: ['vauhti fkm cool', 'fkm cool'],
    tempRange: t(-15, -5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'vauhti-fkm-cold',
    manufacturer: 'Vauhti',
    product: 'FKM',
    variant: 'Cold',
    type: 'glide',
    fullName: 'Vauhti FKM Cold',
    searchKeywords: ['vauhti fkm cold', 'fkm cold'],
    tempRange: t(-25, -10),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'vauhti-fkm-mid',
    manufacturer: 'Vauhti',
    product: 'FKM',
    variant: 'Mid',
    type: 'glide',
    fullName: 'Vauhti FKM Mid',
    searchKeywords: ['vauhti fkm mid', 'fkm mid'],
    tempRange: t(-7, -1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'vauhti-fkm-warm',
    manufacturer: 'Vauhti',
    product: 'FKM',
    variant: 'Warm',
    type: 'glide',
    fullName: 'Vauhti FKM Warm',
    searchKeywords: ['vauhti fkm warm', 'fkm warm'],
    tempRange: t(-2, 5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'vauhti-grip-cold-blue',
    manufacturer: 'Vauhti',
    product: 'Grip',
    variant: 'Cold Blue',
    type: 'kick',
    fullName: 'Vauhti Grip Cold Blue',
    searchKeywords: ['vauhti grip blue', 'vauhti cold blue'],
    tempRange: t(-15, -3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'vauhti-grip-violet',
    manufacturer: 'Vauhti',
    product: 'Grip',
    variant: 'Violet',
    type: 'kick',
    fullName: 'Vauhti Grip Violet',
    searchKeywords: ['vauhti grip violet'],
    tempRange: t(-3, 0),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Rode — kick (Italian, very common in Norway / Italy)
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'rode-multigrade-blue',
    manufacturer: 'Rode',
    product: 'Multigrade',
    variant: 'Blue',
    type: 'kick',
    fullName: 'Rode Multigrade Blue',
    searchKeywords: ['rode multigrade blue', 'rode mg blue'],
    tempRange: t(-10, -2),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'rode-multigrade-violet',
    manufacturer: 'Rode',
    product: 'Multigrade',
    variant: 'Violet',
    type: 'kick',
    fullName: 'Rode Multigrade Violet',
    searchKeywords: ['rode multigrade violet', 'rode mg violet'],
    tempRange: t(-3, 0),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'rode-multigrade-red',
    manufacturer: 'Rode',
    product: 'Multigrade',
    variant: 'Red',
    type: 'kick',
    fullName: 'Rode Multigrade Red',
    searchKeywords: ['rode multigrade red', 'rode mg red'],
    tempRange: t(0, 3),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'rode-multigrade-super-red',
    manufacturer: 'Rode',
    product: 'Multigrade',
    variant: 'Super Red',
    type: 'kick',
    fullName: 'Rode Multigrade Super Red',
    searchKeywords: ['rode multigrade super red'],
    tempRange: t(1, 5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'rode-blackbase',
    manufacturer: 'Rode',
    product: 'Blackbase',
    variant: null,
    type: 'binder',
    fullName: 'Rode Blackbase',
    searchKeywords: ['rode blackbase', 'blackbase'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Holmenkol — small subset of common products
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'holmenkol-alpha-mix-cold',
    manufacturer: 'Holmenkol',
    product: 'Alpha Mix',
    variant: 'Cold',
    type: 'glide',
    fullName: 'Holmenkol Alpha Mix Cold',
    searchKeywords: ['holmenkol alpha mix cold', 'alpha mix cold'],
    tempRange: t(-22, -8),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'holmenkol-alpha-mix-mid',
    manufacturer: 'Holmenkol',
    product: 'Alpha Mix',
    variant: 'Mid',
    type: 'glide',
    fullName: 'Holmenkol Alpha Mix Mid',
    searchKeywords: ['holmenkol alpha mix mid', 'alpha mix mid'],
    tempRange: t(-8, -1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'holmenkol-alpha-mix-warm',
    manufacturer: 'Holmenkol',
    product: 'Alpha Mix',
    variant: 'Warm',
    type: 'glide',
    fullName: 'Holmenkol Alpha Mix Warm',
    searchKeywords: ['holmenkol alpha mix warm', 'alpha mix warm'],
    tempRange: t(-2, 6),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Briko-Maplus — small subset
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'briko-maplus-base',
    manufacturer: 'Briko-Maplus',
    product: 'Base',
    variant: null,
    type: 'base',
    fullName: 'Briko-Maplus Base',
    searchKeywords: ['briko maplus base', 'maplus base'],
    tempRange: null,
    humidityRange: null,
    notes: null,
  },
  {
    id: 'briko-maplus-blue',
    manufacturer: 'Briko-Maplus',
    product: 'Race',
    variant: 'Blue',
    type: 'glide',
    fullName: 'Briko-Maplus Race Blue',
    searchKeywords: ['briko maplus blue', 'maplus blue'],
    tempRange: t(-12, -5),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'briko-maplus-violet',
    manufacturer: 'Briko-Maplus',
    product: 'Race',
    variant: 'Violet',
    type: 'glide',
    fullName: 'Briko-Maplus Race Violet',
    searchKeywords: ['briko maplus violet', 'maplus violet'],
    tempRange: t(-5, -1),
    humidityRange: null,
    notes: null,
  },
  {
    id: 'briko-maplus-red',
    manufacturer: 'Briko-Maplus',
    product: 'Race',
    variant: 'Red',
    type: 'glide',
    fullName: 'Briko-Maplus Race Red',
    searchKeywords: ['briko maplus red', 'maplus red'],
    tempRange: t(-1, 4),
    humidityRange: null,
    notes: null,
  },

  // ───────────────────────────────────────────────────────────────────
  // Topcoats / race-day overlays (powders + liquids applied over glide).
  // Real product lines; fluoro powders (Cera F) are legacy / restricted
  // in many race series now but remain real products coaches reference.
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'swix-cera-f-fc8x',
    manufacturer: 'Swix',
    product: 'Cera F FC8X',
    variant: 'Cold',
    type: 'topcoat',
    fullName: 'Swix Cera F FC8X',
    searchKeywords: ['fc8x', 'cera f', 'swix cera f', 'swix fc8x', 'cold powder'],
    tempRange: t(-15, -4),
    humidityRange: null,
    notes: 'Fluorocarbon powder topcoat — restricted in FIS races.',
  },
  {
    id: 'swix-cera-f-fc10x',
    manufacturer: 'Swix',
    product: 'Cera F FC10X',
    variant: 'Universal',
    type: 'topcoat',
    fullName: 'Swix Cera F FC10X',
    searchKeywords: ['fc10x', 'cera f', 'swix cera f', 'swix fc10x', 'universal powder'],
    tempRange: t(-10, 0),
    humidityRange: null,
    notes: 'Fluorocarbon powder topcoat — restricted in FIS races.',
  },
  {
    id: 'toko-helx-blue',
    manufacturer: 'Toko',
    product: 'HelX 3.0',
    variant: 'Blue',
    type: 'topcoat',
    fullName: 'Toko HelX 3.0 Blue',
    searchKeywords: ['helx', 'toko helx', 'helx blue', 'liquid topcoat'],
    tempRange: t(-12, -2),
    humidityRange: null,
    notes: 'Liquid overlay applied over glide.',
  },
  {
    id: 'toko-helx-red',
    manufacturer: 'Toko',
    product: 'HelX 3.0',
    variant: 'Red',
    type: 'topcoat',
    fullName: 'Toko HelX 3.0 Red',
    searchKeywords: ['helx', 'toko helx', 'helx red', 'liquid topcoat'],
    tempRange: t(-4, 4),
    humidityRange: null,
    notes: 'Liquid overlay applied over glide.',
  },

  // ───────────────────────────────────────────────────────────────────
  // Structure — base grind / rilling patterns. These are temperature
  // CONVENTIONS, not branded products: structure naming is shop- and
  // tool-specific, so this category is mostly free-text in practice.
  // These three give the picker a starting suggestion per temp band;
  // coaches type their own (e.g. "Red Creek 1mm", "SG1 broken").
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'structure-fine-cold',
    manufacturer: 'Generic',
    product: 'Fine linear',
    variant: 'Cold',
    type: 'structure',
    fullName: 'Fine linear (cold)',
    searchKeywords: ['fine', 'cold structure', 'linear', 'shallow'],
    tempRange: t(-30, -8),
    humidityRange: null,
    notes: 'Convention, not a product — type your shop’s actual grind.',
  },
  {
    id: 'structure-medium-universal',
    manufacturer: 'Generic',
    product: 'Medium',
    variant: 'Universal',
    type: 'structure',
    fullName: 'Medium (universal)',
    searchKeywords: ['medium', 'universal structure'],
    tempRange: t(-8, -2),
    humidityRange: null,
    notes: 'Convention, not a product — type your shop’s actual grind.',
  },
  {
    id: 'structure-coarse-warm',
    manufacturer: 'Generic',
    product: 'Coarse broken',
    variant: 'Warm',
    type: 'structure',
    fullName: 'Coarse broken (warm)',
    searchKeywords: ['coarse', 'warm structure', 'broken', 'deep'],
    tempRange: t(-2, 10),
    humidityRange: null,
    notes: 'Convention, not a product — type your shop’s actual grind.',
  },
];

// ─── Category model ──────────────────────────────────────────────────
//
// Wax Truck mode (and the wax log) filter suggestions by a coarse
// category. The legacy per-entry `type` maps onto four categories:
//   kick + klister + binder → 'kick'
//   glide + base prep       → 'paraffin'
//   topcoat                 → 'topcoat'
//   structure               → 'structure'
// The `category` field is the primary (used for sorting / the chip);
// `categories` is the (currently single-element) list for the rare
// entry that spans more than one. Derived here so we never hand-edit
// every entry.

const TYPE_TO_CATEGORY = Object.freeze({
  kick: 'kick',
  klister: 'kick',
  binder: 'kick',
  glide: 'paraffin',
  base: 'paraffin',
  topcoat: 'topcoat',
  structure: 'structure',
});

const WAX_CATEGORIES = Object.freeze(['kick', 'paraffin', 'topcoat', 'structure']);

const WAX_DICTIONARY = Object.freeze(
  RAW_WAXES.map(w => {
    const category = TYPE_TO_CATEGORY[w.type] || 'paraffin';
    return Object.freeze({...w, category, categories: [category]});
  }),
);

/**
 * Filter the dictionary for typeahead matches.
 *
 * @param {string} query    lowercased substring search
 * @param {Object} [opts]
 * @param {string} [opts.type]
 * @param {number} [opts.limit]
 * @returns {Array}
 */
function searchWaxes(query, opts = {}) {
  const q = (query || '').trim().toLowerCase();
  const limit = opts.limit || 30;
  let candidates = WAX_DICTIONARY;
  // Back-compat: `type` still filters on the legacy field.
  if (opts.type) {
    candidates = candidates.filter(w => w.type === opts.type);
  }
  // New: `category` filters on the coarse category. Matches either the
  // primary category or any in the `categories` list.
  if (opts.category) {
    candidates = candidates.filter(
      w =>
        w.category === opts.category ||
        (w.categories && w.categories.includes(opts.category)),
    );
  }
  if (!q) {
    return candidates.slice(0, limit);
  }
  const matches = [];
  for (const wax of candidates) {
    if (wax.fullName.toLowerCase().includes(q)) {
      matches.push(wax);
      continue;
    }
    if (wax.searchKeywords.some(k => k.includes(q))) {
      matches.push(wax);
    }
  }
  return matches.slice(0, limit);
}

/**
 * All waxes in a category, unfiltered by query. Convenience wrapper
 * over searchWaxes for the Wax Truck combination builder, which shows
 * the full category list before the user types.
 *
 * @param {'kick'|'paraffin'|'topcoat'|'structure'} category
 * @param {number} [limit]
 */
function waxesByCategory(category, limit = 100) {
  return searchWaxes('', {category, limit});
}

function getWaxById(id) {
  if (!id) {
    return null;
  }
  return WAX_DICTIONARY.find(w => w.id === id) || null;
}

module.exports = {
  WAX_DICTIONARY,
  WAX_CATEGORIES,
  searchWaxes,
  waxesByCategory,
  getWaxById,
};
