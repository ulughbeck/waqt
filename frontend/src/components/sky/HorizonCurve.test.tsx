import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { TimeProvider } from "../../providers/TimeProvider";
import { DebugProvider } from "../../providers/DebugProvider";
import type { LocationState } from "../../providers/LocationProvider";
import { HorizonCurve } from "./HorizonCurve";

const mockLocation: LocationState = {
  lat: 41.3,
  lon: 69.3,
  timezone: "Asia/Tashkent",
  city: "Tashkent",
  source: "manual",
  timestamp: Date.now(),
};

function renderWithProvider(component: () => JSX.Element) {
  const [location] = createSignal<LocationState | null>(mockLocation);
  return render(() => (
    <DebugProvider>
      <TimeProvider location={location}>{component()}</TimeProvider>
    </DebugProvider>
  ));
}

describe("HorizonCurve", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders horizon-curve element", async () => {
      // 07:00:00Z == 12:00:00 in Asia/Tashkent
      vi.setSystemTime(new Date("2026-01-21T07:00:00Z"));
      const { container } = renderWithProvider(() => <HorizonCurve />);

      await waitFor(() => {
        const curve = container.querySelector(".horizon-curve");
        expect(curve).not.toBeNull();
      });
    });

    it("does not render horizon-rim element", async () => {
      vi.setSystemTime(new Date("2026-01-21T07:00:00Z"));
      const { container } = renderWithProvider(() => <HorizonCurve />);

      await waitFor(() => {
        const rim = container.querySelector(".horizon-rim");
        expect(rim).toBeNull();
      });
    });
  });

  describe("cycle-based styling", () => {
    it("applies day class during day", async () => {
      vi.setSystemTime(new Date("2026-01-21T07:00:00Z"));
      const { container } = renderWithProvider(() => <HorizonCurve />);

      await waitFor(() => {
        const curve = container.querySelector(".horizon-curve--day");
        expect(curve).not.toBeNull();
      });
    });

    it("applies dusk class during dusk", async () => {
      // 12:45:00Z == 17:45:00 in Asia/Tashkent
      vi.setSystemTime(new Date("2026-01-21T12:45:00Z"));
      const { container } = renderWithProvider(() => <HorizonCurve />);

      await waitFor(() => {
        const curve = container.querySelector(".horizon-curve--dusk");
        expect(curve).not.toBeNull();
      });
    });

    it("applies night class during night", async () => {
      // 18:00:00Z == 23:00:00 in Asia/Tashkent
      vi.setSystemTime(new Date("2026-01-21T18:00:00Z"));
      const { container } = renderWithProvider(() => <HorizonCurve />);

      await waitFor(() => {
        const curve = container.querySelector(".horizon-curve--night");
        expect(curve).not.toBeNull();
      });
    });
  });
});
