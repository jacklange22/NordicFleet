import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import SkiSelector from '../SkiSelector';

const mkSkis = n =>
  Array.from({length: n}, (_, i) => ({
    id: `s${i}`,
    name: `Ski ${i}`,
    brand: i % 2 ? 'Fischer' : 'Madshus',
    model: `M${i}`,
  }));

// Issue #9: make wax/test ski selection usable for 10–30 skis.
describe('SkiSelector (issue #9)', () => {
  it('renders a chip per ski and toggles on press', () => {
    const onToggle = jest.fn();
    const {getByLabelText} = render(
      <SkiSelector
        skis={mkSkis(3)}
        selectedIds={[]}
        onToggle={onToggle}
        onSelectAll={() => {}}
        onClearAll={() => {}}
      />,
    );
    fireEvent.press(getByLabelText('Ski 1'));
    expect(onToggle).toHaveBeenCalledWith('s1');
  });

  it('hides search + actions for a small fleet', () => {
    const {queryByLabelText} = render(
      <SkiSelector
        skis={mkSkis(1)}
        selectedIds={[]}
        onToggle={() => {}}
        onSelectAll={() => {}}
        onClearAll={() => {}}
      />,
    );
    expect(queryByLabelText('Search your fleet')).toBeNull();
    expect(queryByLabelText('Select all skis')).toBeNull();
  });

  it('shows a search field for a large fleet and filters by name/brand', () => {
    const skis = mkSkis(10);
    const {getByLabelText, queryByLabelText} = render(
      <SkiSelector
        skis={skis}
        selectedIds={[]}
        onToggle={() => {}}
        onSelectAll={() => {}}
        onClearAll={() => {}}
      />,
    );
    // All 10 chips present initially.
    expect(getByLabelText('Ski 7')).toBeTruthy();
    // Filter to a single ski by exact name.
    fireEvent.changeText(getByLabelText('Search your fleet'), 'Ski 7');
    expect(getByLabelText('Ski 7')).toBeTruthy();
    expect(queryByLabelText('Ski 1')).toBeNull();
  });

  it('select-all / clear shortcuts fire their callbacks', () => {
    const onSelectAll = jest.fn();
    const onClearAll = jest.fn();
    const {getByLabelText} = render(
      <SkiSelector
        skis={mkSkis(5)}
        selectedIds={['s0']}
        onToggle={() => {}}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.press(getByLabelText('Select all skis'));
    expect(onSelectAll).toHaveBeenCalled();
    fireEvent.press(getByLabelText('Clear selected skis'));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('hides "Select all" once everything is selected', () => {
    const skis = mkSkis(3);
    const {queryByLabelText} = render(
      <SkiSelector
        skis={skis}
        selectedIds={skis.map(s => s.id)}
        onToggle={() => {}}
        onSelectAll={() => {}}
        onClearAll={() => {}}
      />,
    );
    expect(queryByLabelText('Select all skis')).toBeNull();
    expect(queryByLabelText('Clear selected skis')).toBeTruthy();
  });
});
