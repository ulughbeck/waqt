import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { TimeProvider } from "../../providers/TimeProvider";
import { DebugProvider } from "../../providers/DebugProvider";
import type { LocationState } from "../../providers/LocationProvider";
import { SkyStars } from "./SkyStars";

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

describe("SkyStars", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("container", () => {
    it("renders sky-stars container", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const stars = container.querySelector(".sky-stars");
        expect(stars).not.toBeNull();
      });
    });

    it("has aria-hidden attribute for accessibility", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const stars = container.querySelector(".sky-stars");
        expect(stars?.getAttribute("aria-hidden")).toBe("true");
      });
    });
  });

  describe("visibility by cycle", () => {
    it("shows stars at full opacity during night", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starsContainer = container.querySelector(".sky-stars") as HTMLElement;
        expect(starsContainer).not.toBeNull();
        const style = starsContainer.getAttribute("style");
        expect(style).toContain("--stars-opacity: 1");
      });
    });

    it("shows stars with reduced opacity during dusk", async () => {
      vi.setSystemTime(new Date("2026-01-21T17:45:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starsContainer = container.querySelector(".sky-stars") as HTMLElement;
        expect(starsContainer).not.toBeNull();
        const style = starsContainer.getAttribute("style");
        expect(style).toContain("--stars-opacity: 0.5");
      });
    });

    it("shows stars with low opacity during dawn", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:30:00Z"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starsContainer = container.querySelector(".sky-stars") as HTMLElement;
        expect(starsContainer).not.toBeNull();
        const style = starsContainer.getAttribute("style");
        expect(style).toContain("--stars-opacity: 0.3");
      });
    });

    it("hides stars during day with zero opacity", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starsContainer = container.querySelector(".sky-stars") as HTMLElement;
        expect(starsContainer).not.toBeNull();
        const style = starsContainer.getAttribute("style");
        expect(style).toContain("--stars-opacity: 0");
      });
    });

    it("does not render star elements during day", async () => {
      vi.setSystemTime(new Date("2026-01-21T12:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starElements = container.querySelectorAll(".sky-stars__star");
        expect(starElements.length).toBe(0);
      });
    });
  });

  describe("star rendering", () => {
    it("renders approximately 50 stars during night", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const starElements = container.querySelectorAll(".sky-stars__star");
        expect(starElements.length).toBe(50);
      });
    });

    it("renders stars with position styles", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const star = container.querySelector(".sky-stars__star") as HTMLElement;
        expect(star).not.toBeNull();
        const style = star.getAttribute("style");
        expect(style).toContain("left:");
        expect(style).toContain("top:");
        expect(style).toContain("width:");
        expect(style).toContain("height:");
        expect(style).toContain("--star-opacity:");
      });
    });

    it("marks some stars with twinkle class", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const twinklingStars = container.querySelectorAll(".sky-stars__star--twinkle");
        expect(twinklingStars.length).toBeGreaterThan(0);
        expect(twinklingStars.length).toBeLessThan(25);
      });
    });

    it("twinkling stars have twinkle duration style", async () => {
      vi.setSystemTime(new Date("2026-01-21T02:00:00"));
      const { container } = renderWithProvider(() => <SkyStars />);

      await waitFor(() => {
        const twinklingStar = container.querySelector(
          ".sky-stars__star--twinkle"
        ) as HTMLElement;
        expect(twinklingStar).not.toBeNull();
        const style = twinklingStar.getAttribute("style");
        expect(style).toContain("--twinkle-duration:");
      });
    });
  });
});
