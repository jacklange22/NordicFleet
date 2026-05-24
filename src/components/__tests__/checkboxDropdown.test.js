import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import MultiSelectDropdown from '../checkboxDropdown';

const items = [
  {id: 'a', label: 'Alpha'},
  {id: 'b', label: 'Bravo'},
  {id: 'c', label: 'Charlie'},
];

describe('MultiSelectDropdown', () => {
  it('renders the trigger label', () => {
    const tree = render(
      <MultiSelectDropdown items={items} label="Pick" onSelectionDone={() => {}} />,
    );
    expect(tree.getByText('Pick')).toBeTruthy();
  });

  it('returns selected ids on Done', () => {
    const onDone = jest.fn();
    const tree = render(
      <MultiSelectDropdown items={items} label="Pick" onSelectionDone={onDone} />,
    );
    fireEvent.press(tree.getByLabelText('Pick'));
    fireEvent.press(tree.getByLabelText('Alpha'));
    fireEvent.press(tree.getByLabelText('Charlie'));
    fireEvent.press(tree.getByLabelText('Done'));
    expect(onDone).toHaveBeenCalledWith(['a', 'c']);
  });

  it('toggles selection on second tap', () => {
    const onDone = jest.fn();
    const tree = render(
      <MultiSelectDropdown items={items} label="Pick" onSelectionDone={onDone} />,
    );
    fireEvent.press(tree.getByLabelText('Pick'));
    fireEvent.press(tree.getByLabelText('Alpha'));
    fireEvent.press(tree.getByLabelText('Alpha'));
    fireEvent.press(tree.getByLabelText('Done'));
    expect(onDone).toHaveBeenCalledWith([]);
  });

  it('survives missing items array', () => {
    expect(() =>
      render(
        <MultiSelectDropdown label="Pick" onSelectionDone={() => {}} />,
      ),
    ).not.toThrow();
  });
});
