import {
  createContext,
  createSignal,
  createEffect,
  createMemo,
  onMount,
  onCleanup,
  useContext,
  untrack,
  type ParentComponent,
  type Accessor,
} from "solid-js";
import { isServer } from "solid-js/web";
import SunCalc from "suncalc";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";
import type { LocationState } from "./LocationProvider";
import { useDebug } from "./DebugProvider";
import { getSkyGradientCss, type SkyCycle } from "../services/skyGradients";

export interface PrayerSettings {
  prayerMethod: string;
  madhab: string;
}

export interface MoonPhase {
  fraction: number;
  phase: number;
  angle: number;
  parallacticAngle?: number;
}

const SETTINGS_STORAGE_KEY = "waqt.settings";

const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  prayerMethod: "MuslimWorldLeague",
  madhab: "Shafi",
};

const CALCULATION_METHODS: Record<string, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Singapore: CalculationMethod.Singapore,
  Tehran: CalculationMethod.Tehran,
  Turkey: CalculationMethod.Turkey,
};

function readPrayerSettings(): PrayerSettings {
  try {
    if (typeof window === "undefined" || !window.localStorage) return { ...DEFAULT_PRAYER_SETTINGS };
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PRAYER_SETTINGS };
    const parsed = JSON.parse(stored);
    return {
      prayerMethod: parsed.prayerMethod || DEFAULT_PRAYER_SETTINGS.prayerMethod,
      madhab: parsed.madhab || DEFAULT_PRAYER_SETTINGS.madhab,
    };
  } catch {
    return { ...DEFAULT_PRAYER_SETTINGS };
  }
}

function writePrayerSettings(settings: PrayerSettings): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}

export type Cycle = SkyCycle;
export type Season = "winter" | "spring" | "summer" | "fall";

export interface SeasonMeta {
  currentSeason: Season;
  nextSeasonLabel: "Winter" | "Spring" | "Summer" | "Fall";
  nextSeasonStart: Date;
  daysUntilNextSeason: number;
}

export interface SolarData {
  sunrise: Date;
  sunset: Date;
  dawn: Date;
  dusk: Date;
  solarNoon: Date;
  dayLength: number;
}

export interface PrayerData {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface CurrentPrayer {
  name: string;
  startTime: Date;
  endTime: Date;
  nextPrayerName: string;
}

export interface OrbitProgress {
  sun: number;
  moon: number;
}

export interface GradientState {
  from: Cycle;
  to: Cycle;
  mix: number;
}

export interface TimeWindow {
  start: Date;
  end: Date;
}

export interface TimeHelpers {
  timeUntilNextSolarEvent: () => { label: string; seconds: number };
  nextPrayer: () => { name: string; time: Date; secondsUntil: number };
  currentPrayer: () => CurrentPrayer;
  currentGradient: () => string;
  gradientState: () => GradientState;
  getDayWindow: (at?: Date) => TimeWindow | null;
  getNightWindow: (at?: Date) => TimeWindow | null;
  isOffline: Accessor<boolean>;
  isStale: Accessor<boolean>;
}

export interface TimeContextValue {
  time: Accessor<Date>;
  solar: Accessor<SolarData | null>;
  prayer: Accessor<PrayerData | null>;
  cycle: Accessor<Cycle>;
  orbit: Accessor<OrbitProgress>;
  moonPhase: Accessor<MoonPhase | null>;
  season: Accessor<Season>;
  seasonMeta: Accessor<SeasonMeta>;
  helpers: TimeHelpers;
  refreshTiming: () => void;
  getPrayerSettings: () => PrayerSettings;
  setPrayerSettings: (settings: Partial<PrayerSettings>) => void;
}

const TimeContext = createContext<TimeContextValue>();

function getZonedTime(date: Date, timeZone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      timeZone,
    }).formatToParts(date);

    const getPart = (type: string) => {
      const part = parts.find((p) => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };

    const zoned = new Date(
      getPart("year"),
      getPart("month") - 1,
      getPart("day"),
      getPart("hour"),
      getPart("minute"),
      getPart("second")
    );
    zoned.setMilliseconds(date.getMilliseconds());
    return zoned;
  } catch (e) {
    return date;
  }
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeSolarData(date: Date, lat: number, lon: number, timezone: string): SolarData {
  const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  const times = SunCalc.getTimes(noon, lat, lon);
  const dayLength = times.sunset.getTime() - times.sunrise.getTime();

  return {
    sunrise: getZonedTime(times.sunrise, timezone),
    sunset: getZonedTime(times.sunset, timezone),
    dawn: getZonedTime(times.dawn, timezone),
    dusk: getZonedTime(times.dusk, timezone),
    solarNoon: getZonedTime(times.solarNoon, timezone),
    dayLength,
  };
}

