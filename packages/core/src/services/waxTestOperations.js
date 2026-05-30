// Wax Truck — pure bracket logic + payload shaping.
//
// A wax test is a single-elimination tournament between wax
// combinations. This module is platform-free: it generates brackets
// (with byes for non-power-of-2 counts), advances winners, reorders
// seeds before the test starts, and shapes the Firestore payload.
//
// Bracket shape (matches the data model in the brief):
//   { rounds: Match[][], winnerId: string|null }
//   Match = { matchId, combinationIdA, combinationIdB, winnerId }
//   round 0 is the first round; the last round holds the final match.
//   A null competitor in round 0 is a bye → the real competitor
//   auto-advances.

const VALID_CATEGORIES = ['kick', 'paraffin', 'topcoat', 'structure'];

function nextPow2(n) {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return Math.max(2, p);
}

/**
 * Standard tournament seeding order for a bracket of `size` slots.
 * Returns 1-based seed numbers in bracket-position order, e.g.
 * size 8 → [1,8,4,5,2,7,3,6]. This distributes byes to the top seeds
 * and guarantees no bye-vs-bye match (since nextPow2 keeps n > size/2).
 */
function seedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    const next = [];
    for (const s of order) {
      next.push(s);
      next.push(n + 1 - s);
    }
    order = next;
  }
  return order;
}

/**
 * Build a single-elimination bracket from an ordered combinations
 * array. Each combination needs an `id`. Byes auto-resolve in round 0.
 *
 * @param {Array<{id: string}>} combinations
 * @returns {{rounds: Array, winnerId: string|null}}
 */
function generateBracket(combinations) {
  if (!Array.isArray(combinations) || combinations.length < 2) {
    throw new Error('A bracket needs at least 2 combinations');
  }
  const ids = combinations.map(c => c && c.id);
  if (ids.some(id => !id)) {
    throw new Error('Every combination needs an id');
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error('Combination ids must be unique');
  }

  const n = combinations.length;
  const size = nextPow2(n);
  const order = seedOrder(size);
  const slots = order.map(seed => (seed <= n ? combinations[seed - 1].id : null));

  const rounds = [];
  const round0 = [];
  for (let i = 0; i < slots.length; i += 2) {
    round0.push({
      matchId: `r0m${i / 2}`,
      combinationIdA: slots[i],
      combinationIdB: slots[i + 1],
      winnerId: null,
    });
  }
  rounds.push(round0);

  let count = round0.length;
  let r = 1;
  while (count > 1) {
    count = Math.floor(count / 2);
    const round = [];
    for (let i = 0; i < count; i += 1) {
      round.push({
        matchId: `r${r}m${i}`,
        combinationIdA: null,
        combinationIdB: null,
        winnerId: null,
      });
    }
    rounds.push(round);
    r += 1;
  }

  let bracket = {rounds, winnerId: null};
  // Auto-advance byes (a round-0 match with exactly one competitor).
  for (const m of round0) {
    const a = m.combinationIdA;
    const b = m.combinationIdB;
    if (a && !b) {
      bracket = advanceWinner(bracket, m.matchId, a);
    } else if (!a && b) {
      bracket = advanceWinner(bracket, m.matchId, b);
    }
  }
  return bracket;
}

/**
 * Set the winner of a match and propagate them into the next round.
 * Returns a NEW bracket (immutable). Setting the final-round winner
 * sets bracket.winnerId.
 *
 * Note: re-deciding an earlier match overwrites the immediate next
 * slot but does not recursively clear deeper rounds — the runner UI
 * advances forward, so this is a deliberate, documented limitation.
 *
 * @param {object} bracket
 * @param {string} matchId
 * @param {string} winnerId
 */
function advanceWinner(bracket, matchId, winnerId) {
  if (!bracket || !Array.isArray(bracket.rounds)) {
    throw new Error('Invalid bracket');
  }
  const rounds = bracket.rounds.map(round => round.map(m => ({...m})));
  let ri = -1;
  let mi = -1;
  for (let r = 0; r < rounds.length && ri < 0; r += 1) {
    const idx = rounds[r].findIndex(m => m.matchId === matchId);
    if (idx >= 0) {
      ri = r;
      mi = idx;
    }
  }
  if (ri < 0) {
    throw new Error(`Match ${matchId} not found`);
  }
  const match = rounds[ri][mi];
  if (!winnerId) {
    throw new Error('winnerId is required');
  }
  if (winnerId !== match.combinationIdA && winnerId !== match.combinationIdB) {
    throw new Error('winnerId must be one of the match competitors');
  }
  match.winnerId = winnerId;

  let bracketWinner = bracket.winnerId;
  if (ri + 1 < rounds.length) {
    const nextMatch = rounds[ri + 1][Math.floor(mi / 2)];
    if (mi % 2 === 0) {
      nextMatch.combinationIdA = winnerId;
    } else {
      nextMatch.combinationIdB = winnerId;
    }
  } else {
    bracketWinner = winnerId;
  }
  return {rounds, winnerId: bracketWinner};
}

