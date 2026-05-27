// Ski-sticker OCR parser. Takes the lines that Vision produced and
// figures out which one is brand, which is model, which is length,
// etc. Outputs a SkiInput-shaped object with per-field confidence so
// the screen can show "we're sure about brand+model, not so sure
// about flex" instead of just trusting everything blindly.
//
// Stickers we've sampled in the wild:
//
//   FISCHER          ← brand
//   SPEEDMAX 3D      ← model
//   SKATE PLUS COLD  ← build + technique cue + type cue
//   192              ← length
//   75               ← flex (or sometimes labeled "75 kg")
//   1234567          ← serial (ignored)
//
//   SALOMON          ← brand
//   S/LAB CARBON     ← model
//   SKATE COLD HARD  ← build + technique + type + flex grade
//   186 - 80         ← length-dash-flex pair
//
//   MADSHUS REDLINE  ← brand+model on same line
//   F3 SKATE         ← build code
//
// The parser doesn't trust OCR ordering; it scores each line against
// every field and assigns the best match. Lines that match nothing
// are surfaced as `unmatched` so the user can see what we ignored.

const {
  findModelByAlias,
  knownBrands,
  slugifySkiModel,
} = require('../constants/skiModels');

const TECHNIQUE_WORDS = [
  {test: /\b(skate|skating|freestyle)\b/i, value: 'skate'},
  {test: /\b(classic|classical|diagonal)\b/i, value: 'classic'},
];

const TYPE_WORDS = [
  {test: /\bcold\b/i, value: 'cold'},
  {test: /\bwarm\b/i, value: 'warm'},
  {test: /\b(universal|uni|all\s*round|allround)\b/i, value: 'universal'},
  {test: /\bzero\b/i, value: 'zero'},
];

// "Plus" / "Plus Soft" / "Medium" / "Hard" / "F2"-style build codes.
// We surface these as `build` and don't try to infer flex from them.
const BUILD_HINTS = [
  /\b(plus(?:\s+(?:soft|med(?:ium)?|stiff|hard))?)\b/i,
  /\b(soft|medium|med|stiff|hard)\b/i,
  /\b(f[1-9])\b/i, // Madshus flex codes
  /\b(c[1-9]|s[1-9])\b/i, // Rossignol C/S codes
];

// Length: 150-220 cm makes sense for adult cross-country skis.
const LENGTH_MIN = 140;
const LENGTH_MAX = 220;

// Flex (kg of skier weight the ski is calibrated for): 30-140 kg.
const FLEX_MIN = 30;
const FLEX_MAX = 140;

/**
 * @typedef {Object} ConfidentField
 * @property {*}       value
 * @property {'high'|'medium'|'low'} confidence
 * @property {string} [source]   why we picked it (for debugging / UI tooltip)
 *
 * @typedef {Object} ParsedSticker
 * @property {ConfidentField} [brand]
 * @property {ConfidentField} [model]
 * @property {ConfidentField} [technique]
 * @property {ConfidentField} [type]
 * @property {ConfidentField} [length]
 * @property {ConfidentField} [flex]
 * @property {ConfidentField} [build]
 * @property {ConfidentField} [year]
 * @property {string[]}       rawLines    input, normalized + de-blanked
 * @property {string[]}       unmatched   lines that didn't map to a field
 */

/**
 * Parse the OCR-detected lines of a ski sticker. Pure function — no
 * I/O. Robust to OCR noise: extra punctuation, line-splitting weird,
 * mixed casing.
 *
 * @param {string[]} lines
 * @returns {ParsedSticker}
 */
