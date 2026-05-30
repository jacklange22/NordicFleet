import firestoreMock from '@react-native-firebase/firestore';
import {
  createWaxTest,
  getWaxTest,
  updateWaxTest,
  deleteWaxTest,
} from '../waxTestService';

const validInput = () => ({
  name: 'Stratton AM',
  fleetSize: 4,
  conditions: {temperature: -6, snowType: 'New', locationLabel: 'Stratton'},
  combinations: [
    {id: 'c1', layers: [{category: 'paraffin', waxName: 'Swix HF6'}]},
    {id: 'c2', layers: [{category: 'paraffin', waxName: 'Mystery brew'}]},
  ],
});

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('waxTestService', () => {
  it('createWaxTest shapes the payload + generates a bracket', async () => {
    const id = await createWaxTest('u1', validInput());
    expect(typeof id).toBe('string');
    const saved = await getWaxTest('u1', id);
    expect(saved.name).toBe('Stratton AM');
    expect(saved.status).toBe('setup');
    expect(saved.bracket.rounds[0].length).toBe(1); // 2 combos → 1 match
    expect(saved.createdAt).toBeTruthy();
  });

  it('stores the bracket WITHOUT a nested array (the create-crash fix)', async () => {
    // Firestore forbids nested arrays; bracket.rounds (Match[][]) was the
    // Wax Truck create crash. The RAW stored doc must keep rounds as a MAP,
    // and reading it back must restore the array form.
    const id = await createWaxTest('u1', validInput());
    const rawPath = [...firestoreMock.__getStore().keys()].find(
      k => k.startsWith('users/u1/waxTests/') && k.endsWith(id),
    );
    const raw = firestoreMock.__getStore().get(rawPath);
    // Stored rounds is a plain object (map), NOT an array → no nested array.
    expect(Array.isArray(raw.bracket.rounds)).toBe(false);
    expect(typeof raw.bracket.rounds).toBe('object');
    // No top-level field is an array-of-arrays.
    const hasNestedArray = v =>
      Array.isArray(v) && v.some(el => Array.isArray(el));
    expect(hasNestedArray(raw.bracket.rounds)).toBe(false);
    // Read path restores the Match[][] form the runner expects.
    const saved = await getWaxTest('u1', id);
    expect(Array.isArray(saved.bracket.rounds)).toBe(true);
    expect(saved.bracket.rounds[0][0].matchId).toBeTruthy();
  });

  it('round-trips a bye bracket (5 combinations → byes) safely', async () => {
    const combos = [1, 2, 3, 4, 5].map(n => ({
      id: `c${n}`,
      layers: [{category: 'paraffin', waxName: `Wax ${n}`}],
    }));
    const id = await createWaxTest('u1', {
      name: 'Five',
      testType: 'paraffin',
      fleetSize: 8,
      combinations: combos,
    });
    const saved = await getWaxTest('u1', id);
    // 5 combos → bracket of 8 slots → 4 first-round matches across rounds.
    expect(Array.isArray(saved.bracket.rounds)).toBe(true);
    expect(saved.bracket.rounds[0].length).toBe(4);
    expect(saved.testType).toBe('paraffin');
  });

  it('createWaxTest requires a uid', async () => {
    await expect(createWaxTest('', validInput())).rejects.toThrow(/uid/);
  });

  it('createWaxTest surfaces core validation (free text never blocked)', async () => {
    // A layer with no waxId is fine; a blank name is rejected by core.
    await expect(
      createWaxTest('u1', {...validInput(), name: '  '}),
    ).rejects.toThrow(/needs a name/);
  });

  it('updateWaxTest merges a partial', async () => {
    const id = await createWaxTest('u1', validInput());
    await updateWaxTest('u1', id, {status: 'running'});
    const saved = await getWaxTest('u1', id);
    expect(saved.status).toBe('running');
    expect(saved.name).toBe('Stratton AM'); // untouched fields survive
  });

  it('getWaxTest returns null for an unknown id', async () => {
    expect(await getWaxTest('u1', 'nope')).toBeNull();
  });

  it('deleteWaxTest removes the doc', async () => {
    const id = await createWaxTest('u1', validInput());
    await deleteWaxTest('u1', id);
    expect(await getWaxTest('u1', id)).toBeNull();
  });

  it('createWaxTest rejects when the backend errors', async () => {
    const err = new Error('unavailable');
    firestoreMock.__injectError(err);
    await expect(createWaxTest('u1', validInput())).rejects.toThrow(
      'unavailable',
    );
  });
});