/**
 * Immutably move a combination from one index to another (drag /
 * up-down reordering before the test starts).
 *
 * @param {Array} combinations
 * @param {number} from
 * @param {number} to
 * @returns {Array} reordered copy
 */
function moveCombination(combinations, from, to) {
  if (!Array.isArray(combinations)) {
    return combinations;
  }
  const n = combinations.length;
  if (from < 0 || from >= n || to < 0 || to >= n || from === to) {
    return combinations.slice();
  }
  const next = combinations.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Reorder combinations then regenerate the bracket — the arranger's
 * one-call convenience. Returns {combinations, bracket}.
 */
function rearrangeBracket(combinations, from, to) {
  const reordered = moveCombination(combinations, from, to);
  return {combinations: reordered, bracket: generateBracket(reordered)};
}

/**
 * Progress summary for the "Round X of Y" UI + completion check.
 * currentRound is the index of the first round with an undecided
 * real (non-bye) match, or rounds.length-1 when complete.
 */
function bracketProgress(bracket) {
  if (!bracket || !Array.isArray(bracket.rounds) || bracket.rounds.length === 0) {
    return {totalRounds: 0, currentRound: 0, decided: 0, total: 0, complete: false};
  }
  const rounds = bracket.rounds;
  let decided = 0;
  let total = 0;
  let currentRound = rounds.length - 1;
  let foundCurrent = false;
  for (let r = 0; r < rounds.length; r += 1) {
    for (const m of rounds[r]) {
      // A real match has both competitors; byes (one null) don't count.
      const isReal = !!m.combinationIdA && !!m.combinationIdB;
      if (isReal) {
        total += 1;
        if (m.winnerId) {
          decided += 1;
        } else if (!foundCurrent) {
          currentRound = r;
          foundCurrent = true;
        }
      }
    }
  }
  return {
    totalRounds: rounds.length,
    currentRound,
    decided,
    total,
    complete: !!bracket.winnerId,
  };
}

// ─── Firestore (de)serialization ─────────────────────────────────────
//
// Firestore forbids NESTED ARRAYS (an array directly containing another
// array). The bracket's `rounds` is Match[][], which is exactly that — so
// writing it crashes/rejects on a real device. We store `rounds` as a MAP
// keyed by round index ({"0": Match[], "1": Match[]}) — a map whose values
// are arrays-of-objects is allowed — and restore the Match[][] array form on
// read. Everything in memory (core + runner) keeps using the array form.

/** Array-form bracket → Firestore-safe (rounds as a map). */
function serializeBracket(bracket) {
  if (!bracket || !Array.isArray(bracket.rounds)) {
    // Already serialized, or empty — pass a safe shape through.
    return bracket && typeof bracket === 'object'
      ? bracket
      : {rounds: {}, winnerId: null};
  }
  const rounds = {};
  bracket.rounds.forEach((round, i) => {
    rounds[String(i)] = Array.isArray(round) ? round : [];
  });
  return {rounds, winnerId: bracket.winnerId == null ? null : bracket.winnerId};
}

/** Firestore-stored bracket (rounds map) → array-form Match[][]. */
function deserializeBracket(stored) {
  if (!stored || typeof stored !== 'object') {
    return {rounds: [], winnerId: null};
  }
  // Back-compat / mock: already array form.
  if (Array.isArray(stored.rounds)) {
    return {rounds: stored.rounds, winnerId: stored.winnerId == null ? null : stored.winnerId};
  }
  const map = stored.rounds && typeof stored.rounds === 'object' ? stored.rounds : {};
  const rounds = Object.keys(map)
    .map(k => Number(k))
    .filter(n => Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b)
    .map(n => (Array.isArray(map[String(n)]) ? map[String(n)] : []));
  return {rounds, winnerId: stored.winnerId == null ? null : stored.winnerId};
}

// ─── Combination + payload shaping ───────────────────────────────────

/**
 * Auto-label a combination from its layers (coach can override).
 * e.g. layers [paraffin "Swix HF6", topcoat "Toko HelX Blue"] →
 * "Swix HF6 + Toko HelX Blue".
 */
function buildCombinationLabel(layers) {
  if (!Array.isArray(layers) || layers.length === 0) {
    return 'Empty combination';
  }
  const names = layers
    .map(l => (l && typeof l.waxName === 'string' ? l.waxName.trim() : ''))
    .filter(Boolean);
  if (names.length === 0) {
    return 'Empty combination';
  }
  return names.join(' + ');
}

function normalizeLayer(layer, index) {
  if (!layer || typeof layer !== 'object') {
    throw new Error('Each layer must be an object');
  }
  const category = String(layer.category || '').toLowerCase();
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Layer category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  }
  const waxName =
    typeof layer.waxName === 'string' ? layer.waxName.trim() : '';
  if (!waxName) {
    throw new Error('Each layer needs a waxName (free text is allowed)');
  }
  return {
    category,
    waxId: layer.waxId || null, // null = free-text entry
    waxName,
    order: typeof layer.order === 'number' ? layer.order : index,
  };
}

