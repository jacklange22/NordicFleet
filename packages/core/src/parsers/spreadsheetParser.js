// Deterministic tabular-text parser. Takes whatever the user pasted from
// Excel / Google Sheets / a CSV file / a markdown table, returns a
// 2D array of cells plus enough metadata for the UI to render a preview.
//
// In Feature 1.1 this file delivers the structural side — delimiter
// detection + per-row tokenization. Feature 1.2 layers
// `mapHeadersToFields` + `normalizeRow` on top to produce typed ski
// records.
//
// No regex magic where a simple state machine works. No fuzzy guessing
// where the user can disambiguate. All transformations here are
// reversible; nothing is normalized in-place.

/**
 * Detect the most likely delimiter for a tabular paste.
 *
 * Strategy: look at the first non-empty data line.
 *   1. If it starts and ends with `|`, treat the input as a markdown
 *      table — delimiter is `|`.
 *   2. Otherwise, count tabs vs commas vs the implied "2+ spaces"
 *      whitespace columns. Pick the highest count, with tab > comma
 *      > pipe > whitespace as the tie-breaker (matches what most
 *      copy-from-Sheets users get).
 *
 * @param {string} input
 * @returns {{kind: 'tab'|'comma'|'pipe'|'whitespace'|'markdown', char: string|RegExp}}
 */
function detectDelimiter(input) {
  const firstLine = firstNonEmptyLine(input);
  if (!firstLine) {
    return {kind: 'tab', char: '\t'};
  }
  const trimmed = firstLine.trim();
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    return {kind: 'markdown', char: '|'};
  }
  const tabs = countUnquoted(firstLine, '\t');
  const commas = countUnquoted(firstLine, ',');
  const pipes = countUnquoted(firstLine, '|');
  const wsGroups = (firstLine.match(/ {2,}|\t+/g) || []).length;
  const max = Math.max(tabs, commas, pipes);
  if (max === 0 && wsGroups === 0) {
    return {kind: 'whitespace', char: /\s+/};
  }
  if (tabs >= commas && tabs >= pipes && tabs > 0) {
    return {kind: 'tab', char: '\t'};
  }
  if (commas >= pipes && commas > 0) {
    return {kind: 'comma', char: ','};
  }
  if (pipes > 0) {
    return {kind: 'pipe', char: '|'};
  }
  return {kind: 'whitespace', char: /\s+/};
}

function firstNonEmptyLine(input) {
  if (typeof input !== 'string') {
    return null;
  }
  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      return line;
    }
  }
  return null;
}

function countUnquoted(line, ch) {
  let inQuote = false;
  let n = 0;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      // Handle "" as escape for "
      if (inQuote && line[i + 1] === '"') {
        i += 1;
      } else {
        inQuote = !inQuote;
      }
    } else if (!inQuote && c === ch) {
      n += 1;
    }
  }
  return n;
}

/**
 * Split a single CSV/TSV line into cells, respecting `""` quoting.
 * Markdown rows are split separately (no quote handling).
 *
 * @param {string} line
 * @param {string} char  delimiter character
 */
