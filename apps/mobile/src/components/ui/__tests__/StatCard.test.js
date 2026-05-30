import React from 'react';
import {render} from '@testing-library/react-native';
import StatCard from '../StatCard';

// Issue #1: dashboard stat cards (Total skis, Times waxed, Tests logged,
// Athletes, ...) must read as informational figures, not tappable buttons.
// They are plain Views — this test locks that in so a future refactor can't
// silently turn them into a misleading button/link.
describe('StatCard — non-interactive figure (issue #1)', () => {
  it('renders the value and label', () => {
    const {getByText} = render(<StatCard value={5} label="Times waxed" />);
    expect(getByText('5')).toBeTruthy();
    expect(getByText('Times waxed')).toBeTruthy();
  });

  it('exposes no button/link role and no press handler', () => {
    const {queryByRole, getByText} = render(
      <StatCard value={12} label="Tests logged" />,
    );
    // Not announced as a button or link by VoiceOver.
    expect(queryByRole('button')).toBeNull();
    expect(queryByRole('link')).toBeNull();
    // The big number is explicitly a text role, never interactive.
    expect(getByText('12').props.accessibilityRole).toBe('text');
    expect(getByText('12').props.onPress).toBeUndefined();
  });
});
