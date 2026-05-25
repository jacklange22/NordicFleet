import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Dropdown from '../dropdown';

describe('Dropdown', () => {
  it('shows placeholder when no value is selected', () => {
    const tree = render(<Dropdown options={['A', 'B']} placeholder="Pick" />);
    expect(tree.getByText('Pick')).toBeTruthy();
  });

  it('respects the controlled value prop', () => {
    const tree = render(
      <Dropdown options={['A', 'B']} placeholder="Pick" value="A" />,
    );
    expect(tree.getByText('A')).toBeTruthy();
  });

  it('calls onSelect when an option is chosen', () => {
    const onSelect = jest.fn();
    const tree = render(
      <Dropdown options={['A', 'B']} placeholder="Pick" onSelect={onSelect} />,
    );
    fireEvent.press(tree.getByLabelText('Pick'));
    fireEvent.press(tree.getByLabelText('B'));
    expect(onSelect).toHaveBeenCalledWith('B');
  });

  it('survives an empty options array', () => {
    expect(() =>
      render(<Dropdown options={[]} placeholder="Pick" />),
    ).not.toThrow();
  });
});
