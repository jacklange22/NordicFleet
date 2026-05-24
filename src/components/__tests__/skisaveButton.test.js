import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SkiSaveButton from '../skisaveButton';

describe('SkiSaveButton', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const tree = render(<SkiSaveButton onPress={onPress} />);
    fireEvent.press(tree.getByLabelText('Save'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows a spinner and ignores press while submitting', () => {
    const onPress = jest.fn();
    const tree = render(<SkiSaveButton onPress={onPress} submitting={true} />);
    fireEvent.press(tree.getByLabelText('Save'));
    expect(onPress).not.toHaveBeenCalled();
    // Spinner replaces the text — "Save" text shouldn't be present.
    expect(tree.queryByText('Save')).toBeNull();
  });

  it('ignores press when disabled', () => {
    const onPress = jest.fn();
    const tree = render(<SkiSaveButton onPress={onPress} disabled={true} />);
    fireEvent.press(tree.getByLabelText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
