// Curated cross-country ski model database.
//
// Used by the sticker parser to disambiguate OCR output: when Vision
// returns "Speedmax" + "Fischer" on adjacent lines, we can look that
// up here, lock in the brand, and infer that the technique is
// model-determined ("Speedmax" only ships as classic OR as the modern
// 3D Twin-Skin that works both ways).
//
// Curation principles:
//   - top-end race / training skis, the kind a customer adding to
//     their fleet would own. Beginner package skis aren't here.
//   - covered: every brand that placed in a World Cup top-30 in the
//     last five seasons (Salomon, Fischer, Madshus, Atomic, Rossignol,
//     Peltonen, One Way, Yoko).
//   - aliases are lowercase + non-alphanumeric stripped, so OCR
//     output goes through the same slugifier before lookup.
//   - technique is set only when the model is style-specific.
//     Universal / dual-purpose models (e.g. Fischer Twin Skin) leave
//     it null.
//
// Schema:
//   {
//     brand:     string,
//     model:     string,                // canonical display name
//     aliases:   string[],              // slugified match candidates
//     technique: 'classic'|'skate'|null,
//     builds?:   string[],              // common build / construction tags
//   }

const SKI_MODELS = Object.freeze([
  // ─── Salomon ──────────────────────────────────────────────────────
  {
    brand: 'Salomon',
    model: 'S/Lab Carbon Classic',
    aliases: ['slabcarbonclassic', 'slabclassic', 'salomonslab'],
    technique: 'classic',
    builds: ['Cold', 'Warm', 'Plus'],
  },
  {
    brand: 'Salomon',
    model: 'S/Lab Carbon Skate',
    aliases: ['slabcarbonskate', 'slabskate', 'slabcarbon'],
    technique: 'skate',
    builds: ['Cold', 'Warm', 'Soft', 'Med', 'Hard'],
  },
  {
    brand: 'Salomon',
    model: 'S/Lab Skin Classic',
    aliases: ['slabskin', 'slabskinclassic'],
    technique: 'classic',
  },
  {
    brand: 'Salomon',
    model: 'RS 10',
    aliases: ['rs10', 'salomonrs10'],
    technique: 'skate',
  },
  {
    brand: 'Salomon',
    model: 'RC 10 eSkin',
    aliases: ['rc10eskin', 'rc10skin', 'salomoneskin'],
    technique: 'classic',
  },

  // ─── Fischer ──────────────────────────────────────────────────────
  {
    brand: 'Fischer',
    model: 'Speedmax 3D',
    aliases: ['speedmax3d', 'speedmax', 'fischerspeedmax'],
    technique: null,
    builds: ['Skate Cold', 'Skate Plus', 'Classic Cold', 'Classic Plus', 'Classic Soft'],
  },
  {
    brand: 'Fischer',
    model: 'Speedmax Skate',
    aliases: ['speedmaxskate'],
    technique: 'skate',
    builds: ['Cold', 'Plus Soft', 'Plus Med', 'Plus Stiff'],
  },
  {
    brand: 'Fischer',
    model: 'Speedmax Classic',
    aliases: ['speedmaxclassic'],
    technique: 'classic',
    builds: ['Cold', 'Plus Soft', 'Plus Med', 'Plus Stiff'],
  },
  {
    brand: 'Fischer',
    model: 'CarbonLite Skate',
    aliases: ['carbonliteskate', 'carbonlite', 'fischercarbonlite'],
    technique: 'skate',
    builds: ['Cold', 'Med', 'Soft'],
  },
  {
    brand: 'Fischer',
    model: 'CarbonLite Classic',
    aliases: ['carbonliteclassic'],
    technique: 'classic',
    builds: ['Cold', 'Med', 'Soft'],
  },
  {
    brand: 'Fischer',
    model: 'RCS Skate',
    aliases: ['rcsskate', 'fischerrcs'],
    technique: 'skate',
  },
  {
    brand: 'Fischer',
    model: 'RCS Classic',
    aliases: ['rcsclassic'],
    technique: 'classic',
  },
  {
    brand: 'Fischer',
    model: 'Twin Skin Carbon',
    aliases: ['twinskincarbon', 'twinskin', 'fischertwinskin'],
    technique: 'classic',
  },
  {
    brand: 'Fischer',
    model: 'RCS Skin',
    aliases: ['rcsskin'],
    technique: 'classic',
  },
  {
    brand: 'Fischer',
    model: 'RCR',
    aliases: ['rcr', 'fischerrcr'],
    technique: null,
  },

  // ─── Madshus ──────────────────────────────────────────────────────
  {
    brand: 'Madshus',
    model: 'Redline Carbon Skate',
    aliases: ['redlinecarbonskate', 'redlineskate', 'madshusredline'],
    technique: 'skate',
    builds: ['Cold', 'F2', 'F3', 'F4'],
  },
  {
    brand: 'Madshus',
    model: 'Redline Carbon Classic',
    aliases: ['redlinecarbonclassic', 'redlineclassic'],
    technique: 'classic',
    builds: ['Cold', 'F2', 'F3', 'F4'],
  },
  {
    brand: 'Madshus',
    model: 'Redline Skin Carbon',
    aliases: ['redlineskincarbon', 'redlineskin'],
    technique: 'classic',
  },
  {
    brand: 'Madshus',
    model: 'Nanosonic Carbon Skate',
    aliases: ['nanosoniccarbonskate', 'nanosonicskate', 'nanosonic'],
    technique: 'skate',
  },
  {
    brand: 'Madshus',
    model: 'Nanosonic Carbon Classic',
    aliases: ['nanosoniccarbonclassic', 'nanosonicclassic'],
    technique: 'classic',
  },
  {
    brand: 'Madshus',
    model: 'Empower Carbon',
    aliases: ['empowercarbon', 'empower', 'madshusempower'],
    technique: null,
  },
  {
    brand: 'Madshus',
    model: 'Endurance',
    aliases: ['endurance', 'madshusendurance'],
    technique: null,
  },

  // ─── Atomic ───────────────────────────────────────────────────────
  {
    brand: 'Atomic',
    model: 'Redster S9 Carbon Skate',
    aliases: ['redsters9carbonskate', 'redsters9', 'redsters9skate'],
    technique: 'skate',
    builds: ['Cold', 'Universal', 'Soft', 'Medium', 'Hard'],
  },
  {
    brand: 'Atomic',
    model: 'Redster C9 Carbon Classic',
    aliases: ['redsterc9carbonclassic', 'redsterc9', 'redsterc9classic'],
    technique: 'classic',
    builds: ['Cold', 'Universal', 'Soft', 'Medium', 'Hard'],
  },
  {
    brand: 'Atomic',
    model: 'Redster S7 Skate',
    aliases: ['redsters7skate', 'redsters7'],
    technique: 'skate',
  },
  {
    brand: 'Atomic',
    model: 'Redster C7 Classic',
    aliases: ['redsterc7classic', 'redsterc7'],
    technique: 'classic',
  },
  {
    brand: 'Atomic',
    model: 'Pro C2 Skintec',
    aliases: ['proc2skintec', 'proc2', 'proc2skin'],
    technique: 'classic',
  },

  // ─── Rossignol ────────────────────────────────────────────────────
  {
    brand: 'Rossignol',
    model: 'X-IUM Carbon Premium Skate',
    aliases: ['xiumcarbonpremiumskate', 'xiumpremiumskate', 'xiumskate', 'xium'],
    technique: 'skate',
    builds: ['Cold', 'WCS', 'Plus', 'S2', 'S3', 'IFP'],
  },
  {
    brand: 'Rossignol',
    model: 'X-IUM Carbon Premium Classic',
    aliases: ['xiumcarbonpremiumclassic', 'xiumpremiumclassic', 'xiumclassic'],
    technique: 'classic',
    builds: ['Cold', 'WCS', 'Plus', 'C2', 'C3', 'IFP'],
  },
  {
    brand: 'Rossignol',
    model: 'X-IUM Skating WCS',
    aliases: ['xiumskatingwcs', 'xiumwcsskate'],
    technique: 'skate',
  },
  {
    brand: 'Rossignol',
    model: 'R-Skin Ultra',
    aliases: ['rskinultra', 'rskinultraclassic'],
    technique: 'classic',
  },
  {
    brand: 'Rossignol',
    model: 'R-Skin Premium',
    aliases: ['rskinpremium', 'rskinpremiumclassic'],
    technique: 'classic',
  },
  {
    brand: 'Rossignol',
    model: 'Delta Sport R-Skin',
    aliases: ['deltasportrskin', 'deltasport', 'deltarskin'],
    technique: 'classic',
  },

  // ─── Peltonen ─────────────────────────────────────────────────────
  {
    brand: 'Peltonen',
    model: 'Supra X Skate',
    aliases: ['supraxskate', 'suprax'],
    technique: 'skate',
  },
  {
    brand: 'Peltonen',
    model: 'Supra G Skate',
    aliases: ['supragskate', 'suprag'],
    technique: 'skate',
  },
  {
    brand: 'Peltonen',
    model: 'Infra X Classic',
    aliases: ['infraxclassic', 'infrax'],
    technique: 'classic',
  },
  {
    brand: 'Peltonen',
    model: 'Infra X Pro',
    aliases: ['infraxpro'],
    technique: 'classic',
  },

  // ─── One Way ──────────────────────────────────────────────────────
  {
    brand: 'One Way',
    model: 'Diamond Classic',
    aliases: ['diamondclassic', 'onewaydiamond'],
    technique: 'classic',
  },
  {
    brand: 'One Way',
    model: 'Diamond Skate',
    aliases: ['diamondskate'],
    technique: 'skate',
  },
  {
    brand: 'One Way',
    model: 'Premio Carbon',
    aliases: ['premiocarbon', 'premio'],
    technique: null,
  },

  // ─── Yoko ─────────────────────────────────────────────────────────
  {
    brand: 'Yoko',
    model: 'YXR Carbon Skate',
    aliases: ['yxrcarbonskate', 'yxr', 'yxrskate'],
    technique: 'skate',
  },
  {
    brand: 'Yoko',
    model: 'YXR Carbon Classic',
    aliases: ['yxrcarbonclassic', 'yxrclassic'],
    technique: 'classic',
  },
]);

