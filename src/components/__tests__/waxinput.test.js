import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import WaxInputComponent from '../waxinput';

describe('WaxInputComponent', () => {
  it('renders ski name', () => {
    const tree = render(
      <WaxInputComponent
        ski="Speedmax"
        technique="skate"
        value={{glideLayers: 1, glideWaxes: [''], notes: ''}}
        onChange={() => {}}
      />,
    );
    expect(tree.getByText('Speedmax')).toBeTruthy();
  });

  it('shows kick fields only for classic technique', () => {
    const tree = render(
      <WaxInputComponent
        ski="Speedmax"
        technique="skate"
        value={{glideLayers: 1, glideWaxes: [''], notes: '', kickLayers: 1}}
        onChange={() => {}}
      />,
    );
    expect(tree.queryByPlaceholderText('Kickwax')).toBeNull();

    const tree2 = render(
      <WaxInputComponent
        ski="Speedmax"
        technique="classic"
        value={{glideLayers: 1, glideWaxes: [''], notes: '', kickLayers: 1}}
        onChange={() => {}}
      />,
    );
    expect(tree2.getByPlaceholderText('Kickwax')).toBeTruthy();
  });

  it('calls onChange with new notes when typed', () => {
    const onChange = jest.fn();
    const tree = render(
      <WaxInputComponent
        ski="Speedmax"
        technique="skate"
        value={{glideLayers: 1, glideWaxes: [''], notes: ''}}
        onChange={onChange}
      />,
    );
    fireEvent.changeText(tree.getByPlaceholderText('Notes'), 'Cold day');
    expect(onChange).toHaveBeenCalledWith({notes: 'Cold day'});
  });

  it('calls onChange with new glide layers + resized glideWaxes', () => {
    const onChange = jest.fn();
    const tree = render(
      <WaxInputComponent
        ski="Speedmax"
        technique="skate"
        value={{glideLayers: 1, glideWaxes: ['CH6'], notes: ''}}
        onChange={onChange}
      />,
    );
    fireEvent.press(tree.getByLabelText('Increase Glide Layers'));
    // The first call should set glideLayers: 2 and a 2-element array
    expect(onChange).toHaveBeenCalledWith({
      glideLayers: 2,
      glideWaxes: ['CH6', ''],
    });
  });
});