function computePrayerData(date: Date, lat: number, lon: number, settings: PrayerSettings, timezone: string): PrayerData {
  const coordinates = new Coordinates(lat, lon);
  const methodFn = CALCULATION_METHODS[settings.prayerMethod] || CalculationMethod.MuslimWorldLeague;
  const params = methodFn();
  params.madhab = settings.madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  
  const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  const prayerTimes = new PrayerTimes(coordinates, noon, params);

  return {
    fajr: getZonedTime(prayerTimes.fajr, timezone),
    sunrise: getZonedTime(prayerTimes.sunrise, timezone),
    dhuhr: getZonedTime(prayerTimes.dhuhr, timezone),
    asr: getZonedTime(prayerTimes.asr, timezone),
    maghrib: getZonedTime(prayerTimes.maghrib, timezone),
    isha: getZonedTime(prayerTimes.isha, timezone),
  };
}

export function computeCurrentPrayer(now: Date, p: PrayerData): CurrentPrayer {
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const events: { name: string; time: Date }[] = [
    { name: "fajr", time: p.fajr },
    { name: "sunrise", time: p.sunrise },
    { name: "dhuhr", time: p.dhuhr },
    { name: "asr", time: p.asr },
    { name: "maghrib", time: p.maghrib },
    { name: "isha", time: p.isha },
  ];

  let currentIndex = -1;
  for (let i = 0; i < events.length; i += 1) {
    if (events[i].time.getTime() <= nowMs) {
      currentIndex = i;
    }
  }

  if (currentIndex === -1) {
    const ishaStart = new Date(events[events.length - 1].time.getTime() - dayMs);
    return {
      name: "isha",
      startTime: ishaStart,
      endTime: events[0].time,
      nextPrayerName: "fajr",
    };
  }

  if (currentIndex === events.length - 1) {
    const tomorrowFajr = new Date(events[0].time.getTime() + dayMs);
    return {
      name: events[currentIndex].name,
      startTime: events[currentIndex].time,
      endTime: tomorrowFajr,
      nextPrayerName: "fajr",
    };
  }

  const next = events[currentIndex + 1];
  return {
    name: events[currentIndex].name,
    startTime: events[currentIndex].time,
    endTime: next.time,
    nextPrayerName: next.name,
  };
}

function determineCycle(time: Date, solar: SolarData): Cycle {
  const now = time.getTime();
  const { dawn, sunrise, sunset, dusk } = solar;

  if (now >= dawn.getTime() && now < sunrise.getTime()) {
    return "dawn";
  }
  if (now >= sunrise.getTime() && now < sunset.getTime()) {
    return "day";
  }
  if (now >= sunset.getTime() && now < dusk.getTime()) {
    return "dusk";
  }
  return "night";
}

