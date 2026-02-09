import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { useTime } from "~/providers/useTime";
import { TimeProvider, computeCurrentPrayer, computeGradientState, type Cycle, type Season, type PrayerSettings, type SolarData } from "./TimeProvider";
import { DebugProvider } from "./DebugProvider";
import type { LocationState } from "./LocationProvider";

const SETTINGS_STORAGE_KEY = "waqt.settings";

const mockLocation: LocationState = {
  lat: 41.3,
  lon: 69.3,
  timezone: "Asia/Tashkent",
  city: "Tashkent",
  source: "manual",
  timestamp: Date.now(),
};

function TestConsumer(props: { onMount?: (ctx: ReturnType<typeof useTime>) => void }) {
  const ctx = useTime();
  props.onMount?.(ctx);
  return (
    <div>
      <span data-testid="cycle">{ctx.cycle()}</span>
      <span data-testid="season">{ctx.season()}</span>
      <span data-testid="season-next">{ctx.seasonMeta().nextSeasonLabel}</span>
      <span data-testid="season-days">{ctx.seasonMeta().daysUntilNextSeason}</span>
      <span data-testid="sun-orbit">{ctx.orbit().sun.toFixed(2)}</span>
      <span data-testid="moon-orbit">{ctx.orbit().moon.toFixed(2)}</span>
      <span data-testid="has-solar">{ctx.solar() ? "yes" : "no"}</span>
      <span data-testid="has-prayer">{ctx.prayer() ? "yes" : "no"}</span>
    </div>
  );
}