function splitCsvLine(line, char) {
  const cells = [];
  let buf = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        buf += '"';
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (!inQuote && c === char) {
      cells.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  cells.push(buf);
  return cells.map(s => s.trim());
}

function splitMarkdownLine(line) {
  // Markdown rows look like "| a | b | c |" — strip the outer pipes
  // and split on inner ones. We don't apply quote logic.
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(s => s.trim());
}

function isMarkdownSeparatorRow(cells) {
  // The separator row in a markdown table looks like
  // "| --- | :---: | --- |" — every cell is dashes (optionally with
  // colons for alignment).
  return (
    cells.length > 0 &&
    cells.every(c => /^:?-+:?$/.test(c.trim()))
  );
}

function splitWhitespaceLine(line) {
  return line.trim().split(/\s+/);
}

/**
 * Tokenize the input into rows. Strips empty lines + markdown
 * separator rows. Returns the detected delimiter so the caller can
 * render it back to the user.
 *
 * @param {string} input
 * @returns {{delimiter: ReturnType<typeof detectDelimiter>, rows: string[][]}}
 */
function tokenizeRows(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return {
      delimiter: {kind: 'tab', char: '\t'},
      rows: [],
    };
  }
  const delim = detectDelimiter(input);
  const rawLines = input.split(/\r?\n/);
  const rows = [];

  for (const raw of rawLines) {
    if (!raw.trim()) {
      continue;
    }
    let cells;
    if (delim.kind === 'markdown') {
      cells = splitMarkdownLine(raw);
      if (isMarkdownSeparatorRow(cells)) {
        continue;
      }
    } else if (delim.kind === 'whitespace') {
      cells = splitWhitespaceLine(raw);
    } else if (delim.kind === 'pipe') {
      // Pipe-delimited without markdown framing — same handling as
      // markdown body rows.
      cells = splitMarkdownLine(raw);
      if (isMarkdownSeparatorRow(cells)) {
        continue;
      }
    } else {
      cells = splitCsvLine(raw, delim.char);
    }
    rows.push(cells);
  }

  return {delimiter: delim, rows};
}

// ─── Header alias mapping ───────────────────────────────────────────
//
// Each Ski field maps to a list of accepted header strings. The order
// inside each list is significant — earlier aliases beat later ones in
// a tie. Headers are normalized via `slugifyHeader` (lowercased,
// non-alphanumeric stripped) before matching, so "Ski Name", "ski_name",
// and "ski-name" all collapse to "skiname".

const HEADER_ALIASES = Object.freeze({
  name: ['name', 'ski name', 'label', 'nickname', 'ski', 'description'],
  brand: ['brand', 'manufacturer', 'make'],
  model: ['model', 'ski model'],
  technique: [
    'technique',
    'discipline',
    'style',
    'type of skiing',
    'classic or skate',
  ],
  type: [
    'type',
    'condition',
    'snow type',
    'temp',
    'temperature',
    'temperature range',
    'temp range',
    // Real-world spreadsheets often label this column with the enum
    // values themselves separated by slashes, in whatever order the
    // user thinks of them. Match every permutation we've actually
    // seen in user data.
    'uni/cold/warm',
    'cold/uni/warm',
    'warm/uni/cold',
    'cold/warm',
    'cold/warm/uni',
    'warm/cold/uni',
    'cold/universal/warm',
  ],
  length: ['length', 'len', 'cm', 'size'],
  flex: ['flex', 'hardness', 'flex kg', 'kg', 'stiffness'],
  build: ['build', 'construction', 'model year', 'series'],
  base: ['base', 'base type', 'base material'],
  grind: ['grind', 'structure', 'base structure', 'stone grind'],
  year: [
    'year',
    'year bought',
    'manufacture year',
    'production year',
    'purchased',
    'bought',
  ],
  // `description` intentionally lives on both `name` and `notes`. Since
  // the alias-lookup keeps the earlier insertion in case of a slug
  // collision, `description` resolves to `name` — which is what we
  // want when the source spreadsheet has *no* name column but a
  // description column does double duty for the row label.
  notes: ['notes', 'comments', 'remarks', 'description'],
});

function slugifyHeader(s) {
  if (typeof s !== 'string') {
    return '';
  }
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Precompute the slugged alias → field map (with tie-break order).
const ALIAS_LOOKUP = (() => {
  const map = new Map();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    aliases.forEach((alias, idx) => {
      const slug = slugifyHeader(alias);
      // Earlier aliases (lower idx) and earlier fields (object insertion
      // order) win ties.
      if (!map.has(slug)) {
        map.set(slug, {field, idx});
      }
    });
  }
  return map;
})();

/**
 * Map a single header cell to a known Ski field, or null if it isn't
 * recognized.
 *
 * @param {string} headerCell
 * @returns {string | null}
 */
