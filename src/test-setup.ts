import '@testing-library/jest-dom';

// jsdom does not implement execCommand or queryCommandState
Object.defineProperty(document, 'execCommand', {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true,
});
Object.defineProperty(document, 'queryCommandState', {
  value: vi.fn().mockReturnValue(false),
  writable: true,
  configurable: true,
});

// Reset mocks between tests
beforeEach(() => {
  vi.mocked(document.execCommand).mockReturnValue(true);
  vi.mocked(document.queryCommandState).mockReturnValue(false);
});