describe("TimeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws error when useTime is called outside provider", () => {
    expect(() => {
      render(() => {
        useTime();
        return <div />;
      });
    }).toThrow("useTime must be used within a TimeProvider");
  });

  it("computes solar and prayer data when location is provided", async () => {
    const [location] = createSignal<LocationState | null>(mockLocation);

    const { getByTestId } = render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(getByTestId("has-solar").textContent).toBe("yes");
      expect(getByTestId("has-prayer").textContent).toBe("yes");
    });
  });

  it("determines cycle correctly", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00"));
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
      expect(ctx!.solar()).not.toBeNull();
    });

    const cycle = ctx!.cycle();
    expect(["dawn", "day", "dusk", "night"]).toContain(cycle);
  });

  it("determines season correctly for winter", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00"));
    const [location] = createSignal<LocationState | null>(mockLocation);

    const { getByTestId } = render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(getByTestId("season").textContent).toBe("winter");
    });
  });

  it("determines season correctly for summer", async () => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    const [location] = createSignal<LocationState | null>(mockLocation);

    const { getByTestId } = render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(getByTestId("season").textContent).toBe("summer");
    });
  });

  it("determines season using southern hemisphere inversion", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00"));
    const [location] = createSignal<LocationState | null>({
      ...mockLocation,
      lat: -33.8688,
      lon: 151.2093,
      city: "Sydney",
      timezone: "Australia/Sydney",
    });

    const { getByTestId } = render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(getByTestId("season").textContent).toBe("summer");
      expect(getByTestId("season-next").textContent).toBe("Fall");
    });
  });

  it("computes orbit progress", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00"));
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
      expect(ctx!.solar()).not.toBeNull();
    });

    const orbit = ctx!.orbit();
    expect(orbit.sun).toBeGreaterThanOrEqual(0);
    expect(orbit.sun).toBeLessThanOrEqual(1);
    expect(orbit.moon).toBeGreaterThanOrEqual(0);
    expect(orbit.moon).toBeLessThanOrEqual(1);
  });



  it("provides timeUntilNextSolarEvent helper", async () => {
    vi.setSystemTime(new Date("2026-01-21T10:00:00"));
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
      expect(ctx!.solar()).not.toBeNull();
    });

    const event = ctx!.helpers.timeUntilNextSolarEvent();
    expect(event.label).toBeTruthy();
    expect(typeof event.seconds).toBe("number");
  });

  it("provides day and night window helpers", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00"));
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
      expect(ctx!.solar()).not.toBeNull();
    });

    const solar = ctx!.solar()!;
    const day = ctx!.helpers.getDayWindow();
    const night = ctx!.helpers.getNightWindow();

    expect(day).not.toBeNull();
    expect(night).not.toBeNull();
    expect(day!.start.getTime()).toBe(solar.sunrise.getTime());
    expect(day!.end.getTime()).toBe(solar.sunset.getTime());
    expect(night!.start.getTime()).toBe(solar.dusk.getTime());
    expect(night!.end.getTime()).toBe(solar.dawn.getTime() + 24 * 60 * 60 * 1000);
  });

  it("provides nextPrayer helper", async () => {
    vi.setSystemTime(new Date("2026-01-21T10:00:00"));
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
      expect(ctx!.prayer()).not.toBeNull();
    });

    const prayer = ctx!.helpers.nextPrayer();
    expect(prayer.name).toBeTruthy();
    expect(prayer.time).toBeInstanceOf(Date);
    expect(typeof prayer.secondsUntil).toBe("number");
  });

  it("computeCurrentPrayer returns current slot and after-isha behavior", () => {
    const prayerData = {
      fajr: new Date(2026, 0, 26, 5, 0, 0),
      sunrise: new Date(2026, 0, 26, 6, 30, 0),
      dhuhr: new Date(2026, 0, 26, 12, 0, 0),
      asr: new Date(2026, 0, 26, 15, 30, 0),
      maghrib: new Date(2026, 0, 26, 18, 0, 0),
      isha: new Date(2026, 0, 26, 19, 30, 0),
    };

    const dhuhrWindow = computeCurrentPrayer(new Date(2026, 0, 26, 14, 0, 0), prayerData);
    expect(dhuhrWindow.name).toBe("dhuhr");
    expect(dhuhrWindow.endTime.getTime()).toBe(prayerData.asr.getTime());
    expect(dhuhrWindow.nextPrayerName).toBe("asr");

    const afterIsha = computeCurrentPrayer(new Date(2026, 0, 26, 23, 0, 0), prayerData);
    expect(afterIsha.name).toBe("isha");
    expect(afterIsha.endTime.getDate()).toBe(27);
    expect(afterIsha.nextPrayerName).toBe("fajr");

    const beforeFajr = computeCurrentPrayer(new Date(2026, 0, 26, 4, 0, 0), prayerData);
    expect(beforeFajr.name).toBe("isha");
    expect(beforeFajr.startTime.getDate()).toBe(25);
    expect(beforeFajr.endTime.getTime()).toBe(prayerData.fajr.getTime());
  });

  it("provides currentGradient helper", async () => {
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

    const gradient = ctx!.helpers.currentGradient();
    expect(typeof gradient).toBe("string");
    expect(gradient).toContain("linear-gradient(");
    expect(gradient).toContain("to bottom");
  });

  it("computes gradientState across dawn and dusk windows", () => {
    const at = (hours: number, minutes: number) => new Date(2026, 0, 26, hours, minutes, 0);

    const solar: SolarData = {
      dawn: at(6, 0),
      sunrise: at(6, 30),
      sunset: at(18, 0),
      dusk: at(18, 30),
      solarNoon: at(12, 0),
      dayLength: 12 * 60 * 60 * 1000,
    };

    let state = computeGradientState(at(6, 10), solar, "dawn");
    expect(state.from).toBe("night");
    expect(state.to).toBe("dawn");
    expect(state.mix).toBeCloseTo(0.666, 2);

    state = computeGradientState(at(6, 25), solar, "dawn");
    expect(state.from).toBe("dawn");
    expect(state.to).toBe("day");
    expect(state.mix).toBeCloseTo(0.666, 2);

    state = computeGradientState(at(18, 0), solar, "dusk");
    expect(state.from).toBe("day");
    expect(state.to).toBe("dusk");
    expect(state.mix).toBeCloseTo(0, 5);

    state = computeGradientState(at(18, 30), solar, "night");
    expect(state.from).toBe("dusk");
    expect(state.to).toBe("night");
    expect(state.mix).toBeCloseTo(1, 5);

    state = computeGradientState(at(14, 0), solar, "day");
    expect(state.from).toBe("day");
    expect(state.to).toBe("day");
    expect(state.mix).toBe(0);

    state = computeGradientState(at(14, 0), null, "day");
    expect(state.from).toBe("day");
    expect(state.to).toBe("day");
    expect(state.mix).toBe(0);

  });

  it("updates time signal periodically", async () => {
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

    const initialTime = ctx!.time().getTime();

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      const newTime = ctx!.time().getTime();
      expect(newTime).toBeGreaterThan(initialTime);
    });
  });

  it("refreshTiming recalculates data", async () => {
    const [location, setLocation] = createSignal<LocationState | null>(mockLocation);

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
      expect(ctx!.solar()).not.toBeNull();
    });

    const initialSolar = ctx!.solar();

    setLocation({
      ...mockLocation,
      lat: 51.5,
      lon: -0.12,
      city: "London",
      timezone: "Europe/London",
    });

    await waitFor(() => {
      const newSolar = ctx!.solar();
      expect(newSolar).not.toBeNull();
      expect(newSolar!.sunrise.getTime()).not.toBe(initialSolar!.sunrise.getTime());
    });
  });

  it("handles null location gracefully", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00")); // Ensure it's day
    const [location] = createSignal<LocationState | null>(null);

    const { getByTestId } = render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(getByTestId("has-solar").textContent).toBe("no");
      expect(getByTestId("cycle").textContent).toBe("day");
    });
  });

  it("getPrayerSettings returns default settings", async () => {
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

    const settings = ctx!.getPrayerSettings();
    expect(settings.prayerMethod).toBe("MuslimWorldLeague");
    expect(settings.madhab).toBe("Shafi");
  });

  it("setPrayerSettings updates settings and persists to localStorage", async () => {
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

    ctx!.setPrayerSettings({ prayerMethod: "Egyptian", madhab: "Hanafi" });

    const settings = ctx!.getPrayerSettings();
    expect(settings.prayerMethod).toBe("Egyptian");
    expect(settings.madhab).toBe("Hanafi");

    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.prayerMethod).toBe("Egyptian");
    expect(stored.madhab).toBe("Hanafi");
  });

  it("setPrayerSettings triggers prayer time recalculation", async () => {
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
      expect(ctx!.prayer()).not.toBeNull();
    });

    const initialPrayer = ctx!.prayer()!;
    const initialAsrTime = initialPrayer.asr.getTime();

    ctx!.setPrayerSettings({ madhab: "Hanafi" });

    await waitFor(() => {
      const newPrayer = ctx!.prayer()!;
      expect(newPrayer.asr.getTime()).not.toBe(initialAsrTime);
    });
  });

  it("loads prayer settings from localStorage on mount", async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      prayerMethod: "Karachi",
      madhab: "Hanafi",
    }));

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

    const settings = ctx!.getPrayerSettings();
    expect(settings.prayerMethod).toBe("Karachi");
    expect(settings.madhab).toBe("Hanafi");
  });

  it("uses smart fallback for day cycle when location is unknown", async () => {
    vi.setSystemTime(new Date("2026-01-21T12:00:00")); // Noon
    const [location] = createSignal<LocationState | null>(null);

    let ctx: ReturnType<typeof useTime>;
    render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer onMount={(c) => (ctx = c)} />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(ctx!.cycle()).toBe("day");
      expect(ctx!.orbit().sun).toBeCloseTo(0.5); // Noon is halfway between 6 and 18
      expect(ctx!.orbit().moon).toBe(0);
    });
  });

  it("uses smart fallback for night cycle when location is unknown", async () => {
    vi.setSystemTime(new Date("2026-01-21T22:00:00")); // 10 PM
    const [location] = createSignal<LocationState | null>(null);

    let ctx: ReturnType<typeof useTime>;
    render(() => (
      <DebugProvider>
        <TimeProvider location={location}>
          <TestConsumer onMount={(c) => (ctx = c)} />
        </TimeProvider>
      </DebugProvider>
    ));

    await waitFor(() => {
      expect(ctx!.cycle()).toBe("night");
      expect(ctx!.orbit().sun).toBe(0);
      // 22:00 is 4 hours into the night (starting 18:00). 4/12 = 0.333
      expect(ctx!.orbit().moon).toBeCloseTo(0.333, 1);
    });
  });
});
