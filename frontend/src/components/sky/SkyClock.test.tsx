import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { TimeProvider } from "../../providers/TimeProvider";
import { DebugProvider } from "../../providers/DebugProvider";
import type { LocationState } from "../../providers/LocationProvider";
import { SkyClock } from "./SkyClock";
import { SkyDate } from "./SkyDate";

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

describe("SkyClock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-21T13:36:54"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders time in 24-hour format with seconds", async () => {
    const { container } = renderWithProvider(() => <SkyClock />);

    await waitFor(() => {
      const timeElement = container.querySelector(".sky-clock__time");
      expect(timeElement).not.toBeNull();
      expect(timeElement!.textContent).toBe("13:36:54");
    });
  });

  it("has correct accessibility attributes", async () => {
    const { container } = renderWithProvider(() => <SkyClock />);

    await waitFor(() => {
      const clockElement = container.querySelector(".sky-clock");
      expect(clockElement).not.toBeNull();
      expect(clockElement!.getAttribute("role")).toBe("timer");
      expect(clockElement!.getAttribute("aria-label")).toBe("Current time");
    });
  });

  it("updates time when clock ticks", async () => {
    const { container } = renderWithProvider(() => <SkyClock />);

    await waitFor(() => {
      const timeElement = container.querySelector(".sky-clock__time");
      expect(timeElement!.textContent).toBe("13:36:54");
    });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const timeElement = container.querySelector(".sky-clock__time");
      expect(timeElement!.textContent).toBe("13:36:55");
    });
  });

  it("displays midnight correctly", async () => {
    vi.setSystemTime(new Date("2026-01-21T00:00:00"));
    const { container } = renderWithProvider(() => <SkyClock />);

    await waitFor(() => {
      const timeElement = container.querySelector(".sky-clock__time");
      expect(timeElement!.textContent).toBe("00:00:00");
    });
  });
});

describe("SkyDate", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-21T13:36:54"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders date with full weekday and abbreviated month", async () => {
    const { container } = renderWithProvider(() => <SkyDate />);

    await waitFor(() => {
      const dateElement = container.querySelector(".sky-date");
      expect(dateElement).not.toBeNull();
      expect(dateElement!.textContent).toBe("Wednesday, Jan 21");
    });
  });

  it("has correct accessibility attributes", async () => {
    const { container } = renderWithProvider(() => <SkyDate />);

    await waitFor(() => {
      const dateElement = container.querySelector(".sky-date");
      expect(dateElement).not.toBeNull();
      expect(dateElement!.getAttribute("role")).toBe("status");
      expect(dateElement!.getAttribute("aria-label")).toBe("Current date");
    });
  });

  it("updates date at midnight", async () => {
    vi.setSystemTime(new Date("2026-01-21T23:59:59"));
    const { container } = renderWithProvider(() => <SkyDate />);

    await waitFor(() => {
      const dateElement = container.querySelector(".sky-date");
      expect(dateElement!.textContent).toBe("Wednesday, Jan 21");
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      const dateElement = container.querySelector(".sky-date");
      expect(dateElement!.textContent).toBe("Thursday, Jan 22");
    });
  });
});
