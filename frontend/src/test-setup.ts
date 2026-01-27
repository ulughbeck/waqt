const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
}

Object.defineProperty(navigator, "onLine", {
  value: true,
  writable: true,
  configurable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "ResizeObserver", {
    value: ResizeObserverMock,
    writable: true,
  });
}