function slugifySkiModel(s) {
  if (typeof s !== 'string') {
    return '';
  }
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Precomputed: brand-slug → entries[] for fast brand lookup by OCR.
const BRAND_INDEX = (() => {
  const map = new Map();
  for (const entry of SKI_MODELS) {
    const slug = slugifySkiModel(entry.brand);
    if (!map.has(slug)) {
      map.set(slug, []);
    }
    map.get(slug).push(entry);
  }
  return map;
})();

// Precomputed: alias slug → entry, for model lookup. Earlier entries
// in SKI_MODELS win on conflict (rare; we curate to avoid this).
const ALIAS_INDEX = (() => {
  const map = new Map();
  for (const entry of SKI_MODELS) {
    for (const alias of entry.aliases || []) {
      if (!map.has(alias)) {
        map.set(alias, entry);
      }
    }
    // Also index the canonical model name itself, slugified.
    const modelSlug = slugifySkiModel(entry.model);
    if (modelSlug && !map.has(modelSlug)) {
      map.set(modelSlug, entry);
    }
  }
  return map;
})();

/**
 * Return all known brand names (deduped, original case).
 * Used by the sticker parser for brand-line matching.
 *
 * @returns {string[]}
 */
function knownBrands() {
  const set = new Set();
  for (const e of SKI_MODELS) {
    set.add(e.brand);
  }
  return [...set];
}

/**
 * Look up a ski model by an OCR-derived alias. Slugifies the input
 * before matching, so "Speed Max" → "speedmax" → Speedmax 3D.
 *
 * @param {string} alias
 * @returns {object|null} the canonical entry, or null if not found
 */
function findModelByAlias(alias) {
  const slug = slugifySkiModel(alias);
  if (!slug) {
    return null;
  }
  if (ALIAS_INDEX.has(slug)) {
    return ALIAS_INDEX.get(slug);
  }
  // Try a substring match: if the slug *contains* a known alias,
  // pick the longest. This handles "fischerspeedmax3dpluscold"
  // catching "speedmax3d".
  let best = null;
  for (const [aliasSlug, entry] of ALIAS_INDEX.entries()) {
    if (aliasSlug.length < 4) {
      continue; // skip very short slugs (false positives)
    }
    if (slug.includes(aliasSlug)) {
      if (!best || aliasSlug.length > best.slug.length) {
        best = {slug: aliasSlug, entry};
      }
    }
  }
  return best ? best.entry : null;
}

/**
 * Look up the brand-level metadata. Returns the array of canonical
 * model entries under that brand, or null if the brand isn't known.
 *
 * @param {string} brand
 * @returns {object[]|null}
 */
function modelsForBrand(brand) {
  const slug = slugifySkiModel(brand);
  return BRAND_INDEX.get(slug) || null;
}

module.exports = {
  SKI_MODELS,
  knownBrands,
  findModelByAlias,
  modelsForBrand,
  slugifySkiModel,
};
