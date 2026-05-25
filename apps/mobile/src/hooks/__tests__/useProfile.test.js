import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import firestoreMock from '@react-native-firebase/firestore';
import useProfile from '../useProfile';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

const Probe = ({uid, onResult}) => {
  const r = useProfile(uid);
  onResult(r);
  return (
    <Text>
      {r.loading
        ? 'loading'
        : r.profile
        ? r.profile.email || 'no-email'
        : 'null'}
    </Text>
  );
};

describe('useProfile', () => {
  it('returns null + loading=false for no uid', () => {
    let res;
    render(<Probe uid={undefined} onResult={r => (res = r)} />);
    expect(res.loading).toBe(false);
    expect(res.profile).toBeNull();
  });

  it('returns the profile when present', () => {
    firestoreMock.__seedDoc('users/u1', {email: 'a@b.com'});
    let res;
    render(<Probe uid="u1" onResult={r => (res = r)} />);
    expect(res.profile.email).toBe('a@b.com');
  });

  it('returns null when missing', () => {
    let res;
    render(<Probe uid="ghost" onResult={r => (res = r)} />);
    expect(res.profile).toBeNull();
  });
});
