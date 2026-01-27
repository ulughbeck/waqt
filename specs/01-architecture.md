# Architecture Overview

## Scope
- Deliver a responsive **Single Page Application (SPA)** that centers on an immersive sky visualization (curved horizon, orbit path, dynamically positioned sun/moon, gradient sky) reflecting the local time for desktop, mobile, and tablet breakpoints.
- **SPA mode with Client-Side Rendering:** The application runs entirely in the browser to ensure instant access to user preferences (localStorage) and seamless offline behavior.
- Provide a clean foundation for modular widgets built atop the core scene using shared primitives (time, location, day/night metadata, season information).
- Ensure the experience works offline for the core clock/sky once time zone and location data are known and cached.

## High-level requirements recap
1. The sky scene must adapt arc curvature, horizon height, sun/moon sizing, and clock placement per screen aspect ratio (desktop vs portrait mobile) while matching mockup cues.
2. Local time must be derived from the system clock combined with resolved timezone data, which should come from browser geolocation when permitted and fall back to an IP lookup otherwise.
3. Users must be able to manually override the cached location/timezone via the floating location trigger.
4. Widgets are modular and sit below the horizon (dashboard area) consuming shared primitives but never impeding the immersive sky experience.
5. Styling must rely on vanilla CSS (global plus component-scoped per SolidStart conventions); no utility frameworks such as Tailwind.
6. The SolidStart PWA shell must include a manifest and service worker to cache the core experience for offline use.

## Tech stack
- **Framework:** SolidStart (configured for **SPA/CSR** mode) for routing, state management, and PWA capabilities.
- **Bundler & build:** Vite (embedded in SolidStart) with Solid-specific plugins.
- **Styling:** Vanilla CSS via `.css` files imported in components or the global entry (`src/app.css`).
- **Data APIs:** Browser Geolocation API with a fallback IP-based lookup (e.g., `https://ipwho.is`) for users who deny permission or are offline.
- **Storage:** `localStorage` for cached location/timezone/city metadata and visitation timestamps.
- **Computation libs (Key):** `suncalc` for solar times/azimuths and `adhan` for prayer-time calculations (Fajr, Dhuhr, Asr, Maghrib, Isha, etc.).
- **Rendering primitives:** SVG (and minimal canvas/pseudo-elements if necessary) to draw the curved horizon, arc orbit, and sky gradients.
- **PWA assets:** `manifest.webmanifest`, service worker generated via **`vite-plugin-pwa`**, caching the shell bundle and optional API responses.

## Component decomposition & responsibilities

### 1. **Sky Engine (`SkyScene` + helpers)**
- **`SkyScene`** renders the viewport area above the horizon, adjusting its height, curvature, and arc radius responsively across breakpoints.
- **`Orbiter`** translates the normalized solar time into sun and moon positions along an arc, reflecting the current orbit progress.
- **`SkyGradient`** switches between dawn/day/dusk/night color palettes and optionally exposes CSS variables for widget theming.
- **`HorizonCurve`** draws the curved horizon (via SVG path or CSS) and clips the sky render, keeping a clear separation between sky and dashboard.
- **Parallax Effect**: The Sky Scene moves slower than the foreground dashboard content during scrolling to create depth (see `specs/06-dashboard.md`).

### 2. **Location Provider (`LocationProvider`, `useLocation`)**
- Responsible for resolving and caching user coordinates/timezone/city via geolocation with an IP-based fallback, persisting the payload, and offering manual overrides while exposing status helpers.
- Caching and refresh behavior is defined in detail in `specs/04-providers.md`, which also lists the exact `localStorage` payload shape, TTL, and API contract for downstream consumers.

### 3. **Time Provider (`TimeProvider`, `useTime`)**
- Consumes the location state, maintains a ticking clock, derives solar/prayer milestones (via `suncalc`/`adhan`) on the fly, and exposes helper selectors for widgets and sky logic.
- The precise data model, caching strategy, offline fallback behavior, and selectors are documented in `specs/04-providers.md` so downstream components know exactly what to expect.

