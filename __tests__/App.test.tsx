/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Building the solver tables takes seconds; the screen falls back to
// random-move scrambles, which is enough to render.
jest.mock('../src/lib/scramble', () => ({
  ...jest.requireActual('../src/lib/scramble'),
  initScrambler: jest.fn(() => Promise.resolve(false)),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
