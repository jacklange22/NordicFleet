import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';

const Throw = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const tree = render(
      <ErrorBoundary>
        <Text>ok</Text>
      </ErrorBoundary>,
    );
    expect(tree.getByText('ok')).toBeTruthy();
  });

  it('renders fallback when child throws', () => {
    // Silence the React-thrown error noise just for this test.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const tree = render(
      <ErrorBoundary>
        <Throw />
      </ErrorBoundary>,
    );
    expect(tree.getByText('Something went wrong')).toBeTruthy();
    expect(tree.getByText('Please restart the app.')).toBeTruthy();
    spy.mockRestore();
  });
});
