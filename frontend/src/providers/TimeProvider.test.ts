import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import SunCalc from "suncalc";
import { computeMoonPosition, computeOrbitProgress, type SolarData } from "./TimeProvider";

function makeSolarData(): SolarData {
  return {
    dawn: new Date("2025-01-01T06:00:00.000Z"),
    sunrise: new Date("2025-01-01T07:00:00.000Z"),
    solarNoon: new Date("2025-01-01T13:00:00.000Z"),
    sunset: new Date("2025-01-01T19:00:00.000Z"),
    dusk: new Date("2025-01-01T20:00:00.000Z"),
    dayLength: 12 * 60 * 60 * 1000,
  };
}

describe("computeOrbitProgress", () => {
  const lat = 40.0;
  const lon = -74.0;

  beforeEach(() => {
    vi.spyOn(SunCalc, "getMoonTimes").mockImplementation((date: Date) => {
      const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
      return {
        rise: new Date(base.getTime() + 2 * 60 * 60 * 1000),
        set: new Date(base.getTime() + 10 * 60 * 60 * 1000),
      } as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clamps sun progress outside sunrise/sunset during night", () => {
    const solar = makeSolarData();

    const beforeDawn = computeOrbitProgress(new Date("2025-01-01T02:00:00.000Z"), solar, lat, lon);
    expect(beforeDawn.sun).toBe(0);
    expect(beforeDawn.moon).toBeGreaterThanOrEqual(0);
    expect(beforeDawn.moon).toBeLessThanOrEqual(2);

    const afterDusk = computeOrbitProgress(new Date("2025-01-01T22:00:00.000Z"), solar, lat, lon);
    expect(afterDusk.sun).toBe(0);
    expect(afterDusk.moon).toBeGreaterThanOrEqual(0);
    expect(afterDusk.moon).toBeLessThanOrEqual(2);
  });

  it("sticks to horizon around dawn and dusk boundaries", () => {
    const solar = makeSolarData();

    const duringDawn = computeOrbitProgress(new Date("2025-01-01T06:30:00.000Z"), solar, lat, lon);
    expect(duringDawn.sun).toBe(0);

    const atSunrise = computeOrbitProgress(new Date("2025-01-01T07:00:00.000Z"), solar, lat, lon);
    expect(atSunrise.sun).toBe(0);

    const duringDusk = computeOrbitProgress(new Date("2025-01-01T19:30:00.000Z"), solar, lat, lon);
    expect(duringDusk.sun).toBe(1);

    const atSunset = computeOrbitProgress(new Date("2025-01-01T19:00:00.000Z"), solar, lat, lon);
    expect(atSunset.sun).toBe(1);
  });
});

describe("computeMoonPosition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns safe fallback when rise/set events are missing", () => {
    vi.spyOn(SunCalc, "getMoonTimes").mockReturnValue({} as any);

    const result = computeMoonPosition(Date.parse("2025-01-01T03:00:00.000Z"), 0, 0);
    expect(result).toBe(0);
  });
});
