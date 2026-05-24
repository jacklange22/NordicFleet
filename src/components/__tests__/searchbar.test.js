import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SearchBar from '../searchbar';

describe('SearchBar', () => {
  it('fires onSearch on each keystroke (live filter)', () => {
    const onSearch = jest.fn();
    const tree = render(<SearchBar onSearch={onSearch} />);
    const input = tree.getByPlaceholderText('Search skis');
    fireEvent.changeText(input, 'spe');
    expect(onSearch).toHaveBeenLastCalledWith('spe');
    fireEvent.changeText(input, 'speedmax');
    expect(onSearch).toHaveBeenLastCalledWith('speedmax');
  });
});
