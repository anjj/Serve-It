// vitest's happy-dom environment only forwards a hardcoded key list plus the
// window instance's *own* properties onto the global object. happy-dom
// implements `localStorage` as a prototype getter, so it's silently never
// exposed to tests. Polyfill it with a minimal in-memory Storage.
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const localStorage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: localStorage, writable: true, configurable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", { value: localStorage, writable: true, configurable: true });
  }
}
