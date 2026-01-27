import {
  createContext,
  createSignal,
  createEffect,
  createMemo,
  onMount,
  useContext,
  type ParentComponent,
  type Accessor,
} from "solid-js";
import { useDebug } from "./DebugProvider";
import { reverseGeocode } from "../services/citySearch";

export type LocationSource = "geolocation" | "ip" | "manual";

export interface LocationState {
  lat: number;
  lon: number;
  timezone: string;
  city: string;
  source: LocationSource;
  timestamp: number;
}

export type LocationStatus = "idle" | "loading" | "error";

export interface LocationContextValue {
  location: Accessor<LocationState | null>;
  timezone: Accessor<string>;
  status: Accessor<LocationStatus>;
  error: Accessor<string | null>;
  isStale: Accessor<boolean>;
  refreshLocation: () => Promise<void>;
  manualLocation: (payload: {
    lat: number;
    lon: number;
    city: string;
    timezone?: string;
  }) => void;
  clearLocationCache: () => void;
}

const STORAGE_KEY = "waqt.location";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GEOLOCATION_TIMEOUT = 3_000; // 3 seconds
const IP_FETCH_TIMEOUT = 1_000; // 1 second

const LocationContext = createContext<LocationContextValue>();

function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > TTL_MS;
}

function readFromStorage(): LocationState | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocationState;
  } catch {
    return null;
  }
}

function writeToStorage(state: LocationState): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable, continue with in-memory state
  }
}

function clearStorage(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

async function resolveGeolocation(): Promise<LocationState> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("Geolocation timeout"));
    }, GEOLOCATION_TIMEOUT);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let city = "";
        try {
          const foundCity = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          if (foundCity) city = foundCity;
        } catch (e) {
          // Ignore
        }

        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timezone,
          city,
          source: "geolocation",
          timestamp: Date.now(),
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(new Error(error.message || "Geolocation failed"));
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 0,
      }
    );
  });
}

async function resolveIP(): Promise<LocationState> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IP_FETCH_TIMEOUT);

  try {
    const response = await fetch(
      "https://ipwho.is/?fields=latitude,longitude,timezone,city",
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error("IP geolocation request failed");
    }

    const data = await response.json();

    if (!data.latitude || !data.longitude) {
      throw new Error("Invalid IP geolocation response");
    }

    return {
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone,
      city: data.city || "",
      source: "ip",
      timestamp: Date.now(),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function coordinateLocationResolution(
  onPreliminary: (location: LocationState) => void,
  onFinal: (location: LocationState) => void
): Promise<{ ipResult: LocationState | null; geoResult: LocationState | null }> {
  let ipResult: LocationState | null = null;
  let geoResult: LocationState | null = null;

  const ipPromise = resolveIP()
    .then((loc) => {
      ipResult = loc;
      if (!geoResult) onPreliminary(loc);
    })
    .catch((err) => {
      console.warn("IP fetch failed", err);
    });

  const geoPromise = resolveGeolocation()
    .then((loc) => {
      geoResult = loc;
      onFinal(loc);
    })
    .catch((err) => {
      console.warn("Geolocation fetch failed", err);
    });

  await Promise.allSettled([ipPromise, geoPromise]);
  return { ipResult, geoResult };
}

export const LocationProvider: ParentComponent = (props) => {
  const debug = useDebug();
  const [rawLocation, setRawLocation] = createSignal<LocationState | null>(readFromStorage());
  const [status, setStatus] = createSignal<LocationStatus>("idle");
  const [error, setError] = createSignal<string | null>(null);
  const [isStale, setIsStale] = createSignal(false);

  const location = createMemo<LocationState | null>(() => {
    const d = debug.state();
    const base = rawLocation();
    if (!d.enabled || !d.locationOverride.active) return base;

    return {
      lat: d.locationOverride.lat,
      lon: d.locationOverride.lon,
      timezone: d.locationOverride.timezone,
      city: "Debug",
      source: "manual",
      timestamp: Date.now(),
    };
  });

  const timezone = createMemo(() => {
    const loc = location();
    return loc?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  async function refreshLocation(): Promise<void> {
    setStatus("loading");
    setError(null);

    const applyResolvedLocation = (loc: LocationState) => {
      setRawLocation(loc);
      writeToStorage(loc);
      setIsStale(false);
      setStatus("idle");
    };

    const { ipResult, geoResult } = await coordinateLocationResolution(
      applyResolvedLocation,
      applyResolvedLocation
    );

    // If both failed, set error
    if (!ipResult && !geoResult) {
      setError("Location fetch failed");
      setStatus("error");
    }
  }

  function manualLocation(payload: {
    lat: number;
    lon: number;
    city: string;
    timezone?: string;
  }): void {
    const timezone =
      payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const newState: LocationState = {
      lat: payload.lat,
      lon: payload.lon,
      timezone,
      city: payload.city,
      source: "manual",
      timestamp: Date.now(),
    };

    setRawLocation(newState);
    writeToStorage(newState);
    setIsStale(false);
    setError(null);
    setStatus("idle");
  }

  function clearLocationCache(): void {
    clearStorage();
    setRawLocation(null);
    setIsStale(false);
    setError(null);
    setStatus("idle");
  }

  onMount(() => {
    const cached = rawLocation();

    if (cached) {
      const expired = isExpired(cached.timestamp);
      setIsStale(expired);

      if (expired) {
        // Background refresh
        refreshLocation();
      }
    } else {
      // No cache, fetch fresh
      refreshLocation();
    }
  });

  // Schedule background refresh when TTL expires
  createEffect(() => {
    const loc = location();
    if (!loc) return;

    const timeUntilExpiry = TTL_MS - (Date.now() - loc.timestamp);
    if (timeUntilExpiry <= 0) return;

    const timerId = setTimeout(() => {
      setIsStale(true);
      refreshLocation();
    }, timeUntilExpiry);

    return () => clearTimeout(timerId);
  });

  const value: LocationContextValue = {
    location,
    timezone,
    status,
    error,
    isStale,
    refreshLocation,
    manualLocation,
    clearLocationCache,
  };

  return (
    <LocationContext.Provider value={value}>
      {props.children}
    </LocationContext.Provider>
  );
};

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
