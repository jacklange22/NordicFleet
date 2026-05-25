import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RNShare from 'react-native-share';
import {captureRef} from 'react-native-view-shot';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SkiInfo from '../skiInfo';
import {AuthProvider} from '../../context/AuthContext';

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const navProp = {navigate: jest.fn()};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  RNShare.__reset();
  captureRef.mockClear();
});

const renderSkiInfo = skiId =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <SkiInfo route={{params: {skiId}}} navigation={navProp} />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('SkiInfo — share ski', () => {
  it('tap "Share ski" calls shareSnapshot path (captureRef + RNShare.open)', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/abc', {
      name: 'Fischer Speedmax',
      brand: 'Fischer',
    });

    const tree = renderSkiInfo('abc');
    await waitFor(() => tree.getByLabelText('Share ski'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Share ski'));
    });

    // captureRef ran exactly once, on the share-card ref.
    expect(captureRef).toHaveBeenCalledTimes(1);
    // RNShare.open got the resulting URI + a filename derived from the ski name.
    expect(RNShare.open).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///tmp/test-snapshot.png',
        filename: 'fischer_speedmax.png',
        type: 'image/png',
      }),
    );
  });

  it('coach view hides the share button (ownerUid != current user)', async () => {
    authMock.__setCurrentUser({uid: 'coach1'});
    firestoreMock.__seedDoc('users/athlete1/skis/abc', {
      name: 'Their ski',
    });

    const tree = render(
      <SafeAreaProvider initialMetrics={SA_METRICS}>
        <NavigationContainer>
          <AuthProvider>
            <SkiInfo
              route={{params: {skiId: 'abc', ownerUid: 'athlete1'}}}
              navigation={navProp}
            />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>,
    );
    await waitFor(() => {
      expect(tree.getAllByText('Their ski').length).toBeGreaterThan(0);
    });
    expect(tree.queryByLabelText('Share ski')).toBeNull();
  });
});
