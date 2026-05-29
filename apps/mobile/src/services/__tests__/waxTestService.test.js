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
