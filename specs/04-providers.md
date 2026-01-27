# Provider Specifications

This document fully defines the implementation contract for the providers that feed the Sky Engine and widgets: `LocationProvider` and `TimeProvider`. Treat these as single-responsibility layers that expose clear signals and helpers while keeping the architecture doc light.

## 1. LocationProvider (`LocationProvider`, `useLocation`)

### Responsibilities
- Resolve the user's geolocation (latitude, longitude) and timezone/city label.
- Cache the resolved payload and serve it to downstream consumers even when offline.
- Provide a manual override flow tied to the bottom-bar city button so the user can explicitly set a location.
- Surface status metadata (loading, error, lastUpdated) for UI feedback.

### Data Model
- `LocationState` object stored in `localStorage` under `waqt.location` (JSON-serialized) with fields:
  ```json
  {
    "lat": number,
    "lon": number,
    "timezone": string,
    "city": string,
    "source": "geolocation" | "ip" | "manual",
    "timestamp": number // Unix ms
  }
  ```
- Additional derived fields (not persisted) exposed via the signal:
  - `status`: `'idle' | 'loading' | 'error'`
  - `error`: `null | string` (human-readable message)
  - `isStale`: boolean indicating whether TTL has expired and a refresh is pending.

### Flow
1. **Immediate Init:** Initialize the state **synchronously** from `localStorage` if available (Client-side) to prevent content flashing.
   - **If cache exists:** Initialize signals with the stored `LocationState`.
   - **If no cache:** Initialize with System Timezone and `null` location (Status: `loading`).
   - This ensures the UI renders the user's last known context immediately on the first paint.

2. **Validation & Refresh (On Mount):**
   - Check if the cached data is stale (TTL > 24h).
   - If stale or missing: Trigger `refreshLocation()` in the background.
   - If valid: Do nothing (use cached data).

3. **Refresh Logic (Background):**
   - Primary fetch: `navigator.geolocation.getCurrentPosition` with `timeout: 3000ms`.
   - On success, reverse map to timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` or a lightweight timezone lookup, store the payload, and emit.
   - On failure (denial/timeout), fallback to third-party IP-based endpoint (`https://ipwho.is/?fields=latitude,longitude,timezone,city`) with a **strict 1000ms timeout**.
   - **Parallel Strategy:** Trigger the IP lookup *immediately* alongside the geolocation request. If IP returns first, use it as a preliminary "low-accuracy" result to unblock the UI. When geolocation returns (even if later), upgrade the location state with the precise coordinates.
4. Store the payload (including `source`) and update `localStorage`. Reset `status` to `'idle'` once stored.
4. Background refresh: once the cached timestamp is >24h old, attempt to re-fetch in the background (geolocation first, fallback to IP). While refreshing, continue serving cached data but set `isStale=true`.
5. Manual override: triggered when the user taps the city button in the bottom bar. The override should:
   - Open a modal bottom sheet (per the dashboard spec) with a single text field and inline suggestions based on the typed city name.
   - When the user selects a suggested city, the UI hands the provider a payload containing the resolved `city`, `lat`, `lon`, and preferably a timezone identifier (if the suggestion includes it).
   - The provider’s `manualLocation(payload)` method validates the coordinates, derives the accurate timezone (via `Intl.DateTimeFormat().resolvedOptions().timeZone` or verifying against the selection), sets `source: "manual"`, caches the new `LocationState`, and clears any stale `isStale` flag so the sky/timeline re-renders immediately.
   - The manual selection becomes the persisted “last selected city” so that on every subsequent load the bottom bar text reflects the saved city regardless of whether geolocation is available.
### City Search Implementation

The city search uses the **Open-Meteo Geocoding API** (free, no API key required).

#### API Details
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Parameters:**
  - `name`: Search query (min 2 characters)
  - `count`: Max results (default: 5)
  - `language`: `en`
  - `format`: `json`

#### Data Contract
```ts
interface CitySuggestion {
  id: number;
  name: string;        // City name
  admin1?: string;     // State/province (optional)
  country: string;     // Country name
  lat: number;         // Latitude
  lon: number;         // Longitude
  timezone: string;    // IANA timezone (e.g., "Asia/Tashkent")
}
```

