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

// Mock useLocation
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

describe("SkyOrbiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Mock window dimensions
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 800, writable: true });
      
      // Mock requestAnimationFrame to execute immediately
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
         cb(0);
         return 0;
      });
    }

    // Mock document.documentElement.clientWidth for the fix
    if (typeof document !== "undefined") {
      Object.defineProperty(document.documentElement, "clientWidth", { 
        value: 1200, 
        writable: true,
        configurable: true 
      });
    }

    // Reset localStorage safely
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("sun visibility", () => {
    it("shows sun during day", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const sun = container.querySelector(".sky-orbiter__sun");
        expect(sun).not.toBeNull();
      });
    });

    it("shows sun glow during day", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const sunGlow = container.querySelector(".sky-orbiter__sun-glow");
        expect(sunGlow).not.toBeNull();
      });
    });

    it("hides sun during night", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const sun = container.querySelector(".sky-orbiter__sun");
        expect(sun).toBeNull();
      });
    });
  });

  describe("moon visibility", () => {
    it("shows moon during night", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const moon = container.querySelector(".sky-orbiter__moon");
        expect(moon).not.toBeNull();
      });
    });

    it("shows moon glow during night", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const moonGlow = container.querySelector(".sky-orbiter__moon-glow");
        expect(moonGlow).not.toBeNull();
      });
    });

    it("hides moon during day", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const moon = container.querySelector(".sky-orbiter__moon");
        expect(moon).toBeNull();
      });
    });
  });

  describe("sun positioning", () => {
    it("positions sun with CSS custom properties", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const sun = container.querySelector(".sky-orbiter__sun") as HTMLElement;
        expect(sun).not.toBeNull();
        const style = sun.getAttribute("style");
        expect(style).toContain("--sun-x");
        expect(style).toContain("--sun-y");
        expect(style).toContain("--sun-scale");
      });
    });
  });

  describe("moon positioning", () => {
    it("positions moon with CSS custom properties", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const moon = container.querySelector(".sky-orbiter__moon") as HTMLElement;
        expect(moon).not.toBeNull();
        const style = moon.getAttribute("style");
        expect(style).toContain("--moon-x");
        expect(style).toContain("--moon-y");
        expect(style).toContain("--moon-scale");
        expect(style).toContain("--moon-opacity");
      });
    });
  });

  describe("sun structure", () => {
    it("renders sun with core and corona layers", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const sunCore = container.querySelector(".sky-orbiter__sun-core");
        const sunCorona = container.querySelector(".sky-orbiter__sun-corona");
        expect(sunCore).not.toBeNull();
        expect(sunCorona).not.toBeNull();
      });
    });
  });

  describe("moon structure", () => {
    it("renders moon with surface", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const moonSurface = container.querySelector(".sky-orbiter__moon-surface");
        expect(moonSurface).not.toBeNull();
      });
    });
  });

  describe("container", () => {
    it("renders sky-orbiter container", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const orbiter = container.querySelector(".sky-orbiter");
        expect(orbiter).not.toBeNull();
      });
    });

    it("renders with opacity transition after mount", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyOrbiter />);

      await waitFor(() => {
        const orbiter = container.querySelector(".sky-orbiter") as HTMLElement;
        expect(orbiter).not.toBeNull();
        expect(orbiter.style.opacity).toBe("1");
        expect(orbiter.style.transition).toContain("opacity");
      });
    });
  });
});
