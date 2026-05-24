import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import FilterMenu from '../filtermenu';

describe('FilterMenu', () => {
  it('passes selected technique and condition to onApplyFilter', () => {
    const onApply = jest.fn();
    const tree = render(<FilterMenu onApplyFilter={onApply} />);
    fireEvent.press(tree.getByLabelText('Skate'));
    fireEvent.press(tree.getByLabelText('Cold'));
    fireEvent.press(tree.getByLabelText('Apply filter'));
    expect(onApply).toHaveBeenCalledWith('Skate', 'Cold');
  });

  it('toggles a chip back to null on second tap', () => {
    const onApply = jest.fn();
    const tree = render(<FilterMenu onApplyFilter={onApply} />);
    fireEvent.press(tree.getByLabelText('Skate'));
    fireEvent.press(tree.getByLabelText('Skate'));
    fireEvent.press(tree.getByLabelText('Apply filter'));
    expect(onApply).toHaveBeenCalledWith(null, null);
  });
});
