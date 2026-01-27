import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { useTime } from "~/providers/useTime";
import { TimeProvider } from "./TimeProvider";
import { DebugProvider } from "./DebugProvider";
import type { LocationState } from "./LocationProvider";

const mockLocation: LocationState = {
  lat: 40.7,
  lon: -74.0,
  timezone: "America/New_York", // UTC-5
  city: "New York",
  source: "manual",
  timestamp: Date.now(),
};

function TestConsumer(props: { onMount?: (ctx: ReturnType<typeof useTime>) => void }) {
  const ctx = useTime();
  props.onMount?.(ctx);
  return null;
}

describe("TimeProvider Timezone Handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set system time to 12:00 UTC
    vi.setSystemTime(new Date("2026-01-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adjusts clock to match location timezone", async () => {
    const [location] = createSignal<LocationState | null>(mockLocation);

    let ctx: ReturnType<typeof useTime>;
    render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer onMount={(c) => (ctx = c)} />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(ctx).toBeDefined();
    });

    const time = ctx!.time();
    // New York is UTC-5. 12:00 UTC -> 07:00 New York.
    
    expect(time.getHours()).toBe(7);
  });
});
