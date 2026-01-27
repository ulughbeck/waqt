import {
  createContext,
  createSignal,
  createEffect,
  onMount,
  useContext,
  type ParentComponent,
  type Accessor,
} from "solid-js";
import { isServer } from "solid-js/web";

export interface TimeOverrideState {
  active: boolean;
  date: string;
  time: string;
  speed: 1 | 10 | 60 | 360;
}

export interface LocationOverrideState {
  active: boolean;
  lat: number;
  lon: number;
  timezone: string;
}

export interface DebugState {
  enabled: boolean;
  timeOverride: TimeOverrideState;
  locationOverride: LocationOverrideState;
}

export interface DebugContextValue {
  state: Accessor<DebugState>;
  setEnabled: (enabled: boolean) => void;
  setTimeOverride: (override: Partial<TimeOverrideState>) => void;
  setLocationOverride: (override: Partial<LocationOverrideState>) => void;
  reset: () => void;
}

const STORAGE_KEY = "waqt.debug";

function getDefaultState(): DebugState {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 8);

  return {
    enabled: false,
    timeOverride: {
      active: false,
      date: dateStr,
      time: timeStr,
      speed: 1,
    },
    locationOverride: {
      active: false,
      lat: 41.2995,
      lon: 69.2401,
      timezone: "Asia/Tashkent",
    },
  };
}

function readFromStorage(): DebugState | null {
  if (isServer) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      enabled: Boolean(parsed.enabled),
      timeOverride: {
        active: Boolean(parsed.timeOverride?.active),
        date: parsed.timeOverride?.date || "",
        time: parsed.timeOverride?.time || "",
        speed: [1, 10, 60, 360].includes(parsed.timeOverride?.speed)
          ? parsed.timeOverride.speed
          : 1,
      },
      locationOverride: {
        active: Boolean(parsed.locationOverride?.active),
        lat: Number(parsed.locationOverride?.lat) || 41.2995,
        lon: Number(parsed.locationOverride?.lon) || 69.2401,
        timezone: parsed.locationOverride?.timezone || "Asia/Tashkent",
      },
    };
  } catch {
    return null;
  }
}

function writeToStorage(state: DebugState): void {
  if (isServer) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

const DebugContext = createContext<DebugContextValue>();

export const DebugProvider: ParentComponent = (props) => {
  const [state, setState] = createSignal<DebugState>(getDefaultState());

  onMount(() => {
    const stored = readFromStorage();
    if (stored) {
      setState(stored);
    }
  });

  createEffect(() => {
    writeToStorage(state());
  });

  function setEnabled(enabled: boolean): void {
    setState((prev) => ({ ...prev, enabled }));
  }

  function setTimeOverride(override: Partial<TimeOverrideState>): void {
    setState((prev) => ({
      ...prev,
      timeOverride: { ...prev.timeOverride, ...override },
    }));
  }

  function setLocationOverride(override: Partial<LocationOverrideState>): void {
    setState((prev) => ({
      ...prev,
      locationOverride: { ...prev.locationOverride, ...override },
    }));
  }

  function reset(): void {
    setState(getDefaultState());
  }

  const value: DebugContextValue = {
    state,
    setEnabled,
    setTimeOverride,
    setLocationOverride,
    reset,
  };

  return (
    <DebugContext.Provider value={value}>
      {props.children}
    </DebugContext.Provider>
  );
};

export function useDebug(): DebugContextValue {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
