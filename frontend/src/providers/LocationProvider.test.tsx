import { render, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocationProvider, useLocation } from "./LocationProvider";
import { DebugProvider } from "./DebugProvider";

vi.mock("../services/citySearch", () => ({
  reverseGeocode: vi.fn().mockResolvedValue("Geo City"),
}));

const LocationProbe = () => {
  const { location, status, error } = useLocation();
  return (
    <div>
      <div data-testid="source">{location()?.source ?? ""}</div>
      <div data-testid="city">{location()?.city ?? ""}</div>
      <div data-testid="status">{status()}</div>
      <div data-testid="error">{error() ?? ""}</div>
    </div>
  );
};

function renderWithProviders() {
  return render(() => (
    <DebugProvider>
      <LocationProvider>
        <LocationProbe />
      </LocationProvider>
    </DebugProvider>
  ));
}

describe("LocationProvider", () => {
  const originalFetch = globalThis.fetch;
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it("uses IP as preliminary location then upgrades to geolocation", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 1,
        longitude: 2,
        timezone: { id: "UTC" },
        city: "IP City",
      }),
    }) as typeof fetch;

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          setTimeout(() => {
            success({
              coords: { latitude: 10, longitude: 20 },
            } as GeolocationPosition);
          }, 50);
        },
      },
      configurable: true,
    });

    const { getByTestId } = renderWithProviders();

    await Promise.resolve();

    await waitFor(() => {
      expect(getByTestId("source").textContent).toBe("ip");
      expect(getByTestId("city").textContent).toBe("IP City");
    });

    vi.advanceTimersByTime(60);
    await Promise.resolve();

    await waitFor(() => {
      expect(getByTestId("source").textContent).toBe("geolocation");
      expect(getByTestId("city").textContent).toBe("Geo City");
    });
  });

  it("sets error when both IP and geolocation fail", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network")) as typeof fetch;

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          failure: PositionErrorCallback
        ) => {
          failure({ message: "Denied" } as GeolocationPositionError);
        },
      },
      configurable: true,
    });

    const { getByTestId } = renderWithProviders();

    await Promise.resolve();

    await waitFor(() => {
      expect(getByTestId("status").textContent).toBe("error");
      expect(getByTestId("error").textContent).toBe("Location fetch failed");
    });
  });
});