function determineCycleFallback(time: Date): Cycle {
  const hour = time.getHours();
  // 06:00 <= hour < 18:00 → day
  if (hour >= 6 && hour < 18) {
    return "day";
  }
  // 18:00 <= hour < 06:00 → night
  return "night";
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function splitTransition(progress: number, from: Cycle, middle: Cycle, to: Cycle): GradientState {
  if (progress < 0.5) {
    return { from, to: middle, mix: clamp01(progress * 2) };
  }
  return { from: middle, to, mix: clamp01((progress - 0.5) * 2) };
}

export function computeGradientState(time: Date, solar: SolarData | null, cycle: Cycle): GradientState {
  if (!solar) {
    return { from: cycle, to: cycle, mix: 0 };
  }

  const now = time.getTime();
  const dawnStart = solar.dawn.getTime();
  const sunrise = solar.sunrise.getTime();
  const sunset = solar.sunset.getTime();
  const duskEnd = solar.dusk.getTime();

  if (sunrise > dawnStart && now >= dawnStart && now <= sunrise) {
    const progress = clamp01((now - dawnStart) / (sunrise - dawnStart));
    return splitTransition(progress, "night", "dawn", "day");
  }

  if (duskEnd > sunset && now >= sunset && now <= duskEnd) {
    const progress = clamp01((now - sunset) / (duskEnd - sunset));
    return splitTransition(progress, "day", "dusk", "night");
  }

  return { from: cycle, to: cycle, mix: 0 };
}

export function computeMoonPosition(nowMs: number, lat: number, lon: number): number {
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Get events for yesterday, today, tomorrow to ensure we cover the current window
  const dates = [
    new Date(nowMs - oneDay),
    new Date(nowMs),
    new Date(nowMs + oneDay)
  ];
  
  interface MoonEvent {
    type: 'rise' | 'set';
    time: number;
  }
  
  const events: MoonEvent[] = [];
  
  for (const d of dates) {
    const times = SunCalc.getMoonTimes(d, lat, lon);
    if (times.rise) events.push({ type: 'rise', time: times.rise.getTime() });
    if (times.set) events.push({ type: 'set', time: times.set.getTime() });
  }
  
  // Sort events by time
  events.sort((a, b) => a.time - b.time);
  
  // Find events surrounding 'now'
  let prevEvent: MoonEvent | null = null;
  let nextEvent: MoonEvent | null = null;
  
  for (let i = 0; i < events.length; i++) {
    if (events[i].time > nowMs) {
      nextEvent = events[i];
      prevEvent = events[i - 1] || null;
      break;
    }
  }
  
  if (!prevEvent || !nextEvent) {
    // Fallback: approximate based on opposite of sun if no data (rare)
    return 0; 
  }
  
  const duration = nextEvent.time - prevEvent.time;
  const elapsed = nowMs - prevEvent.time;
  const linearProgress = elapsed / duration;
  
  if (prevEvent.type === 'rise' && nextEvent.type === 'set') {
    // Moon is UP: 0 -> 1
    return Math.max(0, Math.min(1, linearProgress));
  } else {
    // Moon is DOWN: 1 -> 2 (maps to return path below horizon)
    return 1 + Math.max(0, Math.min(1, linearProgress));
  }
}

function computeOrbitFallback(time: Date): OrbitProgress {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  
  // Convert current time to hours with fraction
  const currentHour = hour + minute / 60 + second / 3600;

  if (currentHour >= 6 && currentHour < 18) {
    // Day: 6am to 6pm -> 0 to 1
    const progress = (currentHour - 6) / 12;
    return { sun: Math.max(0, Math.min(1, progress)), moon: 0 };
  } else {
    // Night: 6pm to 6am -> 0 to 1
    // If hour is < 6 (e.g., 2am), it's part of the night starting previous day 18:00
    // If hour >= 18, it's start of night.
    let nightProgress = 0;
    if (currentHour >= 18) {
      nightProgress = (currentHour - 18) / 12;
    } else {
      // 0am to 6am is the second half of the night (6h to 12h duration)
      nightProgress = (currentHour + 6) / 12;
    }
    
    return { sun: 0, moon: Math.max(0, Math.min(1, nightProgress)) };
  }
}

export function computeOrbitProgress(time: Date, solar: SolarData, lat: number, lon: number): OrbitProgress {
  const now = time.getTime();
  const { sunrise, sunset, dusk, dawn } = solar;
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const dawnMs = dawn.getTime();
  const duskMs = dusk.getTime();

  let sunProgress = 0;
  if (now >= sunriseMs && now <= sunsetMs) {
    sunProgress = (now - sunriseMs) / (sunsetMs - sunriseMs);
  } else if (now < sunriseMs && now >= dawnMs) {
    sunProgress = 0; // Stick to horizon during dawn
  } else if (now > sunsetMs && now <= duskMs) {
    sunProgress = 1; // Stick to horizon during dusk
  } else {
     // Below horizon logic could be added here if needed, but spec implies it might be handled by cycle or ignored.
     // For now, keep existing logic: 0 or 1 for day/dusk/dawn boundaries.
     // But wait, if it's night, sunProgress should probably reflect position below horizon?
     // Existing code returned 0 or 1.
     // The Sky Engine spec handles "Sun Below Horizon" by just calculating position.
     // But computeOrbitProgress returns normalized [0,1].
     // If we want it to go below horizon, we should probably allow <0 or >1?
     // The spec says "normalized value [0,1]".
     // If I look at the previous code:
     // else if (now < sunriseMs && now >= dawnMs) sunProgress = 0;
     // else if (now > sunsetMs && now <= duskMs) sunProgress = 1;
     // It didn't handle night specifically for sun.
  }

  const moonProgress = computeMoonPosition(now, lat, lon);

  return {
    sun: Math.max(0, Math.min(1, sunProgress)),
    moon: moonProgress, // Allow >1 for below horizon
  };
}

function determineSeason(date: Date, lat?: number): Season {
  const month = date.getMonth();
  const isSouthHemisphere = (lat ?? 0) < 0;

  if (!isSouthHemisphere) {
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  if (month >= 2 && month <= 4) return "fall";
  if (month >= 5 && month <= 7) return "winter";
  if (month >= 8 && month <= 10) return "spring";
  return "summer";
}

function toSeasonLabel(season: Season): "Winter" | "Spring" | "Summer" | "Fall" {
  if (season === "winter") return "Winter";
  if (season === "spring") return "Spring";
  if (season === "summer") return "Summer";
  return "Fall";
}

function computeSeasonMeta(date: Date, lat?: number): SeasonMeta {
  const year = date.getFullYear();
  const isSouthHemisphere = (lat ?? 0) < 0;
  const currentSeason = determineSeason(date, lat);

  const boundarySeasons: Array<{ month: number; day: number; season: Season }> = isSouthHemisphere
    ? [
        { month: 2, day: 1, season: "fall" },
        { month: 5, day: 1, season: "winter" },
        { month: 8, day: 1, season: "spring" },
        { month: 11, day: 1, season: "summer" },
      ]
    : [
        { month: 2, day: 1, season: "spring" },
        { month: 5, day: 1, season: "summer" },
        { month: 8, day: 1, season: "fall" },
        { month: 11, day: 1, season: "winter" },
      ];

  const boundaries = [
    ...boundarySeasons.map((entry) => ({
      season: entry.season,
      start: new Date(year, entry.month, entry.day, 0, 0, 0, 0),
    })),
    ...boundarySeasons.map((entry) => ({
      season: entry.season,
      start: new Date(year + 1, entry.month, entry.day, 0, 0, 0, 0),
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextBoundary = boundaries.find((boundary) => boundary.start.getTime() > date.getTime()) ?? boundaries[0];
  const diffMs = nextBoundary.start.getTime() - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return {
    currentSeason,
    nextSeasonLabel: toSeasonLabel(nextBoundary.season),
    nextSeasonStart: nextBoundary.start,
    daysUntilNextSeason: Math.max(0, Math.floor(diffMs / dayMs)),
  };
}

interface TimeProviderProps {
  location: Accessor<LocationState | null>;
  children: any;
}

export const TimeProvider: ParentComponent<{ location: Accessor<LocationState | null>; timezone?: Accessor<string> }> = (props) => {
  const debug = useDebug();
  const [time, setTime] = createSignal(new Date());
  const [prayerSettings, setPrayerSettingsSignal] = createSignal<PrayerSettings>(readPrayerSettings());

  // Calculate immediately if location is available
  const loc = props.location();
  let initialSolar: SolarData | null = null;
  let initialPrayer: PrayerData | null = null;
  let initialMoonPhase: MoonPhase | null = null;
  
  if (loc) {
     try {
        const now = time();
        const settings = prayerSettings();
        initialSolar = computeSolarData(now, loc.lat, loc.lon, loc.timezone);
        initialPrayer = computePrayerData(now, loc.lat, loc.lon, settings, loc.timezone);
        const illumination = SunCalc.getMoonIllumination(now);
        const position = SunCalc.getMoonPosition(now, loc.lat, loc.lon);
        initialMoonPhase = {
           fraction: illumination.fraction,
           phase: illumination.phase,
           angle: illumination.angle,
           parallacticAngle: (position as any).parallacticAngle,
        };
     } catch (e) {
        // Fallback or ignore, allow signals to init as null
     }
  }

  const [solar, setSolar] = createSignal<SolarData | null>(initialSolar);
  const [prayer, setPrayer] = createSignal<PrayerData | null>(initialPrayer);
  const [moonPhase, setMoonPhase] = createSignal<MoonPhase | null>(initialMoonPhase);
  const [isOffline, setIsOffline] = createSignal(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [isStale, setIsStale] = createSignal(false);

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let lastPerfNow = performance.now();
  let lastTime = Date.now();

  const [debugBaseTime, setDebugBaseTime] = createSignal<number>(Date.now());
  const [debugBaseRealTime, setDebugBaseRealTime] = createSignal<number>(performance.now());
  
  let lastRefreshDateStr = "";
  let isRefreshing = false;

  // Handle debug time override changes
  createEffect(() => {
    const d = debug.state();
    if (d.enabled && d.timeOverride.active) {
       const dateStr = d.timeOverride.date || toLocalDateString(new Date());
       const timeStr = d.timeOverride.time || "12:00:00";
       const newBase = new Date(`${dateStr}T${timeStr}`).getTime();
       
       setDebugBaseTime(newBase);
       setDebugBaseRealTime(performance.now());
       setTime(new Date(newBase));
    }
  });

  const cycle = createMemo<Cycle>(() => {
    const s = solar();
    const t = time();
    if (!s) return determineCycleFallback(t);
    return determineCycle(t, s);
  });

  const orbit = createMemo<OrbitProgress>(() => {
    const s = solar();
    const t = time();
    const loc = props.location();
    if (!s || !loc) return computeOrbitFallback(t);
    return computeOrbitProgress(t, s, loc.lat, loc.lon);
  });

  const season = createMemo<Season>(() => determineSeason(time(), props.location()?.lat));
  const seasonMeta = createMemo<SeasonMeta>(() => computeSeasonMeta(time(), props.location()?.lat));

  function refreshTiming(forceRecalculate = false): void {
    if (isRefreshing) return;
    const loc = props.location();
    if (!loc) return;

    isRefreshing = true;
    
    const now = time();
    
    try {
      const settings = prayerSettings();
  
      const solarData = computeSolarData(now, loc.lat, loc.lon, loc.timezone);
      const prayerData = computePrayerData(now, loc.lat, loc.lon, settings, loc.timezone);
      const illumination = SunCalc.getMoonIllumination(now);
      const position = SunCalc.getMoonPosition(now, loc.lat, loc.lon);
      const moonPhaseData: MoonPhase = {
        fraction: illumination.fraction,
        phase: illumination.phase,
        angle: illumination.angle,
        parallacticAngle: (position as any).parallacticAngle,
      };

      setSolar(solarData);
      setPrayer(prayerData);
      setMoonPhase(moonPhaseData);
      setIsStale(false);
      lastRefreshDateStr = toLocalDateString(now);
    } catch (err) {
      // Mark as refreshed even on error to prevent loops
      lastRefreshDateStr = toLocalDateString(now);
      
      const fallbackSolar: SolarData = {
        sunrise: new Date(new Date(now).setUTCHours(6, 0, 0, 0)),
        sunset: new Date(new Date(now).setUTCHours(18, 0, 0, 0)),
        dawn: new Date(new Date(now).setUTCHours(5, 30, 0, 0)),
        dusk: new Date(new Date(now).setUTCHours(18, 30, 0, 0)),
        solarNoon: new Date(new Date(now).setUTCHours(12, 0, 0, 0)),
        dayLength: 12 * 60 * 60 * 1000,
      };
      setSolar(fallbackSolar);
      setIsStale(true);
    } finally {
      isRefreshing = false;
    }
  }

  function getPrayerSettings(): PrayerSettings {
    return prayerSettings();
  }

  function setPrayerSettings(newSettings: Partial<PrayerSettings>): void {
    const current = prayerSettings();
    const updated: PrayerSettings = {
      prayerMethod: newSettings.prayerMethod ?? current.prayerMethod,
      madhab: newSettings.madhab ?? current.madhab,
    };
    writePrayerSettings(updated);
    setPrayerSettingsSignal(updated);
    refreshTiming(true);
  }

  function tick(): void {
    const d = debug.state();
    let currentBaseTime: Date;

    if (d.enabled && d.timeOverride.active) {
      const nowPerf = performance.now();
      const elapsed = nowPerf - debugBaseRealTime();
      const speed = d.timeOverride.speed;
      const newTime = debugBaseTime() + elapsed * speed;
      currentBaseTime = new Date(newTime);
    } else if (isOffline()) {
      const currentPerf = performance.now();
      const elapsed = currentPerf - lastPerfNow;
      lastPerfNow = currentPerf;
      lastTime += elapsed;
      currentBaseTime = new Date(lastTime);
    } else {
      const now = new Date();
      currentBaseTime = now;
      lastTime = now.getTime();
      lastPerfNow = performance.now();
    }

    const loc = props.location();
    if (loc && loc.timezone) {
      setTime(getZonedTime(currentBaseTime, loc.timezone));
    } else if (props.timezone) {
      setTime(getZonedTime(currentBaseTime, props.timezone()));
    } else {
      setTime(currentBaseTime);
    }
  }

  function handleOnline(): void {
    setIsOffline(false);
    refreshTiming();
  }

  function handleOffline(): void {
    setIsOffline(true);
  }

  onMount(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    tick();
    intervalId = setInterval(tick, 1000);
  });

  onCleanup(() => {
    if (!isServer) {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
    if (intervalId) clearInterval(intervalId);
  });

  createEffect(() => {
    const loc = props.location();
    if (loc) {
      untrack(() => {
        tick();
        refreshTiming();
      });
    }
  });

  // Watch for day changes to refresh solar data
  createEffect(() => {
     const t = time();
     const tDay = toLocalDateString(t);
     
     // Only check if we haven't refreshed for this day yet
     if (tDay !== lastRefreshDateStr) {
       const s = untrack(() => solar());
       if (s) {
         const sDay = toLocalDateString(s.sunrise);
         if (tDay > sDay) {
            refreshTiming();
         }
       } else {
          refreshTiming();
       }
     }
  });

  function timeUntilNextSolarEvent(): { label: string; seconds: number } {
    const s = solar();
    const t = time();
    if (!s) return { label: "sunrise", seconds: 0 };

    const now = t.getTime();
    const events: { label: string; time: number }[] = [
      { label: "dawn", time: s.dawn.getTime() },
      { label: "sunrise", time: s.sunrise.getTime() },
      { label: "noon", time: s.solarNoon.getTime() },
      { label: "sunset", time: s.sunset.getTime() },
      { label: "dusk", time: s.dusk.getTime() },
    ];

    for (const event of events) {
      if (event.time > now) {
        return {
          label: event.label,
          seconds: Math.floor((event.time - now) / 1000),
        };
      }
    }

    const tomorrowDawn = s.dawn.getTime() + 24 * 60 * 60 * 1000;
    return {
      label: "dawn",
      seconds: Math.floor((tomorrowDawn - now) / 1000),
    };
  }

  function getDayWindow(at?: Date): TimeWindow | null {
    const s = solar();
    if (!s) return null;
    return { start: s.sunrise, end: s.sunset };
  }

  function getNightWindow(at?: Date): TimeWindow | null {
    const s = solar();
    if (!s) return null;
    const now = (at ?? time()).getTime();
    const dawn = s.dawn.getTime();
    const dusk = s.dusk.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (now < dawn) {
      return { start: new Date(dusk - dayMs), end: s.dawn };
    }

    return { start: s.dusk, end: new Date(dawn + dayMs) };
  }

  function nextPrayer(): { name: string; time: Date; secondsUntil: number } {
    const p = prayer();
    const t = time();
    if (!p) return { name: "dhuhr", time: new Date(), secondsUntil: 0 };

    const now = t.getTime();
    const prayers: { name: string; time: Date }[] = [
      { name: "fajr", time: p.fajr },
      { name: "sunrise", time: p.sunrise },
      { name: "dhuhr", time: p.dhuhr },
      { name: "asr", time: p.asr },
      { name: "maghrib", time: p.maghrib },
      { name: "isha", time: p.isha },
    ];

    for (const pr of prayers) {
      if (pr.time.getTime() > now) {
        return {
          name: pr.name,
          time: pr.time,
          secondsUntil: Math.floor((pr.time.getTime() - now) / 1000),
        };
      }
    }

    const tomorrowFajr = new Date(p.fajr.getTime() + 24 * 60 * 60 * 1000);
    return {
      name: "fajr",
      time: tomorrowFajr,
      secondsUntil: Math.floor((tomorrowFajr.getTime() - now) / 1000),
    };
  }

  function currentPrayer(): CurrentPrayer {
    const p = prayer();
    const t = time();
    if (!p) {
      return { name: "dhuhr", startTime: t, endTime: t, nextPrayerName: "asr" };
    }

    return computeCurrentPrayer(t, p);
  }

  function currentGradient(): string {
    return getSkyGradientCss(cycle());
  }

  function gradientState(): GradientState {
    return computeGradientState(time(), solar(), cycle());
  }

  const helpers: TimeHelpers = {
    timeUntilNextSolarEvent,
    nextPrayer,
    currentPrayer,
    currentGradient,
    gradientState,
    getDayWindow,
    getNightWindow,
    isOffline,
    isStale,
  };

  const value: TimeContextValue = {
    time,
    solar,
    prayer,
    cycle,
    orbit,
    moonPhase,
    season,
    seasonMeta,
    helpers,
    refreshTiming: () => refreshTiming(),
    getPrayerSettings,
    setPrayerSettings,
  };

  return (
    <TimeContext.Provider value={value}>
      {props.children}
    </TimeContext.Provider>
  );
};

export function useTime(): TimeContextValue {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error("useTime must be used within a TimeProvider");
  }
  return context;
}
