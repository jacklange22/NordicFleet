import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import firestoreMock from '@react-native-firebase/firestore';
import useSkis from '../useSkis';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

const Probe = ({uid, options, onResult}) => {
  const r = useSkis(uid, options);
  onResult(r);
  return <Text>{r.loading ? 'loading' : `count=${r.skis.length}`}</Text>;
};

describe('useSkis', () => {
  it('returns empty + loading=false for no uid', () => {
    let res;
    render(<Probe uid={undefined} onResult={r => (res = r)} />);
    expect(res.loading).toBe(false);
    expect(res.skis).toEqual([]);
  });

  it('filters retired by default', () => {
    firestoreMock.__seedDoc('users/u1/skis/a', {name: 'A'});
    firestoreMock.__seedDoc('users/u1/skis/b', {name: 'B', retired: true});
    let res;
    render(<Probe uid="u1" onResult={r => (res = r)} />);
    expect(res.skis.length).toBe(1);
    expect(res.skis[0].name).toBe('A');
  });

  it('includes retired when includeRetired option is true', () => {
    firestoreMock.__seedDoc('users/u1/skis/a', {name: 'A'});
    firestoreMock.__seedDoc('users/u1/skis/b', {name: 'B', retired: true});
    let res;
    render(
      <Probe
        uid="u1"
        options={{includeRetired: true}}
        onResult={r => (res = r)}
      />,
    );
    expect(res.skis.length).toBe(2);
  });
});