### 4. **Widget Layer (`WidgetGrid`, `WidgetCard`, etc.)**
- Renders the dashboard grid directly below the horizon with consistent padding; the exact layout will be detailed in the design spec.
- Each widget subscribes to the shared time+location context and is responsible for its internal styling and content (sunset, night start, season, prayer, etc.).
- Widgets remain optional; adding or reordering them should not affect the core sky rendering.

### 5. **UI chrome (floating location trigger)**
- A single floating pill button centered at the bottom of the viewport.
- The pill launches the manual location override flow supplied by the `LocationProvider`.

### 6. **PWA shell**
- The SolidStart layout wraps `SkyScene` + the dashboard, sets metadata, and registers the service worker.
- `manifest.webmanifest` defines icons, theme colors, display mode, and start URL for installability.
- The service worker caches JS/CSS bundles, fonts, static imagery, and optionally cached location responses so the core sky experience remains responsive offline.

## Data Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `waqt.settings` | JSON | Prayer method and madhab (managed by Prayer Widget) |
| `waqt.location` | JSON | Cached location data (managed by Location Provider) |
| `waqt.debug` | JSON | Debug mode state and overrides |
| `waqt.layout` | JSON | Dashboard widget order and sizes |

## Modular Architecture Principle

**Each component is self-sufficient and depends only on context providers, not on each other.**

### Component Independence
- **Sky Engine** subscribes to `TimeProvider` for cycle, orbit, and solar data — it does NOT depend on widgets
- **Each Widget** subscribes to `TimeProvider` and/or `LocationProvider` for its specific data — widgets do NOT depend on each other
- **Location Trigger** subscribes to `LocationProvider` for city name — it does NOT depend on sky or widgets

### Benefits
- Components can be developed/tested in isolation
- Adding/removing a widget doesn't affect other components
- State changes flow down from providers; no cross-component communication needed

### Provider → Consumer Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT PROVIDERS                        │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ LocationProvider │    │   TimeProvider   │              │
│  └────────┬─────────┘    └────────┬─────────┘              │
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌────────────────────────────────────────────────────────┐│
│  │              CONSUMERS (independent)                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │Sky Engine│ │Prayer Wgt│ │Solar Wgt │ │Season Wgt│  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  │  ┌──────────┐ ┌──────────┐                            ││
│  │  │Progress  │ │Location  │                            ││
│  │  │          │ │Trigger   │                            ││
│  │  └──────────┘ └──────────┘                            ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Data & dependency flow

```
[Browser/System Clock]     [Geolocation / IP lookup]
         |                         |
(time passes)             resolves lat,lon,timezone,city
         |                         |
         +----- [Location Provider] -----+
                    |            |
                    |   exposes location state
                    |            |
               [Time Provider] (uses location)
                    |
              provides derived signals
                    |                                     |
              [Sky Engine] <-- uses cycle + orbit info
                    |
             [Widgets + UI chrome] (consume time/location helper signals)
```

- **Dependency graph:**
  - The `LocationProvider` feeds the `TimeProvider`.
  - `TimeProvider` outputs (solar/prayer/cycle data) feed the `Sky Engine` and widgets.
- Widgets and UI chrome (location trigger) consume signals but do not alter them.
- The service worker is an orthogonal dependency that caches shell assets and optionally location caches.

## Resilience & offline considerations
- The service worker caches the static shell (HTML, JS, CSS, fonts, icons) for immediate load while offline.
- `localStorage` keeps the last validated `{ lat, lon, timezone, city }` so the sky can continue to render when no network is available.
- If the cache expires (1–3 days) while offline, the UI should continue to show the last-known values until connectivity returns.
- Derived data is recomputed on the fly when needed; no persistent timing cache is maintained.
- Manual overrides allow users to update their location even if the automatic geolocation failed earlier.
- On first launch with no cached location, the UI falls back to the system timezone and prompts for permission, optionally showing a notice if the sky cannot fully align without coordinates.
