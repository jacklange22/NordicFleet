import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SkiItem from '../skiitem';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('SkiItem', () => {
  it('navigates to SkiInfo with skiId on press', () => {
    const tree = render(
      <SkiItem
        skiId="abc"
        name="Speedmax"
        technique="Classic"
        type="Cold"
        grind="Universal"
      />,
    );
    fireEvent.press(tree.getByLabelText('Open Speedmax'));
    expect(mockNavigate).toHaveBeenCalledWith('SkiInfo', {skiId: 'abc'});
  });

  it('hides chip when value is falsy', () => {
    const tree = render(<SkiItem skiId="abc" name="X" />);
    expect(tree.queryByText('Classic')).toBeNull();
  });
});