function fieldForHeader(headerCell) {
  const slug = slugifyHeader(headerCell);
  if (!slug) {
    return null;
  }
  // Exact match first.
  if (ALIAS_LOOKUP.has(slug)) {
    return ALIAS_LOOKUP.get(slug).field;
  }
  // Substring fallback: if the slug *contains* a known alias entirely,
  // pick the longest alias that fits. ("ski model 2025" → "skimodel" →
  // contains "skimodel" → model.)
  let best = null;
  for (const [aliasSlug, {field}] of ALIAS_LOOKUP.entries()) {
    if (aliasSlug.length < 3) {
      // Skip very short aliases ("len", "kg") to avoid false hits in
      // substring mode — exact match above already covers them.
      continue;
    }
    if (slug.includes(aliasSlug)) {
      if (!best || aliasSlug.length > best.aliasSlug.length) {
        best = {field, aliasSlug};
      }
    }
  }
  return best ? best.field : null;
}

/**
 * Decide whether the first tokenized row is a header row. Heuristic:
 *   - at least one cell maps to a known Ski field via fieldForHeader,
 *     AND
 *   - none of the cells look like obvious data (pure numeric, ski
 *     names, etc.) — operationally, "looks like data" means the cell
 *     parses as a number on its own.
 *
 * Returns true / false. The caller decides what to do if false (offer
 * manual mapping).
 *
 * @param {string[]} row
 */
function looksLikeHeaderRow(row) {
  if (!Array.isArray(row) || row.length === 0) {
    return false;
  }
  let mapped = 0;
  let numericLooking = 0;
  for (const cell of row) {
    if (cell && fieldForHeader(cell)) {
      mapped += 1;
    }
    if (cell && /^-?\d+(?:\.\d+)?$/.test(cell.trim())) {
      numericLooking += 1;
    }
  }
  // At least one mapped header AND mapped > numeric — i.e. the row is
  // more "labels" than "values".
  return mapped >= 1 && mapped > numericLooking;
}

/**
 * Given a header row, return the column-index → field mapping.
 * Unrecognized columns map to null.
 *
 * @param {string[]} headerRow
 * @returns {Array<string|null>}  array indexed by column
 */
function mapHeadersToFields(headerRow) {
  if (!Array.isArray(headerRow)) {
    return [];
  }
  return headerRow.map(cell => fieldForHeader(cell));
}

// ─── Value normalization ─────────────────────────────────────────────

const TECHNIQUE_MATCHERS = [
  {test: /^(c|classic|classical|trad)/i, value: 'classic'},
  {test: /^(s|skate|skating|freestyle)/i, value: 'skate'},
];

const TYPE_MATCHERS = [
  {test: /cold/i, value: 'cold'},
  {test: /warm/i, value: 'warm'},
  {test: /zero/i, value: 'zero'},
  {test: /(universal|uni|all\s*round|allround)/i, value: 'universal'},
];

function normalizeTechnique(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  const t = raw.trim();
  if (!t) {
    return null;
  }
  for (const m of TECHNIQUE_MATCHERS) {
    if (m.test.test(t)) {
      return m.value;
    }
  }
  return null;
}

function normalizeType(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  const t = raw.trim();
  if (!t) {
    return null;
  }
  for (const m of TYPE_MATCHERS) {
    if (m.test.test(t)) {
      return m.value;
    }
  }
  return null;
}

function normalizeInteger(raw, {stripUnits = []} = {}) {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.round(raw) : null;
  }
  if (typeof raw !== 'string') {
    return null;
  }
  let s = raw.trim();
  if (!s) {
    return null;
  }
  for (const unit of stripUnits) {
    s = s.replace(new RegExp(unit + '$', 'i'), '').trim();
  }
  // Replace decimal comma with dot (European locales).
  s = s.replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n);
}

function normalizeYear(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }
  const s = String(raw).trim();
  if (!s) {
    return null;
  }
  const four = s.match(/\b(\d{4})\b/);
  if (four) {
    const y = parseInt(four[1], 10);
    if (y >= 1900 && y <= 2100) {
      return y;
    }
  }
  const two = s.match(/^(\d{2})$/);
  if (two) {
    return 2000 + parseInt(two[1], 10);
  }
  return null;
}