function normalizeCombination(combo, index) {
  if (!combo || typeof combo !== 'object') {
    throw new Error('Each combination must be an object');
  }
  const layers = Array.isArray(combo.layers)
    ? combo.layers.map(normalizeLayer)
    : [];
  if (layers.length === 0) {
    throw new Error('Each combination needs at least one layer');
  }
  const id = combo.id || `c${index}`;
  const label =
    typeof combo.label === 'string' && combo.label.trim()
      ? combo.label.trim()
      : buildCombinationLabel(layers);
  let performanceNumber = null;
  if (
    combo.performanceNumber !== undefined &&
    combo.performanceNumber !== null &&
    combo.performanceNumber !== ''
  ) {
    const num = Number(combo.performanceNumber);
    if (Number.isFinite(num)) {
      performanceNumber = num;
    }
  }
  return {id, label, layers, performanceNumber};
}

/**
 * Validate + shape a wax-test doc for Firestore. The platform layer
 * adds createdAt/updatedAt timestamps.
 *
 * @param {object} input
 */
function buildWaxTestCreatePayload(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Wax test input is required');
  }
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new Error('Wax test needs a name');
  }
  const fleetSize = Number(input.fleetSize);
  if (!Number.isFinite(fleetSize) || fleetSize < 2) {
    throw new Error('Fleet size must be at least 2');
  }
  const combinations = Array.isArray(input.combinations)
    ? input.combinations.map(normalizeCombination)
    : [];
  if (combinations.length > fleetSize) {
    throw new Error('More combinations than the fleet size allows');
  }

  let conditions = null;
  if (input.conditions && typeof input.conditions === 'object') {
    const c = input.conditions;
    conditions = {
      temperature: numOrNull(c.temperature),
      humidity: numOrNull(c.humidity),
      snowType: strOrNull(c.snowType),
      surface: strOrNull(c.surface),
      locationLabel: strOrNull(c.locationLabel),
    };
  }

  const status = ['setup', 'running', 'complete'].includes(input.status)
    ? input.status
    : 'setup';

  // One test = one type (Kick / Paraffin / Topcoat / Structure). Use the
  // explicit testType when valid; otherwise fall back to the first layer's
  // category so older callers keep working.
  const explicitType = String(input.testType || '').toLowerCase();
  const testType = VALID_CATEGORIES.includes(explicitType)
    ? explicitType
    : (combinations[0] && combinations[0].layers[0] && combinations[0].layers[0].category) ||
      'paraffin';

  const bracket =
    input.bracket && Array.isArray(input.bracket.rounds)
      ? input.bracket
      : combinations.length >= 2
        ? generateBracket(combinations)
        : {rounds: [], winnerId: null};

  return {name, testType, fleetSize, conditions, combinations, bracket, status};
}

function numOrNull(v) {
  if (v === undefined || v === null || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function strOrNull(v) {
  if (typeof v !== 'string' || !v.trim()) {
    return null;
  }
  return v.trim();
}

module.exports = {
  nextPow2,
  seedOrder,
  generateBracket,
  advanceWinner,
  moveCombination,
  rearrangeBracket,
  bracketProgress,
  buildCombinationLabel,
  buildWaxTestCreatePayload,
  serializeBracket,
  deserializeBracket,
};
