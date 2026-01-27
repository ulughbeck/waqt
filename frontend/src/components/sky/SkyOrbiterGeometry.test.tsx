import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { TimeProvider } from "../../providers/TimeProvider";
import { DebugProvider } from "../../providers/DebugProvider";
import type { LocationState } from "../../providers/LocationProvider";
import { SkyOrbiter } from "./SkyOrbiter";

const mockLocation: LocationState = {
  lat: 41.3,
  lon: 69.3,
  timezone: "Asia/Tashkent",
  city: "Tashkent",
  source: "manual",
  timestamp: Date.now(),
};

vi.mock("../../providers/LocationProvider", () => ({
  useLocation: () => ({
    location: () => mockLocation,
    timezone: () => "Asia/Tashkent",
  }),
}));

function renderWithProvider(component: () => JSX.Element) {
  const [location] = createSignal<LocationState | null>(mockLocation);
  return render(() => (
    <DebugProvider>
      <TimeProvider location={location}>{component()}</TimeProvider>
    </DebugProvider>
  ));
}

describe("SkyOrbiter Geometry", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    if (typeof window !== "undefined") {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Helper to extract CSS variables
  function parseStyles(style: CSSStyleDeclaration) {
    const radiusX = parseFloat(style.getPropertyValue("--orbit-radius-x").replace("px", ""));
    const radiusY = parseFloat(style.getPropertyValue("--orbit-radius-y").replace("px", ""));
    return { radiusX, radiusY };
  }

  it("calculates correct orbit dimensions for mobile (375px)", async () => {
    // Mobile setup
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 375, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 667, writable: true, configurable: true });

    const { container } = renderWithProvider(() => <SkyOrbiter />);

    await waitFor(() => {
      const orbiter = container.querySelector(".sky-orbiter") as HTMLElement;
      expect(orbiter).not.toBeNull();

      const { radiusX, radiusY } = parseStyles(orbiter.style);

      // Expected:
      // Width = 375 * 0.40 (mobile radius multiplier is 0.40) -> Wait, logic in SkyOrbiter:
      // if width > 1024 (desktop) -> 0.28
      // else -> 0.40

      // SkyHeight (mobile <= 640px) = 667 * 0.4 = 266.8
      // Max RadiusX = 266.8 - 80 = 186.8
      // RadiusX = 375 * 0.40 = 150. (150 < 475 && 150 < 186.8)
      // RadiusY = 150 * 1.0 = 150

      expect(radiusX).toBeCloseTo(150, 1);
      expect(radiusY).toBeCloseTo(150, 1);
    });
  });

  it("calculates correct orbit dimensions for tablet (800px)", async () => {
    // Tablet setup
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1024, writable: true, configurable: true });

    const { container } = renderWithProvider(() => <SkyOrbiter />);

    await waitFor(() => {
      const orbiter = container.querySelector(".sky-orbiter") as HTMLElement;
      expect(orbiter).not.toBeNull();

      const { radiusX, radiusY } = parseStyles(orbiter.style);

      // Expected:
      // SkyHeight (tablet > 640px) = 1024 * 0.41 = 419.84
      // Max RadiusX = 419.84 - 80 = 339.84
      // RadiusX = 800 * 0.40 = 320. (320 < 475 && 320 < 339.84)
      // RadiusY = 320 * 1.0 = 320

      expect(radiusX).toBeCloseTo(320, 1);
      expect(radiusY).toBeCloseTo(320, 1);
    });
  });

  it("caps orbit dimensions for desktop (2000px)", async () => {
    // Desktop setup (large screen to hit cap)
    Object.defineProperty(window, "innerWidth", { value: 2000, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 2000, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1200, writable: true, configurable: true });

    const { container } = renderWithProvider(() => <SkyOrbiter />);

    await waitFor(() => {
      const orbiter = container.querySelector(".sky-orbiter") as HTMLElement;
      expect(orbiter).not.toBeNull();

      const { radiusX, radiusY } = parseStyles(orbiter.style);

      // Expected:
      // SkyHeight (desktop > 1024px) = 1200 * 0.42 = 504
      // Max RadiusX = 504 - 80 = 424
      // Raw RadiusX = 2000 * 0.28 = 560
      // Capped RadiusX = min(560, 475, 424) = 424
      // RadiusY = 424 * 1.0 = 424

      expect(radiusX).toBeCloseTo(424, 1);
      expect(radiusY).toBeCloseTo(424, 1);
    });
  });

  it("renders moon correctly at night", async () => {
    vi.setSystemTime(new Date("2026-01-21T02:00:00"));
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 1200, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true, configurable: true });

    const { container } = renderWithProvider(() => <SkyOrbiter />);

    await waitFor(() => {
      const moon = container.querySelector(".sky-orbiter__moon");
      expect(moon).not.toBeNull();
      // Just check it renders without crashing
    });
  });
});