function trimStringOrNull(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  const t = raw.trim();
  return t || null;
}

/**
 * Normalize a raw row's cells into a typed Ski-input shape, given the
 * column→field mapping. Returns {data, errors} where errors is an
 * array of {field, message} for fields that the caller should warn
 * about (missing required, unparseable enum, etc.).
 *
 * Rules:
 *  - name auto-generated as `${brand} ${model}` when missing AND
 *    brand+model present.
 *  - technique enum: must end up 'classic' | 'skate'.
 *  - type enum: must end up 'cold' | 'universal' | 'warm' | 'zero'
 *    (optional — empty → null, "warm" → 'warm', etc.).
 *  - length / flex / year — strip units, parse integer.
 *  - brand, model, technique are required. Missing → errors entry.
 *
 * @param {string[]} row
 * @param {Array<string|null>} mapping  column → field
 */
function normalizeRow(row, mapping) {
  const data = {};
  const errors = [];

  for (let i = 0; i < row.length; i += 1) {
    const field = mapping[i];
    if (!field) {
      continue;
    }
    const raw = row[i];
    switch (field) {
      case 'technique': {
        if (raw && raw.trim()) {
          const v = normalizeTechnique(raw);
          if (v) {
            data.technique = v;
          } else {
            errors.push({field, message: `Technique "${raw}" not understood`});
          }
        }
        break;
      }
      case 'type': {
        if (raw && raw.trim()) {
          const v = normalizeType(raw);
          if (v) {
            data.type = v;
          } else {
            errors.push({field, message: `Type "${raw}" not understood`});
          }
        }
        break;
      }
      case 'length': {
        const v = normalizeInteger(raw, {stripUnits: ['cm', 'mm']});
        if (v !== null) {
          data.length = v;
        } else if (raw && raw.trim()) {
          errors.push({field, message: `Length "${raw}" is not a number`});
        }
        break;
      }
      case 'flex': {
        const v = normalizeInteger(raw, {stripUnits: ['kg']});
        if (v !== null) {
          data.flex = v;
        } else if (raw && raw.trim()) {
          errors.push({field, message: `Flex "${raw}" is not a number`});
        }
        break;
      }
      case 'year': {
        const v = normalizeYear(raw);
        if (v !== null) {
          data.year = v;
        } else if (raw && raw.trim()) {
          errors.push({field, message: `Year "${raw}" is not a year`});
        }
        break;
      }
      case 'name':
      case 'brand':
      case 'model':
      case 'build':
      case 'base':
      case 'grind':
      case 'notes': {
        const v = trimStringOrNull(raw);
        if (v !== null) {
          data[field] = v;
        }
        break;
      }
      default:
        // Unknown field — caller should never produce one. Ignore.
        break;
    }
  }

  // Auto-generate a name from brand + model when missing.
  if (!data.name && data.brand && data.model) {
    data.name = `${data.brand} ${data.model}`;
  }

  // The downstream Ski validator requires a snow `type`; the spreadsheet
  // user almost never wants to label every row with one, so we default
  // unmapped / empty type cells to 'universal' here. If the user *did*
  // provide a type cell and it was unparseable, an error is already in
  // the list — don't paper over that.
  if (!data.type && !errors.some(e => e.field === 'type')) {
    data.type = 'universal';
  }

  // Required-field checks.
  if (!data.name) {
    errors.push({field: 'name', message: 'Name is required'});
  }
  if (!data.brand) {
    errors.push({field: 'brand', message: 'Brand is required'});
  }
  if (!data.model) {
    errors.push({field: 'model', message: 'Model is required'});
  }
  if (!data.technique) {
    errors.push({field: 'technique', message: 'Technique is required'});
  }

  return {data, errors};
}

/**
 * Apply a manually-supplied column→field mapping to the parsed rows.
 * Used when the auto-detected mapping was wrong / incomplete; the UI
 * collects a new mapping from the user, calls this, and renders the
 * resulting preview.
 *
 * @param {string[][]} rawRows
 * @param {Array<string|null>} mapping
 * @returns {Array<{data: object, errors: object[], raw: string[]}>}
 */