#### Search Behavior
- **Minimum characters:** 2 (returns empty before that)
- **Debouncing:** 300ms delay before API call
- **Abort:** Cancel pending requests when new input arrives
- **Results:** Max 8 suggestions displayed

#### Display Format
Cities displayed as: `City, State/Province, Country`
- Example: `Tashkent, Toshkent Shahri, Uzbekistan`
- If no admin1: `City, Country`

#### Modal UI Flow
```
┌─────────────────────────────────────────┐
│  Search City                       ✕    │
│  ───────────────────────────────────────│
│  ┌─────────────────────────────────────┐│
│  │ 🔍  tashk                           ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📍 Tashkent, Toshkent Shahri, UZ   ││
│  ├─────────────────────────────────────┤│
│  │ 📍 Tashkent, Toshkent, Uzbekistan  ││
│  ├─────────────────────────────────────┤│
│  │ 📍 Tashkentkent, Namangan, UZ      ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

#### Offline Behavior
- City search requires network — show "Search requires internet" message when offline
- Previously selected city remains cached and functional

6. Provide `refreshLocation()` for explicit re-fetch (e.g., for a manual retry button) and `clearCache()` helper for debugging (optional).

### Exposure API
The provider should expose via context/hooks:
- `location`: the latest `LocationState` (or `null` if not yet resolved).
- `status`: `'idle' | 'loading' | 'error'`.
- `error`: `string | null`.
- `isStale`: boolean (true when TTL expired but fallback still running).
- `refreshLocation()` to trigger geolocation/IP refetch.
- `manualLocation(payload: { lat: number; lon: number; city: string; timezone?: string })` for overrides.
- `clearLocationCache()` optional helper for debugging.

### Caching notes
- TTL: **24 hours** (86,400,000 ms). After this window, the next `getLocationState()` should start a background refresh but continue delivering the last known coordinates until the new payload arrives.
- Persistence strategy: write to `localStorage` atomically; fallback to in-memory state if `localStorage` is unavailable.
- When offline and TTL expired, keep `isStale` true and **do not** block sky rendering; once the network returns, `refreshLocation()` should revalidate automatically.

## 2. TimeProvider (`TimeProvider`, `useTime`)

### Responsibilities
- Maintain a ticking clock anchored to the cached timezone, updating every second.
- Derive solar cycle data (sunrise, sunset, solar noon, day length, dawn/dusk, azimuths) using `suncalc`.
- Compute prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha, etc.) via `adhan`, ensuring their dusk/dawn references can align with gradient transitions.
- Derive solar/prayer data on the fly when location/time changes.
- Provide helper selectors (`timeUntilNextEvent`, `nextPrayer`, etc.) for widgets and the sky engine.
- Operate gracefully offline by reading cached timezone offsets and advancing time via `performance.now()` deltas.

### Inputs
- `location`: consumption of `LocationProvider` output (lat/lon/timezone).
- `systemTime`: `Date.now()` (for fallback when `location` data is stale).

### Timezone Safety Note (CRITICAL)
When calculating solar/prayer times for a different timezone, the Date object is often "shifted" to represent the target wall-clock time (e.g. `10:00` in UTC to match `10:00` in Tokyo).
**Do NOT use `date.setUTCHours(12)` on shifted dates.**
If the user's system timezone is significantly offset (e.g. +14h vs -8h), mutating the timestamp can snap the Date object to the *previous or next calendar day* in UTC, causing `suncalc` to return data for the wrong day.

**Correct Pattern:**
Always construct the reference date explicitly using the wall-clock components of the target date:
```ts
const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
```

### Signals & Derived Data
Maintain a reactive object (via Solid signals) containing:
- `clock`: `Date` object representing the current local time in the resolved timezone.
- `cycle`: `'dawn' | 'day' | 'dusk' | 'night'` derived from solar times.
- `sunPosition`: normalized value [0,1] representing progress from sunrise to sunset; used to position sun along the arc.
- `moonPosition`: normalized value representing night progress; `0-1` when moon is ABOVE horizon (Rise→Set), and `1-2` when moon is BELOW horizon (Set→Rise).
- `moonPhase`: object containing illumination data (fraction, phase, angle) from suncalc.
- `solar`: object `{ sunrise, solarNoon, sunset, dusk, dawn, dayLength }` (ISO strings or timestamps).
- `prayer`: object with each prayer time ISO string/timestamp plus optional metadata (e.g., `isCurrent`, `timeUntil`) and `nextPrayer` pointer.
- `season`: derived string (`'winter' | 'spring' | 'summer' | 'autumn'`) based on local date and hemisphere heuristics.
- `isOffline`: boolean (true when no network and relying on cached location). Could be derived from `navigator.onLine` plus fetch attempts.

### Field naming conventions
- Use `dawn`/`dusk` for twilight bounds (matching `suncalc`), not `dawnEnd`/`duskStart`.
- Solar object should stay minimal and consistent: `{ sunrise, sunset, dawn, dusk, solarNoon, dayLength }`.

### Prayer Calculation Settings
Prayer times are calculated using the `adhan` library with configurable calculation methods.

**Default Method:** Muslim World League (`MuslimWorldLeague`)
**Default Madhab:** Shafi (shadow equals object length for Asr timing)

**Settings Storage:**
- Store user's preferred calculation method in `localStorage` under `waqt.settings`:
  ```json
  {
    "prayerMethod": "MuslimWorldLeague",
    "madhab": "Shafi"
  }
  ```

**Available Calculation Methods** (from adhan library):
- `MuslimWorldLeague` (default)
- `Egyptian`
- `Karachi`
- `UmmAlQura`
- `Dubai`
- `MoonsightingCommittee`
- `NorthAmerica` (ISNA)
- `Kuwait`
- `Qatar`
- `Singapore`
- `Tehran`
- `Turkey`

**Available Madhab** (for Asr calculation):
- `Shafi` (default) — shadow equals object length
- `Hanafi` — shadow equals twice object length

**API:**
- `getPrayerSettings()`: returns current settings
- `setPrayerSettings({ prayerMethod?, madhab? })`: updates settings and triggers `refreshTiming()`
- Settings changes should immediately recalculate prayer times

### Caching strategy
- **Timings (Solar/Prayer):** NOT cached in `localStorage`.
  - These are calculated synchronously on-the-fly whenever `LocationProvider` provides a location (including cached location on startup).
  - This avoids "poisoned cache" issues where stored timings desync from calculation logic.
  - Since `suncalc` and `adhan` are fast (<5ms), this does not impact startup performance.
- **Location:** `LocationProvider` handles caching of lat/lon/timezone (see above). This allows the app to start offline.

### Clock updates
- Use `setInterval` or `requestAnimationFrame` to update `clock` every second. When offline, compute `elapsedMs = performance.now() - lastPerfNow` and add it to the cached `clock` to avoid drift.
- Apply timezone offset using `Intl.DateTimeFormat` or `luxon` style calculations; avoid heavy timezone libs by leveraging the browser’s timezone API plus `Date` UTC methods.
- Provide a method `syncClock()` to immediately re-anchor to system time after a manual location override or refresh.

### Midnight Rollover
When the clock crosses midnight (00:00:00):
1. **Recalculate solar times** — Call `refreshTiming()` to compute new sunrise/sunset for the new day
2. **Recalculate prayer times** — New prayer schedule for the new day
3. **Season check** — If crossing into a new month, check if season changed
4. **Smooth transition** — No instant jumps; the sky gradient continues to interpolate normally (night remains night, just with new next-day values cached)

```ts
// Detect midnight crossing
let lastDate = clock.getDate();

