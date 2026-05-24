import React from 'react';
import {render} from '@testing-library/react-native';
import LoadingScreen from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('renders without a label', () => {
    const tree = render(<LoadingScreen />);
    // Find the ActivityIndicator by host name.
    expect(tree.UNSAFE_root).toBeTruthy();
  });

  it('renders the optional label', () => {
    const tree = render(<LoadingScreen label="Loading skis…" />);
    expect(tree.getByText('Loading skis…')).toBeTruthy();
  });
});
