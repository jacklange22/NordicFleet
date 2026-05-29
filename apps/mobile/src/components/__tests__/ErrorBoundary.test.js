import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';
import {reportError} from '../../services/reportError';

// The boundary funnels caught errors through reportError (which would
// otherwise console.warn in tests). Mock it so the expected report is
// asserted instead of polluting the output.
jest.mock('../../services/reportError', () => ({
  reportError: jest.fn(),
}));

const Throw = () => {
  throw new Error('boom');
};

beforeEach(() => {
  reportError.mockClear();
});

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
    expect(
      tree.getByText('We hit an unexpected error. Try restarting the app.'),
    ).toBeTruthy();
    // A restart action button is rendered.
    expect(tree.getByLabelText('Restart app')).toBeTruthy();
    // The boundary reported the caught error through the funnel.
    expect(reportError).toHaveBeenCalled();
    spy.mockRestore();
  });
});
