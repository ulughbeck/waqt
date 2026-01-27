import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  usePwaUpdate,
  resetPwaUpdateState,
  setPwaNeedRefresh,
  setPwaUpdateServiceWorker,
} from "./pwaUpdate";

beforeEach(() => {
  resetPwaUpdateState();
});

describe("pwaUpdate store", () => {
  it("tracks needRefresh state and dismiss resets", () => {
    const store = usePwaUpdate();
    expect(store.needRefresh()).toBe(false);

    setPwaNeedRefresh(true);
    expect(store.needRefresh()).toBe(true);

    store.dismiss();
    expect(store.needRefresh()).toBe(false);
  });

  it("applyUpdate invokes update service worker", async () => {
    const store = usePwaUpdate();
    const updater = vi.fn().mockResolvedValue(undefined);

    setPwaUpdateServiceWorker(updater);
    await store.applyUpdate();

    expect(updater).toHaveBeenCalledWith(true);
  });
});
