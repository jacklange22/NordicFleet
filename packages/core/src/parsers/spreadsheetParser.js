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

/**
 * Public parse entry point (Feature 1.1: returns just the tokenized
 * rows + delimiter metadata; Feature 1.2 extends this with header
 * mapping + normalization).
 *
 * @param {string} input
 * @returns {{
 *   delimiter: ReturnType<typeof detectDelimiter>,
 *   rawRows: string[][],
 * }}
 */
function parseSpreadsheet(input) {
  const {delimiter, rows} = tokenizeRows(input);
  return {delimiter, rawRows: rows};
}

module.exports = {
  detectDelimiter,
  tokenizeRows,
  parseSpreadsheet,
};
