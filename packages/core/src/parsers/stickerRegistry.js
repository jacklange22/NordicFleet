// Brand-aware ski-sticker parsing.
//
// The generic parser (stickerParser.parseStickerText) does the heavy
// lifting of mapping OCR lines to fields. THIS layer dispatches to an
// optional brand-specific REFINER that can fix up what the generic pass
// could not (for example, decode a Madshus F1..F4 hardness code into an
// approximate kg flex), then attaches the brand's stickerMetrics and an
// overall confidence summary for the scan UI.
//
// Foundation, not a rewrite: parseSticker(lines) returns everything
// parseStickerText(lines) does, plus `metrics` and `overallConfidence`.

const {parseStickerText} = require('./stickerParser');
const {getStickerMetrics, normalizeBrandKey} = require('./stickerMetrics');

const registry = new Map();

/**
 * Register a brand refiner. `refine(parsed)` receives the generic parse
 * result and may mutate / return an enriched version.
 * @param {string} brandKey
 * @param {(parsed: object) => object} refine
 */
function registerStickerParser(brandKey, refine) {
  registry.set(normalizeBrandKey(brandKey), refine);
  return refine;
}

function getStickerParser(brandKey) {
  return registry.get(normalizeBrandKey(brandKey)) || null;
}

function hasStickerParser(brandKey) {
  return registry.has(normalizeBrandKey(brandKey));
}

function listStickerParsers() {
  return [...registry.keys()];
}

const CONFIDENCE_RANK = {high: 3, medium: 2, low: 1};

/**
 * Collapse the per-field confidences into one summary level for the UI.
 * Identity fields (brand + model) dominate: if both are high we trust
 * the scan overall; otherwise we average what is present.
 * @param {object} parsed
 * @returns {'high'|'medium'|'low'}
 */
function overallConfidence(parsed) {
  if (!parsed) {
    return 'low';
  }
  const brandHigh = parsed.brand && parsed.brand.confidence === 'high';
  const modelHigh = parsed.model && parsed.model.confidence === 'high';
  if (brandHigh && modelHigh) {
    return 'high';
  }
  const present = ['brand', 'model', 'technique', 'type', 'length', 'flex']
    .map(k => parsed[k])
    .filter(f => f && f.confidence);
  if (present.length === 0) {
    return 'low';
  }
  const avg =
    present.reduce((s, f) => s + (CONFIDENCE_RANK[f.confidence] || 0), 0) /
    present.length;
  if (avg >= 2.5) {
    return 'high';
  }
  if (avg >= 1.6) {
    return 'medium';
  }
  return 'low';
}

/**
 * Parse a ski sticker, brand-aware. Pure function.
 * @param {string[]} lines
 * @returns {object} ParsedSticker + {metrics, overallConfidence}
 */
function parseSticker(lines) {
  const parsed = parseStickerText(lines);
  const brand = parsed.brand && parsed.brand.value;
  const refine = getStickerParser(brand);
  const refined = refine ? refine(parsed) || parsed : parsed;
  refined.metrics = getStickerMetrics(brand);
  refined.overallConfidence = overallConfidence(refined);
  return refined;
}

// ── Built-in brand refiners ──────────────────────────────────────────

// Decode a printed hardness code (e.g. Madshus "F3", Rossignol "S2")
// into an approximate kg flex when the generic pass found a build code
// but no numeric flex. Always 'low' confidence — it is an estimate.
function decodeFlexCode(brandName) {
  const metrics = getStickerMetrics(brandName);
  return parsed => {
    if (!parsed.flex && parsed.build && metrics.flexCodes) {
      const code = String(parsed.build.value || '')
        .toLowerCase()
        .replace(/\s+/g, '');
      if (metrics.flexCodes[code] !== undefined) {
        parsed.flex = {
          value: metrics.flexCodes[code],
          confidence: 'low',
          source: `decoded ${metrics.brand} ${parsed.build.value} hardness code`,
        };
      }
    }
    return parsed;
  };
}

registerStickerParser('Madshus', decodeFlexCode('Madshus'));
registerStickerParser('Rossignol', decodeFlexCode('Rossignol'));

module.exports = {
  registerStickerParser,
  getStickerParser,
  hasStickerParser,
  listStickerParsers,
  overallConfidence,
  parseSticker,
};
