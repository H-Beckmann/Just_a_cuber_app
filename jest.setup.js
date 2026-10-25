/**
 * @format
 */
/* eslint-env jest */

// The mock shipped with the package is ESM and lives in node_modules, which
// Jest does not transform here — an in-memory store is all the tests need.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(key =>
        Promise.resolve(store.has(key) ? store.get(key) : null),
      ),
      setItem: jest.fn((key, value) => {
        store.set(key, String(value));
        return Promise.resolve();
      }),
      removeItem: jest.fn(key => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
    },
  };
});
