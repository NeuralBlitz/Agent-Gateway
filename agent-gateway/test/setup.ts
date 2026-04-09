import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  vi.setConfig({ hookTimeout: 10000, testTimeout: 30000 });
});

afterAll(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

global.fetch = vi.fn();

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomBytes: (size: number) => {
      const bytes = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return bytes;
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});