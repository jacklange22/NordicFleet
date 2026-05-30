import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Input from '../Input';

// Issue #2: single-line fields should present a "Done" return key (which
// dismisses the keyboard on iOS), while multiline notes keep the default
// newline behavior. The shared Input is the single place this is enforced.
describe('Input — return key behavior (issue #2)', () => {
  it('defaults single-line fields to the "done" return key', () => {
    const {getByLabelText} = render(
      <Input label="Ski name" value="" onChangeText={() => {}} />,
    );
    expect(getByLabelText('Ski name').props.returnKeyType).toBe('done');
  });

  it('does NOT force "done" on multiline fields (keeps newline)', () => {
    const {getByLabelText} = render(
      <Input label="Notes" value="" onChangeText={() => {}} multiline />,
    );
    expect(getByLabelText('Notes').props.returnKeyType).toBeUndefined();
  });

  it('respects an explicit returnKeyType override', () => {
    const {getByLabelText} = render(
      <Input
        label="Email"
        value=""
        onChangeText={() => {}}
        returnKeyType="next"
      />,
    );
    expect(getByLabelText('Email').props.returnKeyType).toBe('next');
  });

  it('forwards onSubmitEditing to the TextInput', () => {
    const onSubmit = jest.fn();
    const {getByLabelText} = render(
      <Input
        label="Search skis"
        value=""
        onChangeText={() => {}}
        onSubmitEditing={onSubmit}
      />,
    );
    fireEvent(getByLabelText('Search skis'), 'submitEditing');
    expect(onSubmit).toHaveBeenCalled();
  });
});
