import firestoreMock from '../@react-native-firebase/firestore';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('Firestore mock', () => {
  it('stores and reads a single doc', async () => {
    const ref = firestoreMock().collection('users').doc('u1');
    await ref.set({a: 1});
    const snap = await ref.get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toEqual({a: 1});
  });

  it('handles set with merge', async () => {
    const ref = firestoreMock().collection('users').doc('u1');
    await ref.set({a: 1});
    await ref.set({b: 2}, {merge: true});
    const snap = await ref.get();
    expect(snap.data()).toEqual({a: 1, b: 2});
  });

  it('handles update with merge semantics', async () => {
    const ref = firestoreMock().collection('users').doc('u1');
    await ref.set({a: 1});
    await ref.update({b: 2});
    const snap = await ref.get();
    expect(snap.data()).toEqual({a: 1, b: 2});
  });

  it('add returns id', async () => {
    const col = firestoreMock().collection('users');
    const ref = await col.add({name: 'X'});
    expect(typeof ref.id).toBe('string');
  });

  it('where + orderBy returns filtered, sorted docs', async () => {
    const col = firestoreMock().collection('logs');
    await col.add({skiId: 'a', date: 100});
    await col.add({skiId: 'a', date: 300});
    await col.add({skiId: 'b', date: 200});
    const snap = await col
      .where('skiId', '==', 'a')
      .orderBy('date', 'desc')
      .get();
    expect(snap.size).toBe(2);
    expect(snap.docs[0].data().date).toBe(300);
    expect(snap.docs[1].data().date).toBe(100);
  });

  it('onSnapshot fires once initially and returns unsubscribe', () => {
    const cb = jest.fn();
    const unsub = firestoreMock().collection('users').onSnapshot(cb);
    expect(cb).toHaveBeenCalled();
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('delete removes the doc', async () => {
    firestoreMock.__seedDoc('users/u1', {x: 1});
    await firestoreMock().collection('users').doc('u1').delete();
    const snap = await firestoreMock().collection('users').doc('u1').get();
    expect(snap.exists).toBe(false);
  });

  it('FieldValue.serverTimestamp is a marker object', () => {
    const v = firestoreMock.FieldValue.serverTimestamp();
    expect(v.__type).toBe('serverTimestamp');
  });
});
