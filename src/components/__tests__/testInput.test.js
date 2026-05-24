import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SkiInputComponent from '../testInput';

const emptyTest = {
  glideWax: '',
  kickWax: '',
  glideRating: 5,
  kickRating: 5,
  stabilityRating: 5,
  climbingRating: 5,
  notes: '',
};

describe('SkiInputComponent (test input)', () => {
  it('renders ski name', () => {
    const tree = render(
      <SkiInputComponent
        ski="Speedmax"
        technique="classic"
        value={emptyTest}
        onChange={() => {}}
      />,
    );
    expect(tree.getByText('Speedmax')).toBeTruthy();
  });

  it('shows kick controls only on classic', () => {
    const tree = render(
      <SkiInputComponent
        ski="Speedmax"
        technique="skate"
        value={emptyTest}
        onChange={() => {}}
      />,
    );
    expect(tree.queryByPlaceholderText('Kickwax')).toBeNull();
  });

  it('fires onChange when ratings change', () => {
    const onChange = jest.fn();
    const tree = render(
      <SkiInputComponent
        ski="Speedmax"
        technique="skate"
        value={emptyTest}
        onChange={onChange}
      />,
    );
    fireEvent.press(tree.getByLabelText('Increase Glide'));
    expect(onChange).toHaveBeenCalledWith({glideRating: 6});
  });
});
