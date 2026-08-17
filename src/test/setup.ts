// The store uses zustand's persist middleware, which looks for localStorage as
// soon as it is created. A Map is enough: these tests do not assert persistence.
const store = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  },
  writable: true,
});