function parseStickerText(lines) {
  if (!Array.isArray(lines)) {
    return {rawLines: [], unmatched: []};
  }

  const rawLines = lines
    .map(l => (typeof l === 'string' ? l.trim() : ''))
    .filter(l => l.length > 0);

  const out = {rawLines, unmatched: []};
  const consumed = new Set();

  // ── Pass 1: model lookup (highest value signal) ───────────────────
  // Try the whole line, then each pair / triple of adjacent lines —
  // sticker text often gets broken into two visual lines.
  let modelEntry = null;
  let modelLineIdx = -1;

  outer: for (let i = 0; i < rawLines.length; i += 1) {
    const single = rawLines[i];
    const m1 = findModelByAlias(single);
    if (m1) {
      modelEntry = m1;
      modelLineIdx = i;
      out.brand = high(m1.brand, 'matched ski-model database');
      out.model = high(m1.model, 'matched ski-model database');
      consumed.add(i);
      break;
    }
    if (i + 1 < rawLines.length) {
      const combined = `${single} ${rawLines[i + 1]}`;
      const m2 = findModelByAlias(combined);
      if (m2) {
        modelEntry = m2;
        modelLineIdx = i;
        out.brand = high(m2.brand, 'matched ski-model database');
        out.model = high(m2.model, 'matched ski-model database');
        consumed.add(i);
        consumed.add(i + 1);
        break outer;
      }
    }
  }

  // ── Pass 2: brand-only fallback if no model matched ───────────────
  if (!out.brand) {
    const brands = knownBrands();
    for (let i = 0; i < rawLines.length; i += 1) {
      if (consumed.has(i)) continue;
      const slug = slugifySkiModel(rawLines[i]);
      for (const brand of brands) {
        const brandSlug = slugifySkiModel(brand);
        if (slug === brandSlug || slug.includes(brandSlug)) {
          out.brand = medium(brand, 'matched known brand list');
          consumed.add(i);
          break;
        }
      }
      if (out.brand) break;
    }
  }

  // ── Pass 3: technique from model entry, else from word match ──────
  if (modelEntry && modelEntry.technique) {
    out.technique = high(modelEntry.technique, 'inferred from model');
  } else {
    for (let i = 0; i < rawLines.length; i += 1) {
      if (consumed.has(i)) continue;
      for (const m of TECHNIQUE_WORDS) {
        if (m.test.test(rawLines[i])) {
          out.technique = medium(m.value, 'matched on sticker text');
          break;
        }
      }
      if (out.technique) break;
    }
  }

  // ── Pass 4: snow type from word match ────────────────────────────
  for (let i = 0; i < rawLines.length; i += 1) {
    if (consumed.has(i)) continue;
    for (const m of TYPE_WORDS) {
      if (m.test.test(rawLines[i])) {
        out.type = medium(m.value, 'matched on sticker text');
        break;
      }
    }
    if (out.type) break;
  }

  // ── Pass 5: length + flex from numeric scan ───────────────────────
  // Look at every line that hasn't been consumed by brand/model. Pull
  // out integers; the ones in the length range become length
  // candidates, the smaller ones become flex candidates. Prefer
  // labeled values ("192 cm") over bare numbers.
  const lengthCandidates = [];
  const flexCandidates = [];

  for (let i = 0; i < rawLines.length; i += 1) {
    if (consumed.has(i) && i !== modelLineIdx) continue;
    const line = rawLines[i];

    const labeledLength = line.match(/(\d{2,3})\s*cm\b/i);
    if (labeledLength) {
      const n = Number(labeledLength[1]);
      if (n >= LENGTH_MIN && n <= LENGTH_MAX) {
        lengthCandidates.push({value: n, confidence: 'high', source: 'cm-labeled'});
      }
    }

    const labeledFlex = line.match(/(\d{2,3})\s*kg\b/i);
    if (labeledFlex) {
      const n = Number(labeledFlex[1]);
      if (n >= FLEX_MIN && n <= FLEX_MAX) {
        flexCandidates.push({value: n, confidence: 'high', source: 'kg-labeled'});
      }
    }

    // Bare numbers — only consider lines that look mostly numeric.
    if (!labeledLength && !labeledFlex) {
      const numbers = (line.match(/\d{2,3}/g) || []).map(Number);
      for (const n of numbers) {
        if (n >= LENGTH_MIN && n <= LENGTH_MAX) {
          // Could be length OR a 3-digit flex on a particularly stiff
          // ski. Length is far more common for 180+, so favor it.
          lengthCandidates.push({
            value: n,
            confidence: 'medium',
            source: 'bare-number-in-length-range',
          });
        }
        if (n >= FLEX_MIN && n <= FLEX_MAX && n < LENGTH_MIN) {
          flexCandidates.push({
            value: n,
            confidence: 'medium',
            source: 'bare-number-in-flex-range',
          });
        }
      }
    }
  }

  if (lengthCandidates.length > 0) {
    // Prefer high-confidence (labeled) over medium.
    lengthCandidates.sort((a, b) =>
      a.confidence === b.confidence ? 0 : a.confidence === 'high' ? -1 : 1,
    );
    out.length = lengthCandidates[0];
  }
  if (flexCandidates.length > 0) {
    flexCandidates.sort((a, b) =>
      a.confidence === b.confidence ? 0 : a.confidence === 'high' ? -1 : 1,
    );
    out.flex = flexCandidates[0];
  }

  // ── Pass 6: year ──────────────────────────────────────────────────
  for (let i = 0; i < rawLines.length; i += 1) {
    const m = rawLines[i].match(/\b(20\d{2})\b/);
    if (m) {
      const y = Number(m[1]);
      if (y >= 2000 && y <= 2100) {
        out.year = medium(y, 'matched 4-digit year');
        break;
      }
    }
    const slash = rawLines[i].match(/\b(\d{2})\s*\/\s*(\d{2})\b/);
    if (slash) {
      // Season notation "23/24" — use the start year.
      out.year = low(2000 + Number(slash[1]), 'matched season notation');
      break;
    }
  }

  // ── Pass 7: build tag — try the model's own builds first ──────────
  if (modelEntry && modelEntry.builds && modelEntry.builds.length > 0) {
    for (const b of modelEntry.builds) {
      const slug = slugifySkiModel(b);
      for (let i = 0; i < rawLines.length; i += 1) {
        if (slugifySkiModel(rawLines[i]).includes(slug)) {
          out.build = high(b, 'matched a known build for this model');
          break;
        }
      }
      if (out.build) break;
    }
  }
  if (!out.build) {
    for (let i = 0; i < rawLines.length; i += 1) {
      if (consumed.has(i)) continue;
      for (const re of BUILD_HINTS) {
        const m = rawLines[i].match(re);
        if (m) {
          out.build = low(capitalize(m[1]), 'heuristic build hint');
          break;
        }
      }
      if (out.build) break;
    }
  }

  // ── Final: collect unmatched lines for the UI to show ────────────
  for (let i = 0; i < rawLines.length; i += 1) {
    if (!consumed.has(i)) {
      const line = rawLines[i];
      // If this line contributed length/flex/year/build/etc., it's not
      // truly unmatched. We didn't track that exhaustively, so use a
      // looser test: if it's purely numeric or matches a known field
      // word, skip it.
      if (isLikelyFieldLine(line, modelEntry)) {
        continue;
      }
      out.unmatched.push(line);
    }
  }

  return out;
}