function applyMapping(rawRows, mapping) {
  return rawRows.map(row => ({
    raw: row,
    ...normalizeRow(row, mapping),
  }));
}

const REQUIRED_FIELDS = Object.freeze(['brand', 'model', 'technique']);

/**
 * Required ski fields not yet present in the column→field mapping.
 * The manual-mapping UI uses this to gate the "Apply" button.
 *
 * @param {Array<string|null>} mapping
 * @returns {string[]}  the missing field names, in canonical order
 */
function missingRequiredFields(mapping) {
  const present = new Set((mapping || []).filter(Boolean));
  return REQUIRED_FIELDS.filter(f => !present.has(f));
}

/**
 * Fields mapped to more than one column. The UI uses this to surface
 * "you mapped two columns to 'brand'" errors before letting the user
 * apply their mapping.
 *
 * @param {Array<string|null>} mapping
 * @returns {string[]}  duplicate field names (each appears once in the result)
 */
function duplicateMappings(mapping) {
  const counts = new Map();
  for (const f of mapping || []) {
    if (!f) continue;
    counts.set(f, (counts.get(f) || 0) + 1);
  }
  const dupes = [];
  for (const [f, n] of counts.entries()) {
    if (n > 1) dupes.push(f);
  }
  return dupes;
}

/**
 * @typedef {Object} ParsedSheet
 * @property {ReturnType<typeof detectDelimiter>} delimiter
 * @property {string[]} headers        the header row strings (or [] if none)
 * @property {Array<string|null>} mapping   column index → field name
 * @property {Array<{data: object, errors: object[], raw: string[]}>} rows
 * @property {boolean} needsManualMapping
 * @property {string[]} unmappedHeaders
 */

/**
 * Public parse entry point. Tokenizes, decides whether the first row
 * is a header, builds the column→field mapping, normalizes each data
 * row, and tags rows with per-field errors.
 *
 * needsManualMapping is true when ANY required ski field (brand,
 * model, technique) ended up unmapped — the UI should offer the
 * manual-mapping screen in that case.
 *
 * @param {string} input
 * @returns {ParsedSheet}
 */
function parseSpreadsheet(input) {
  const {delimiter, rows: rawRows} = tokenizeRows(input);
  if (rawRows.length === 0) {
    return {
      delimiter,
      headers: [],
      mapping: [],
      rows: [],
      needsManualMapping: true,
      unmappedHeaders: [],
    };
  }

  const first = rawRows[0];
  const headerDetected = looksLikeHeaderRow(first);
  const headers = headerDetected ? first : [];
  const dataRows = headerDetected ? rawRows.slice(1) : rawRows;
  const mapping = headerDetected
    ? mapHeadersToFields(first)
    : new Array(first.length).fill(null);

  const requiredFields = new Set(['brand', 'model', 'technique']);
  const mappedFields = new Set(mapping.filter(Boolean));
  const missingRequired = [...requiredFields].some(
    f => !mappedFields.has(f),
  );

  const unmappedHeaders = [];
  if (headerDetected) {
    for (let i = 0; i < headers.length; i += 1) {
      if (!mapping[i]) {
        unmappedHeaders.push(headers[i]);
      }
    }
  }

  const rows = dataRows.map(row => ({
    raw: row,
    ...normalizeRow(row, mapping),
  }));

  return {
    delimiter,
    headers,
    mapping,
    rows,
    needsManualMapping: !headerDetected || missingRequired,
    unmappedHeaders,
  };
}

module.exports = {
  detectDelimiter,
  tokenizeRows,
  parseSpreadsheet,
  fieldForHeader,
  looksLikeHeaderRow,
  mapHeadersToFields,
  normalizeRow,
  applyMapping,
  missingRequiredFields,
  duplicateMappings,
  HEADER_ALIASES,
  REQUIRED_FIELDS,
};