function onTick(newClock: Date) {
  if (newClock.getDate() !== lastDate) {
    // Midnight crossed — new day!
    lastDate = newClock.getDate();
    refreshTiming(); // Recalculate for new day
  }
}
```

**Note:** The night progress widget doesn't reset at midnight — it continues tracking night until sunrise (since night spans two calendar days).

### Sky/Widget helpers
Expose functions such as:
- `timeUntilNextSolarEvent()` returning `{ label: string, seconds: number }` (sunset, sunrise, etc.).
- `currentCycleGradient()` returning a tuple of color tokens (`--gradient-start`, `--gradient-end`).
- `orbitProgress()` returning `{ sun: number, moon: number }` for the Sky Engine to convert into `translate` positions.
- `nextPrayer()` returning `{ name, time, secondsUntil }` for widgets to highlight.

### Error handling & fallback
- If the location data is missing or the providers throw, fall back to the system timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and continue ticking while marking `isOffline=true`.
- When `suncalc` or `adhan` cannot compute (e.g., owner/polar regions), degrade gracefully by estimating 12h day/night or hiding certain widgets.
- Keep `status` fields (`'idle' | 'calculating' | 'error'`) for UI so the bottom bar or widgets can show loaders.

### Exposure API
- `time`: the current `Date` object in the target timezone.
- `solar`: computed solar times.
- `prayer`: computed prayer schedule plus pointer to next prayer.
- `cycle`: current cycle state (`'dawn' | 'day' | 'dusk' | 'night'`).
- `orbit`: normalized progress for sun/moon positions.
- `moonPhase`: current moon illumination and phase data.
- `helpers`: { `timeUntilNextSolarEvent`, `nextPrayer`, `currentSeason`, `currentGradient`, `isOffline`, `isStale` }.
- `refreshTiming()` to force recalculation (should be called after manual location override or when TTL expires).

### Offline handling
- When offline, use cached timezone + last known `clock` to keep the time progressing via `performance.now()` deltas.
- Continue rendering the sky even without new solar/prayer calculations; re-queue `refreshTiming()` for when connectivity returns.
- If location data is empty and offline, show fallback UI (default gradient, system clock) but prompt the user to restore connectivity.

## Integration notes
- `LocationProvider` and `TimeProvider` should be provided together so components can access a single context or hook to proceed with data. Example:
  ```ts
  const locationContext = useLocation();
  const timeContext = useTime(locationContext.location);
  ```
- Sky Engine reacts to `timeContext.cycle`, `timeContext.orbit`, and gradient helper tokens.
- Widgets subscribe to `timeContext.solar`, `timeContext.prayer`, `locationContext.city`, etc.
- Manual override flows call `locationContext.manualLocation(...)` and then `timeContext.refreshTiming()` once the new location resolves.

## Loading & Fallback States

### Initial Load (No Cached Location)
When the app loads for the first time with no cached location:

**What works (using browser/system data):**
- ✅ Main clock — uses `Date.now()` with system timezone
- ✅ Date display — derived from system date
- ✅ Season widget — based on calendar date (no location needed)
- ✅ **Smart Sky Fallback** — The Sky Engine must **immediately** render an approximate sky based on the system hour:
  - If `06:00 <= hour < 18:00`: Render **Day** cycle.
  - If `18:00 <= hour < 06:00`: Render **Night** cycle.
  - Sun/Moon position should be roughly interpolated (e.g. Noon = center, Midnight = center moon).
  - **CRITICAL**: Do NOT default to "Noon/Day" if the system time is 22:00. This avoids the "flash of noon" on night loads.

**What requires location:**
- ❌ Prayer times — `adhan` library needs lat/lon to calculate
- ❌ Accurate solar times — `suncalc` needs lat/lon
- ❌ Progress widget times — depends on accurate sunrise/sunset

### Fallback UI for Location-Dependent Widgets
When location is unavailable, show:
- Prayer widget: "Set location to see prayer times" with location icon
- Solar times widget: "Set location to see times"
- Progress widget: Show approximate progress bar, but label as "Approximate"

### Geolocation + IP Lookup Both Fail
If both location methods fail:
1. Continue showing clock, date, season (all work without location)
2. Show approximate sky (6am-6pm day cycle)
3. Prompt user to manually select city via bottom bar button
4. Widgets display fallback messages (not errors)

### Offline After Initial Load
If location was previously cached but network is now unavailable:
- Use cached location data — all features work normally
- Set `isStale: true` if cache TTL expired
- Refresh automatically when network returns

## Future extensions
- Add support for storing a list of favorite locations (timestamped) inside `LocationProvider` for quick switching.
- Expose events (`onLocationChange`, `onTimingChange`) for analytics or debug tooling.
- Add integration tests that mock geolocation and validate TTL behavior.