function isLikelyFieldLine(line, modelEntry) {
  if (/^\s*\d+\s*(cm|kg)?\s*$/i.test(line)) return true; // pure number
  for (const re of [...TECHNIQUE_WORDS, ...TYPE_WORDS].map(m => m.test)) {
    if (re.test(line)) return true;
  }
  for (const re of BUILD_HINTS) {
    if (re.test(line)) return true;
  }
  if (modelEntry && modelEntry.builds) {
    const slug = slugifySkiModel(line);
    for (const b of modelEntry.builds) {
      if (slug.includes(slugifySkiModel(b))) return true;
    }
  }
  return false;
}

function capitalize(s) {
  return typeof s === 'string' && s.length > 0
    ? s[0].toUpperCase() + s.slice(1).toLowerCase()
    : s;
}

function high(value, source) {
  return {value, confidence: 'high', source};
}
function medium(value, source) {
  return {value, confidence: 'medium', source};
}
function low(value, source) {
  return {value, confidence: 'low', source};
}

/**
 * Convert the ConfidentField shape into a plain SkiInput dict suitable
 * for prefilling the AddSki form. The screen layer also reads the
 * ConfidentField objects directly to render the confidence chips, so
 * this is just a convenience.
 *
 * @param {ParsedSticker} parsed
 * @returns {Object}
 */
function toSkiInput(parsed) {
  const out = {};
  for (const k of [
    'brand',
    'model',
    'technique',
    'type',
    'length',
    'flex',
    'build',
    'year',
  ]) {
    const f = parsed && parsed[k];
    if (f && f.value !== undefined && f.value !== null) {
      out[k] = f.value;
    }
  }
  return out;
}

module.exports = {parseStickerText, toSkiInput};
