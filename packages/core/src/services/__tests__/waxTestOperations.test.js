const {
  nextPow2,
  seedOrder,
  generateBracket,
  advanceWinner,
  moveCombination,
  rearrangeBracket,
  bracketProgress,
  buildCombinationLabel,
  buildWaxTestCreatePayload,
} = require('../waxTestOperations');

const combos = n =>
  Array.from({length: n}, (_, i) => ({id: `c${i + 1}`}));

// Run a whole bracket to completion by always advancing competitor A
// (or B when A is null). Returns the final bracket.
function runToWinner(bracket) {
  let b = bracket;
  let guard = 0;
  while (!b.winnerId && guard < 1000) {
    guard += 1;
    let acted = false;
    for (const round of b.rounds) {
      for (const m of round) {
        if (!m.winnerId && m.combinationIdA && m.combinationIdB) {
          b = advanceWinner(b, m.matchId, m.combinationIdA);
          acted = true;
          break;
        }
      }
      if (acted) break;
    }
    if (!acted) break;
  }
  return b;
}

describe('nextPow2 + seedOrder', () => {
  test('nextPow2', () => {
    expect(nextPow2(1)).toBe(2);
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(5)).toBe(8);
    expect(nextPow2(8)).toBe(8);
    expect(nextPow2(9)).toBe(16);
  });

  test('seedOrder spreads seeds standard-bracket style', () => {
    expect(seedOrder(2)).toEqual([1, 2]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe('generateBracket — sizes + byes', () => {
  test.each([2, 3, 4, 5, 8, 16])('builds a valid bracket for %i combos', n => {
    const b = generateBracket(combos(n));
    const size = nextPow2(n);
    // round 0 has size/2 matches
    expect(b.rounds[0].length).toBe(size / 2);
    // total rounds = log2(size)
    expect(b.rounds.length).toBe(Math.log2(size));
    // final round has exactly one match
    expect(b.rounds[b.rounds.length - 1].length).toBe(1);
    // no round-0 match is bye-vs-bye
    for (const m of b.rounds[0]) {
      expect(m.combinationIdA || m.combinationIdB).toBeTruthy();
    }
  });

  test('byes auto-advance into round 1', () => {
    // n=3, size=4: seed 4 is a bye → its opponent auto-advances.
    const b = generateBracket(combos(3));
    // round 0: (c1 vs bye), (c2 vs c3)
    const r0 = b.rounds[0];
    const byeMatch = r0.find(m => !m.combinationIdA || !m.combinationIdB);
    expect(byeMatch.winnerId).toBeTruthy();
    // the bye winner is seeded into the final
    const final = b.rounds[1][0];
    expect(
      final.combinationIdA === byeMatch.winnerId ||
        final.combinationIdB === byeMatch.winnerId,
    ).toBe(true);
  });

  test('rejects < 2 combinations', () => {
    expect(() => generateBracket([])).toThrow(/at least 2/);
    expect(() => generateBracket(combos(1))).toThrow(/at least 2/);
  });

  test('rejects missing or duplicate ids', () => {
    expect(() => generateBracket([{id: 'a'}, {}])).toThrow(/needs an id/);
    expect(() => generateBracket([{id: 'a'}, {id: 'a'}])).toThrow(/unique/);
  });
});

describe('advanceWinner', () => {
  test('advances a winner into the next round, slot by parity', () => {
    let b = generateBracket(combos(4)); // (c1,c4),(c2,c3) → final
    b = advanceWinner(b, 'r0m0', 'c1'); // even match → next slot A
    b = advanceWinner(b, 'r0m1', 'c2'); // odd match → next slot B
    expect(b.rounds[1][0].combinationIdA).toBe('c1');
    expect(b.rounds[1][0].combinationIdB).toBe('c2');
  });

  test('setting the final winner sets bracket.winnerId', () => {
    let b = generateBracket(combos(2));
    b = advanceWinner(b, 'r0m0', 'c2');
    expect(b.winnerId).toBe('c2');
  });

  test('is immutable — original bracket unchanged', () => {
    const b = generateBracket(combos(2));
    const b2 = advanceWinner(b, 'r0m0', 'c1');
    expect(b.rounds[0][0].winnerId).toBeNull();
    expect(b2.rounds[0][0].winnerId).toBe('c1');
  });

  test('rejects unknown match + winner not in match', () => {
    const b = generateBracket(combos(2));
    expect(() => advanceWinner(b, 'nope', 'c1')).toThrow(/not found/);
    expect(() => advanceWinner(b, 'r0m0', 'c99')).toThrow(/competitors/);
    expect(() => advanceWinner(b, 'r0m0', null)).toThrow(/required/);
  });

  test('every size runs cleanly to a single winner', () => {
    for (const n of [2, 3, 4, 5, 8, 16]) {
      const final = runToWinner(generateBracket(combos(n)));
      expect(final.winnerId).toBeTruthy();
    }
  });
});

describe('moveCombination + rearrangeBracket', () => {
  test('moveCombination reorders immutably', () => {
    const c = combos(4);
    const moved = moveCombination(c, 0, 3);
    expect(moved.map(x => x.id)).toEqual(['c2', 'c3', 'c4', 'c1']);
    expect(c.map(x => x.id)).toEqual(['c1', 'c2', 'c3', 'c4']); // original intact
  });

  test('out-of-range / no-op returns a copy', () => {
    const c = combos(3);
    expect(moveCombination(c, 0, 0).map(x => x.id)).toEqual(['c1', 'c2', 'c3']);
    expect(moveCombination(c, 5, 1).map(x => x.id)).toEqual(['c1', 'c2', 'c3']);
  });

  test('rearrangeBracket returns reordered combos + fresh bracket', () => {
    const c = combos(4);
    const {combinations, bracket} = rearrangeBracket(c, 0, 1);
    expect(combinations.map(x => x.id)).toEqual(['c2', 'c1', 'c3', 'c4']);
    expect(bracket.rounds[0].length).toBe(2);
  });
});

describe('bracketProgress', () => {
  test('reports rounds + decided count + completion', () => {
    let b = generateBracket(combos(4));
    let p = bracketProgress(b);
    expect(p.totalRounds).toBe(2);
    expect(p.complete).toBe(false);
    b = runToWinner(b);
    p = bracketProgress(b);
    expect(p.complete).toBe(true);
    expect(p.decided).toBe(p.total);
  });
});

describe('buildCombinationLabel', () => {
  test('joins layer wax names', () => {
    expect(
      buildCombinationLabel([
        {waxName: 'Swix HF6'},
        {waxName: 'Toko HelX Blue'},
      ]),
    ).toBe('Swix HF6 + Toko HelX Blue');
  });
  test('empty → placeholder', () => {
    expect(buildCombinationLabel([])).toBe('Empty combination');
    expect(buildCombinationLabel([{waxName: '  '}])).toBe('Empty combination');
  });
});

describe('buildWaxTestCreatePayload', () => {
  const validInput = () => ({
    name: 'Stratton AM test',
    fleetSize: 4,
    conditions: {
      temperature: -6,
      humidity: 70,
      snowType: 'New',
      surface: 'Powder',
      locationLabel: 'Stratton',
    },
    combinations: [
      {
        id: 'c1',
        layers: [{category: 'paraffin', waxId: 'swix-x', waxName: 'Swix HF6'}],
      },
      {
        id: 'c2',
        layers: [{category: 'paraffin', waxName: 'Mystery brew'}],
        performanceNumber: 42.5,
      },
    ],
  });

  test('happy path shapes the doc + auto-generates the bracket', () => {
    const out = buildWaxTestCreatePayload(validInput());
    expect(out.name).toBe('Stratton AM test');
    expect(out.fleetSize).toBe(4);
    expect(out.conditions.temperature).toBe(-6);
    expect(out.combinations).toHaveLength(2);
    expect(out.status).toBe('setup');
    expect(out.bracket.rounds[0].length).toBe(1); // 2 combos → 1 match
  });

  test('FREE TEXT never blocked: a layer with no waxId is accepted', () => {
    const out = buildWaxTestCreatePayload(validInput());
    const freeLayer = out.combinations[1].layers[0];
    expect(freeLayer.waxId).toBeNull();
    expect(freeLayer.waxName).toBe('Mystery brew');
  });

  test('auto-labels a combination when no label given', () => {
    const out = buildWaxTestCreatePayload(validInput());
    expect(out.combinations[0].label).toBe('Swix HF6');
  });

  test('performance number parses; missing → null', () => {
    const out = buildWaxTestCreatePayload(validInput());
    expect(out.combinations[1].performanceNumber).toBe(42.5);
    expect(out.combinations[0].performanceNumber).toBeNull();
  });

  test('rejects blank name + tiny fleet', () => {
    expect(() =>
      buildWaxTestCreatePayload({...validInput(), name: ' '}),
    ).toThrow(/needs a name/);
    expect(() =>
      buildWaxTestCreatePayload({...validInput(), fleetSize: 1}),
    ).toThrow(/at least 2/);
  });

  test('rejects more combinations than fleet size', () => {
    const input = validInput();
    input.fleetSize = 1;
    expect(() => buildWaxTestCreatePayload(input)).toThrow(/at least 2/);
  });

  test('rejects an invalid layer category', () => {
    const input = validInput();
    input.combinations[0].layers[0].category = 'banana';
    expect(() => buildWaxTestCreatePayload(input)).toThrow(/category must be/);
  });

  test('rejects a layer with no wax name', () => {
    const input = validInput();
    input.combinations[0].layers[0].waxName = '';
    expect(() => buildWaxTestCreatePayload(input)).toThrow(/needs a waxName/);
  });
});

describe('bracket (de)serialization — Firestore nested-array fix', () => {
  const {
    serializeBracket,
    deserializeBracket,
  } = require('../waxTestOperations');

  test('serialize turns rounds (array of arrays) into a map → no nested array', () => {
    const bracket = generateBracket([{id: 'a'}, {id: 'b'}, {id: 'c'}]);
    expect(Array.isArray(bracket.rounds)).toBe(true); // in-memory form
    const stored = serializeBracket(bracket);
    expect(Array.isArray(stored.rounds)).toBe(false); // map form
    expect(stored.rounds['0']).toBeDefined();
    Object.values(stored.rounds).forEach(round => {
      expect(Array.isArray(round)).toBe(true);
      round.forEach(m => expect(Array.isArray(m)).toBe(false));
    });
  });

  test('serialize → deserialize is a round-trip back to Match[][]', () => {
    const bracket = generateBracket([1, 2, 3, 4, 5].map(n => ({id: `c${n}`})));
    expect(deserializeBracket(serializeBracket(bracket))).toEqual(bracket);
  });

  test('deserialize tolerates the legacy array form + empties', () => {
    expect(
      deserializeBracket({rounds: [[{matchId: 'm'}]], winnerId: 'x'}),
    ).toEqual({rounds: [[{matchId: 'm'}]], winnerId: 'x'});
    expect(deserializeBracket(null)).toEqual({rounds: [], winnerId: null});
    expect(deserializeBracket({})).toEqual({rounds: [], winnerId: null});
  });
});

describe('buildWaxTestCreatePayload — test type', () => {
  const validInput = () => ({
    name: 'T',
    fleetSize: 4,
    combinations: [
      {id: 'c1', layers: [{category: 'kick', waxName: 'VR40'}]},
      {id: 'c2', layers: [{category: 'kick', waxName: 'VR45'}]},
    ],
  });

  test('keeps an explicit valid testType', () => {
    expect(
      buildWaxTestCreatePayload({...validInput(), testType: 'kick'}).testType,
    ).toBe('kick');
  });

  test('falls back to the first layer category when testType missing/invalid', () => {
    expect(
      buildWaxTestCreatePayload({...validInput(), testType: 'banana'}).testType,
    ).toBe('kick');
  });
});

describe('@nordicfleet/core barrel', () => {
  test('re-exports the wax-test API', () => {
    const core = require('../../');
    expect(typeof core.generateBracket).toBe('function');
    expect(typeof core.advanceWinner).toBe('function');
    expect(typeof core.buildWaxTestCreatePayload).toBe('function');
    expect(typeof core.serializeBracket).toBe('function');
    expect(typeof core.deserializeBracket).toBe('function');
  });
});
