# Sky Engine Specification

This document defines the core visual experience: the immersive sky with a curved horizon, orbit path, sun/moon movement, and responsive gradients. It builds on the provider signals (time, solar cycle, location) described in `specs/04-providers.md` and uses the design tokens/layout guidance from `specs/03-design-system.md`.

---

## Quick Reference

| Property | Value | Section |
|----------|-------|---------|
| **Sky height** | 40% (mobile), 42% (desktop) | [Responsiveness](#responsiveness--layout) |
| **Horizon curve** | 1.5% (mobile) to 5% (desktop) | [Horizon Geometry](#horizon-geometry) |
| **Orbit arc ratio** | Width:Height = 1:1 (heightRatio = 1.0) | [Arc Geometry](#arc-geometry--flattened-ellipse) |
| **Orbit width** | 80% (mobile), 56% (desktop) | [Calculation Formula](#calculation-formula) |
| **Sun size** | 48px (mobile), 64px (desktop) | [Responsiveness](#responsiveness--layout) |
| **Moon size** | 28px (mobile), 38px (desktop) | [Responsiveness](#responsiveness--layout) |
| **Horizon magnification** | 1.0× at noon, 1.25× at horizon | [Horizon Magnification](#horizon-magnification-effect) |
| **Sun glow size** | `clamp(200px, 25vw, 400px)` | [Sun Atmospheric Glow](#sun-atmospheric-glow) |
| **Stars count** | 40-60, sizes 1-3px, opacity 0.3-0.8 | [Stars](#stars) |
| **Gradient transition** | 30-45 minutes between cycles | [Smooth Interpolation](#smooth-interpolation-between-cycles) |
| **Clock position** | Inside arc (desktop), above arc (mobile) | [Clock Positioning](#clock-positioning-by-breakpoint) |

### Key Formulas
```ts
// Orbit position
const angle = Math.PI * (1 - progress);
const sunX = centerX + radiusX * Math.cos(angle);
const sunY = horizonY - radiusY * Math.sin(angle);

// Altitude (for color/size calculations)
const altitude = Math.sin(orbitProgress * Math.PI); // 0 at horizon, 1 at noon

// Horizon magnification
const scale = 1 + 0.25 * (1 - altitude); // 1.0 → 1.25
```

---

## Responsibilities
 - Render the sky from horizon to top of viewport, adapting height and curvature per breakpoint.
- Compute and display sun/moon positions along an arc that correlates with the current solar cycle progress.
- Transition the background gradient, glow, and sky details (stars, noise) as time progresses through the day/night cycle.
- Expose CSS custom properties so widgets/bottom chrome can read dynamic values if needed.
- Maintain performance via requestAnimationFrame (or `solid-js` signals) while syncing to the `TimeProvider` tick.

## Inputs
Sky Engine consumes the following signals from `TimeProvider`/`LocationProvider`:
- `clock`: the current Date localized to the resolved timezone.
- `cycle`: `'dawn' | 'day' | 'dusk' | 'night'` from `TimeProvider`.
- `orbit`: normalized progress `{ sun: number, moon: number }` (0-1 along arc). Moon progress can exceed 1.0 (1.0-2.0) to indicate it is below the horizon.
- `solar`: `{ sunrise, sunset, dawn, dusk, solarNoon }` with timestamps.
- `prayer`/`helpers`: optional (e.g., `nextPrayer` for highlighting widget states) but not strictly required for the Sky Engine.
- `season`: `'winter' | 'spring' | 'summer' | 'autumn'` for ambient tweaks if needed.
- `location.city`: for the bottom bar label; not strictly part of the sky but accessible for text overlays.

## Mockup references
- The attached mockups show the three dominant cycle states we must match: a warm sunset board when the sun sits on the horizon with the clock at 7:57:30pm (`Image #1`), a clear bright daytime view around 11:05am standing in the middle of the arc (`Image #2`), and the deep night scene with the moon rising and text showing `3:12:33` (`Image #3`). The mobile frame in `Image #4` reinforces the day panel layout for portrait mode.
- Use these frames to validate the gradient transitions, clock positioning, and glow/stars layering rather than inventing alternative layouts; the orbital path, horizon thickness, and sun/moon proportions shown are the fidelity target for the sky engine.

## Orbiter & Positioning

### Arc Geometry — Semi-Circular Arc
**The orbit path is a semi-circular arc (1:1 ratio)** to match the grand, immersive sky perspective seen in the mockups.

#### Measurements
- The orbit arc spans approximately **80% (mobile/tablet) or 56% (desktop) of the viewport width**
- The peak (solar noon) reaches **the full radius height**, forming a perfect semicircle.
- **Aspect Ratio:** 1:1 (Width:Height for the arc) for a true semi-circular shape.

#### Calculation Formula
Given:
- `viewportWidth` = current screen width (using `clientWidth` to exclude scrollbar for precise centering)
- `orbitMaxWidth` = **950px** (Cap width to stay within dashboard limits on desktop)
- `heightRatio` = **1.0** (Semi-circular)

**Vertical Safety Constraint:**
To prevent the orbit from colliding with the top `SkyDate` element or being clipped, the vertical radius (`radiusY`) must be constrained by the available sky height minus padding.
- `maxRadiusY = skyHeight - 80px` (approx padding for Date/Status bar)

**Responsive Radius Calculation:**
1. **Base Width:**
   - **Mobile/Tablet (≤1024px):** `radiusX = viewportWidth * 0.40` (Orbit spans 80% of screen)
   - **Desktop (>1024px):** `radiusX = viewportWidth * 0.28` (Orbit spans 56% of screen)

2. **Apply Constraints:**
   - `radiusX = Math.min(radiusX, 475)` (Max width cap)
   - `radiusX = Math.min(radiusX, skyHeight - 80)` (Vertical fit cap, since radiusX = radiusY for semicircle)

3. **Final Dimensions:**
   - `radiusY = radiusX` (perfect semi-circle)

#### Step-by-Step Example Positions
```
progress = 0   (sunrise):
  angle = π * (1 - 0) = π
  sunX = centerX + radiusX * cos(π) = centerX - radiusX  (left edge)
  sunY = horizonY - radiusY * sin(π) = horizonY - 0       (at horizon)

progress = 0.5 (noon):
  angle = π * (1 - 0.5) = π/2
  sunX = centerX + radiusX * cos(π/2) = centerX + 0       (centered)
  sunY = horizonY - radiusY * sin(π/2) = horizonY - radiusY (high peak)

progress = 1   (sunset):
  angle = π * (1 - 1) = 0
  sunX = centerX + radiusX * cos(0) = centerX + radiusX   (right edge)
  sunY = horizonY - radiusY * sin(0) = horizonY - 0        (at horizon)
```

#### Position Calculation
```ts
// 1. Determine base radius based on breakpoint
const isDesktop = viewportWidth > 1024;
const radiusMultiplier = isDesktop ? 0.28 : 0.40;
let radiusX = viewportWidth * radiusMultiplier;

// 2. Apply hard cap (950px width = 475px radius) and vertical constraint
radiusX = Math.min(radiusX, 475, skyHeight - 80);

// 3. Calculate vertical radius (semi-circular)
const radiusY = radiusX;

// Center point
const centerX = viewportWidth / 2;
const horizonY = skyHeight;

// Position calculation for any progress value (0-1)
const angle = Math.PI * (1 - progress);       // π at sunrise (left), 0 at sunset (right)
const sunX = centerX + radiusX * Math.cos(angle);
const sunY = horizonY - radiusY * Math.sin(angle);  // Subtract because Y increases downward
```

## Curved Horizon & Clipping

### Horizon Geometry
**The horizon uses a gentle SVG Bezier curve** — this provides precise control to match the "planetary hill" aesthetic seen in mockups, which a simple CSS border-radius cannot achieve reliably across aspect ratios.

#### Curvature by Breakpoint
The curve should be a subtle, wide convex arc.

| Breakpoint | Curvature Depth | Implementation |
|------------|-----------------|----------------|
| **Desktop** | **~10-12%** of sky height | SVG Quadratic Bezier |
| **Mobile** | **~5-8%** of sky height | SVG Quadratic Bezier |

**Implementation:**
- Use an inline SVG for the horizon.
- Path: `M 0,Height Q Width/2,Height-CurveDepth Width,Height L Width,Height L 0,Height Z` (conceptually).
- This ensures the "hill" shape is preserved perfectly.

### Horizon Rim Light & Optical Bloom
**The horizon should feel like a light source bleeding over the edge of the earth, not just a sharp line.**
- **Rim Light:** A thin glowing line along the curve.
- **Optical Bloom:** Use `backdrop-filter: blur()` or a layered "fog" element at the horizon line to soften the hard clip between the sky and the black earth. This simulates distant atmospheric scattering.
- **Ambient Reflection:** The top edge of the "Earth" (dashboard background) should catch a subtle ambient reflection of the sky's color (e.g., faint orange during dusk, cool blue at night) to visually ground the sky.

```css
.horizon-curve::before {
  /* Ambient bloom */
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 20px;
  background: inherit;
  filter: blur(8px);
  opacity: 0.5;
}
```

## Z-Index Layering Order

**Critical for proper visual stacking.** Elements are listed from back (lowest) to front (highest):

```
Layer 0:  Sky Gradient Background     ← Furthest back
Layer 1:  Horizon Atmosphere Glow     ← Diffuse glow at horizon level
Layer 2:  Stars                       ← Behind everything except gradient
Layer 3:  Orbit Path (dotted line)    ← Reference line for sun/moon
Layer 4:  Sun/Moon Glow               ← Large atmospheric glow BEHIND the orb
Layer 5:  Sun/Moon Orb                ← The actual celestial body
Layer 6:  Clock (Date + Time)         ← Always readable, on top of sky elements
Layer 7:  Horizon Curve               ← Clips the sky, creates earth/sky boundary
------- HORIZON LINE -------
Layer 10: Dashboard Background        ← Pure black earth
Layer 11: Widget Cards                ← Floating on the dark earth
Layer 12: Bottom Bar                  ← Navigation/controls
```

### CSS Implementation
```css
.sky-scene {
  position: relative;
  z-index: 0;
}

.sky-gradient      { z-index: 0; }
.sky-atmosphere    { z-index: 1; }
.sky-stars         { z-index: 2; }
.sky-orbit-path    { z-index: 3; }
.sun-glow,
.moon-glow         { z-index: 4; }
.sun,
.moon              { z-index: 5; }
.sky-clock         { z-index: 6; }
.horizon-curve     { z-index: 7; }

/* Dashboard is a separate stacking context */
.dashboard {
  position: relative;
  z-index: 10;
}
```

### Why Glow is BEHIND the Orb
The atmospheric glow (large, diffuse light) should be behind the sun/moon disc:
- Creates depth: sun appears to be a solid object with light emanating from behind
- Prevents glow from washing out the sun's defined edge
- More physically accurate: we see the sun's surface, not through it

## Sky Effects

### Photorealistic Atmospheric Glow

**CRITICAL: The sky must have a photorealistic atmospheric glow effect, especially around the sun/moon near the horizon.**

The mockups show a cinematic, atmospheric quality where:
- The sun/moon has a large, soft radial glow that blends into the sky
- The glow intensifies near the horizon, creating a "golden hour" effect
- The atmosphere appears to scatter light realistically

#### Sun Atmospheric Glow
**Glow sizes use viewport-relative units with clamps for responsive scaling.**

```css
.sun-glow {
  position: absolute;
  /* Responsive sizing: scales with viewport, has min/max bounds */
  width: clamp(200px, 25vw, 400px);
  height: clamp(200px, 25vw, 400px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 100, 0.6) 0%,
    rgba(255, 150, 50, 0.3) 30%,
    rgba(255, 100, 50, 0.1) 60%,
    transparent 100%
  );
  transform: translate(-50%, -50%);
  pointer-events: none;
  mix-blend-mode: screen;
}

/* Intensify glow when sun is near horizon (low in sky) */
.sun-glow--horizon {
  width: clamp(250px, 35vw, 500px);
  height: clamp(125px, 18vw, 250px); /* Elliptical, stretched horizontally */
  background: radial-gradient(
    ellipse,
    rgba(255, 140, 60, 0.8) 0%,
    rgba(255, 100, 40, 0.4) 40%,
    rgba(200, 60, 30, 0.2) 70%,
    transparent 100%
  );
}
```

#### Moon Atmospheric Glow
```css
.moon-glow {
  position: absolute;
  width: clamp(150px, 18vw, 280px);
  height: clamp(150px, 18vw, 280px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(200, 220, 255, 0.4) 0%,
    rgba(150, 180, 220, 0.2) 40%,
    transparent 100%
  );
  transform: translate(-50%, -50%);
  pointer-events: none;
}
```

#### Horizon Atmosphere Effect
The horizon should have an additional atmospheric glow layer that creates the "light scattering" effect seen in real skies:

```css
.sky-atmosphere {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%; /* Covers lower portion of sky */
  pointer-events: none;
}

/* Dawn/Dusk: Warm orange/pink atmosphere */
.sky-atmosphere--dusk {
  background: radial-gradient(
    ellipse 100% 60% at 50% 100%,
    rgba(255, 100, 50, 0.4) 0%,
    rgba(255, 80, 60, 0.2) 30%,
    rgba(100, 50, 80, 0.1) 60%,
    transparent 100%
  );
}

/* Day: Subtle bright haze at horizon */
.sky-atmosphere--day {
  background: radial-gradient(
    ellipse 100% 40% at 50% 100%,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(200, 220, 255, 0.08) 50%,
    transparent 100%
  );
}

/* Night: Cool blue/purple atmosphere */
.sky-atmosphere--night {
  background: radial-gradient(
    ellipse 100% 50% at 50% 100%,
    rgba(30, 50, 100, 0.3) 0%,
    rgba(20, 30, 60, 0.15) 50%,
    transparent 100%
  );
}
```

### Stars
**Stars should be distributed evenly across the entire sky area with varying brightness and subtle twinkle.**

#### Distribution
- Use a `::before`/`::after` pseudo-element with randomly positioned dots
- Stars are **randomly generated on page load** (not continuously changing positions)
- Distributed **evenly across the full sky area** (not just upper portion)
- Quantity: ~40-60 stars for subtle effect

#### Visual Variation
- **Varying sizes:** 1-3px diameter (most are 1-2px, few larger "bright" stars)
- **Varying opacity:** 0.3-0.8 range for depth effect
- **Varying brightness:** Some stars appear brighter (higher opacity + slightly larger)

#### Twinkle Effect
Add subtle twinkle animation to a subset of stars:
```css
@keyframes twinkle {
  0%, 100% { opacity: var(--star-base-opacity); }
  50% { opacity: calc(var(--star-base-opacity) * 0.5); }
}

.star--twinkle {
  animation: twinkle 2-4s ease-in-out infinite;
  animation-delay: var(--star-delay); /* Random delay per star */
}
```

- Apply twinkle to ~20-30% of stars
- Randomize animation duration (2-4s) and delay per star
- Keep twinkle subtle — opacity variation, not position movement

#### Visibility by Cycle
- **Night:** Fully visible (opacity: 1)
- **Dusk:** Fade in gradually (opacity: 0 → 1)
- **Dawn:** Fade out gradually (opacity: 1 → 0)
- **Day:** Hidden (opacity: 0)
- Animate using `transition: opacity 0.8s var(--ease-smooth);`

#### Atmospheric Extinction (Horizon Fade)
**Stars near the horizon should be dimmer/invisible** — simulating how Earth's atmosphere scatters more light near the horizon.

```ts
function getStarOpacity(baseOpacity: number, starY: number, skyHeight: number): number {
  // starY: 0 = top of sky, skyHeight = horizon
  const normalizedY = starY / skyHeight; // 0 at top, 1 at horizon
  
  // Stars in bottom 30% of sky fade out
  const horizonFadeStart = 0.7;
  if (normalizedY > horizonFadeStart) {
    const fadeProgress = (normalizedY - horizonFadeStart) / (1 - horizonFadeStart);
    return baseOpacity * (1 - fadeProgress); // Fade to 0 at horizon
  }
  
  return baseOpacity;
}
```

#### Star Distribution Adjustment
To complement atmospheric extinction:
- **Fewer stars generated near horizon** — reduce density in bottom 20% of sky
- **Brighter/larger stars in upper sky** — more prominent stars visible at zenith

```ts
const stars = Array.from({ length: 50 }, () => {
  // Bias Y position toward upper sky (fewer near horizon)
  const y = Math.pow(Math.random(), 1.5) * 100; // Power curve biases toward 0 (top)
  
  return {
    x: Math.random() * 100,
    y,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.5,
    twinkle: Math.random() < 0.25,
  };
});
```

### Moon Glow
- Draw a `box-shadow` or radial gradient behind the moon
- Glow intensity varies with moon position (brighter when higher in sky)

### Optional Noise/Grain
- Add an `::after` layer with subtle noise texture to simulate atmospheric grain
- Toggle per cycle state (more visible at dusk/dawn)

### Responsive Adjustments
- Sky height and horizon curvature change with breakpoints (Design System tokens)
- Use media queries to adjust `--sky-height`, `--arc-radius`, `--sun-size`, and `--moon-size`
- Atmospheric glow sizes should scale proportionally

## Responsiveness & Layout
- Sky container should have `min-height: var(--sky-height, 40vh)` and `position: relative;` so sun/moon absolutely position relative to it.
- **Initialization:** To prevent "jumping" artifacts (orbit defaulting to 1200px then snapping to real width), the SkyOrbiter must:
  - Be hidden (`opacity: 0`) initially.
  - Measure the client dimensions immediately on mount.
  - **Crucially:** Wait for a render cycle (e.g., via `requestAnimationFrame`) *after* measuring before setting `opacity: 1`. This ensures the reactive graph has fully propagated the new dimensions to the SVG `d` attribute before it becomes visible. Synchronous updates inside `onMount` can sometimes be batched or race with hydration, leaving the path visually stuck on default values despite the signal being updated.
- For mobile: set `--sky-height: 40vh`, `--sun-size: 48px`, `--moon-size: 28px`, `--orbit-radius: 40vw`, `--clock-font-size: clamp(2rem, 8vw, 4.8rem)`.
- For desktop: `--sky-height: 42vh`, `--sun-size: 64px`, `--moon-size: 38px`, `--orbit-radius: 28vw`, `--clock-font-size: clamp(2.4rem, 5vw, 4.8rem)`.
- The orbit radius should be **large relative to the sky area** — the arc should span most of the horizontal width.
- Adjust the arc center Y position to keep the orbit visually aligned with the horizon; the `SkyScene` component recalculates center coordinates when the viewport resizes (via `ResizeObserver` or CSS variables tied to `width`).

### Clock Component Split
**Split `SkyClock` into two separate components for flexible positioning:**

1. **`SkyDate`** — Displays the date ("Wednesday, Jan 15")
   - **Always positioned at the top of the sky area**, independent of the clock's position.
   - Centered horizontally.
   - Fixed distance from top (respecting safe area).
   - **Styling:**
     - Uppercase, tracked out (`letter-spacing: 0.1em`).
     - Font size: `1rem` (or slightly larger on desktop).
     - Color: White with opacity (e.g., `rgba(255, 255, 255, 0.9)`).
     - Text Shadow: Subtle shadow to ensure readability against bright clouds/sky.

2. **`SkyTime`** — Displays the time ("13:36:54")
   - Large, prominent font
   - **Position depends on screen aspect ratio / breakpoint**

### Clock Positioning by Breakpoint

**The clock position is determined by screen width.** It must sit **visually inside** the orbit arc on desktop.

#### Desktop / Wide Screens (>1024px): Clock INSIDE the Arc
```
┌─────────────────────────────────────────────────────┐
│              Wednesday, Jan 15                      │  ← SkyDate (top)
│                                                     │
│         ╭ · · · · · · · · · · · · · · ╮             │  ← Orbit arc
│        ╱                               ╲            │
│       ╱                                 ╲           │
│      ☀️          13:36:54               ╲           │  ← SkyTime INSIDE (vertically centered/low)
│     ╰───────────────────────────────────────╯       │  ← Horizon
└─────────────────────────────────────────────────────┘
```

#### Tuning Values
To ensure the clock sits under the arc:
- **Desktop:**
  - Sky Height: 42vh
  - Clock Top Offset: **35-40%** (pushed down from 25%)
  - Font Size: **~5rem** (balance visibility)
- **Mobile:**
  - Clock Top Offset: **15%** (above arc)

#### CSS Implementation
```css
.sky-time {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  
  /* Desktop: inside the arc */
  top: var(--clock-top-offset, 40%); 
}
```

## Moon Visibility Logic

**Use realistic visibility:** The moon can be visible during daytime, especially during dawn/dusk and when the moon is in certain phases (gibbous, near-full).

### Real-World Moon Visibility
In reality, the moon is often visible during the day:
- **Near full moon:** Rises around sunset, visible in morning sky
- **Near new moon:** Rises/sets with sun, not visible
- **First/last quarter:** Visible for roughly half the day

### Simplified Visibility Model
For our purposes, we'll use a **time-based visibility** that creates realistic overlap:

| Time Period | Moon Visibility | Rationale |
|-------------|-----------------|-----------|
| **Night** (sunset+1h → sunrise-1h) | Fully visible (100%) | Primary moon viewing time |
| **Dusk** (sunset → sunset+1h) | Fading IN (0% → 100%) | Moon becomes visible as sky darkens |
| **Dawn** (sunrise-1h → sunrise) | Fading OUT (100% → 50%) | Moon still partially visible in brightening sky |
| **Early Day** (sunrise → sunrise+2h) | Fading OUT (50% → 0%) | Moon may linger in morning sky |
| **Mid-Day** (sunrise+2h → sunset-1h) | Hidden (0%) | Too bright to see moon |
| **Pre-Dusk** (sunset-1h → sunset) | Optional: faint (0-20%) | Moon may appear before sunset |

### Implementation
```ts
function getMoonOpacity(
  currentTime: Date,
  solar: { sunrise: Date, sunset: Date }
): number {
  const now = currentTime.getTime();
  const sunrise = solar.sunrise.getTime();
  const sunset = solar.sunset.getTime();
  
  const HOUR = 60 * 60 * 1000;
  
  // Night: fully visible
  if (now > sunset + HOUR || now < sunrise - HOUR) {
    return 1.0;
  }
  
  // Dusk transition: fade in over 1 hour after sunset
  if (now >= sunset && now <= sunset + HOUR) {
    const progress = (now - sunset) / HOUR;
    return progress; // 0 → 1
  }
  
  // Dawn transition: start fading at sunrise-1h
  if (now >= sunrise - HOUR && now < sunrise) {
    return 1.0; // Still fully visible during dawn
  }
  
  // Early morning: fade out over 2 hours after sunrise
  if (now >= sunrise && now <= sunrise + 2 * HOUR) {
    const progress = (now - sunrise) / (2 * HOUR);
    return 1.0 - progress; // 1 → 0
  }
  
  // Mid-day: hidden
  return 0;
}
```

### Moon Phase Rendering (Hemisphere Support)
**The visual representation of the moon phase depends on the observer's hemisphere.**
- **Northern Hemisphere (Lat >= 0):** Waxing (Phase < 0.5) is Lit on the **RIGHT** side.
- **Southern Hemisphere (Lat < 0):** Waxing (Phase < 0.5) is Lit on the **LEFT** side.

**Implementation Logic:**
1.  **Base Calculation (Northern):** Implement standard phase logic where `Waxing = Right Lit`.
2.  **Hemisphere Flip:** Access `location.lat` in `SkyOrbiter`.
    - If `lat < 0`, apply a CSS flip to the moon container: `transform: scaleX(-1)`.
    - This creates the correct visual inversion for Southern locations (e.g., Sydney) without complex SVG path math changes.

### Parallactic Angle (Moon Rotation)
The moon should appear rotated relative to the horizon, not just strictly vertical. This is determined by the **Parallactic Angle** (the angle between the zenith and the celestial pole at the moon's position).
- When the moon rises, the "bright side" typically points somewhat **down/right** (in N. Hemisphere).
- When the moon sets, it points **down/left**.

**Implementation:**
- Use `suncalc`'s `getMoonIllumination(date).angle` which returns the rotation angle relative to the zenith.
- Note: `suncalc` returns radians. Convert to degrees: `angleDeg = (angle - phaseAngle) * (180/Math.PI)`.
- Apply this rotation to the moon container using `transform: rotate(...)`.
- This ensures the crescent "points" towards the sun's position below the horizon, creating a realistic celestial geometry.
When both sun and moon are visible (dawn/dusk):
- Moon appears more translucent (lower opacity)
- Moon glow is reduced to prevent competing with sun
- Creates natural "daytime moon" appearance

```css
.moon--daytime {
  opacity: var(--moon-opacity);
  filter: brightness(0.8); /* Slightly dimmer during day */
}

.moon-glow--daytime {
  opacity: calc(var(--moon-opacity) * 0.3); /* Much reduced glow */
}
```

## Interactions & Animations
- Sun/moon `transform` updates should run via CSS `translate(var(--sun-x), var(--sun-y))` to keep GPU acceleration.
- Provide a layered orbit path (`<circle>` or `border`) that can highlight upcoming solar events; optionally animate the path color near sunrise/sunset.
- The Sky Engine watches `cycle` and `orbit` changes (Solid signals) and updates CSS variables using `requestAnimationFrame` to keep animation smooth.
- When transitioning between day/night, fade the stars in/out and adjust sky gradient colors simultaneously.
- Moon opacity should be controlled via CSS variable (`--moon-opacity`) updated by the visibility logic above.

## API to widgets/chrome
- Expose CSS variables for: `--sun-x`, `--sun-y`, `--moon-x`, `--moon-y`, `--sky-gradient-start`, `--sky-gradient-end`, `--sky-cycle`, `--sky-season`, `--clock-top-offset`, `--clock-font-size`.
- Provide a JS hook context (e.g., `useSkyTheme()` or similar) that returns the current gradient colors and cycle for widgets to consume (optional but helpful for UI synchronization).
- Expose event hooks such as `onOrbitUpdate` for animations or interactions triggered when the sun enters golden hour.

## Error handling & fallback
- If provider data is missing (no location/time), fall back to default gradient/clock (system timezone). Use `sunPosition = 0.5` and `cycle = 'day'` to keep the interface at least informative.
- When offline, keep orbit positions running based on cached `orbit` data, and only shift to default if no cached data exists.

## Performance Considerations

### Animation Budget
- **Target:** 60fps smooth animation
- **Tick rate:** Update sun/moon position every second (not every frame)
- **CSS transitions:** Use CSS for smooth interpolation between JS-computed positions
- **GPU acceleration:** All moving elements use `transform` (not `top`/`left`)

### Rendering Optimization
- Gradients: Update CSS custom property, let browser handle gradient rendering
- Stars: Generate once on page load, toggle visibility via opacity
- Glows: Use `will-change: transform, opacity` for glow layers

### What NOT to Animate Every Frame
- Gradient colors (update every minute or on cycle change)
- Star positions (static after initial render)
- Orbit path (static, never changes)

### Tab Visibility Handling
When the browser tab is hidden (user switches tabs or minimizes):
- **Pause:** Stop `setInterval` ticks and animation frames
- **Resume:** When tab becomes visible again, re-sync clock to current time
- **Rationale:** Saves battery/CPU; prevents animation backlog

```ts
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause clock ticks and animations
    stopTickInterval();
  } else {
    // Re-sync to current time and resume
    syncClockToNow();
    startTickInterval();
  }
});
```

This ensures the app is always accurate when viewed, without wasting resources in the background.

## Edge Cases

### Polar Regions
At extreme latitudes (above Arctic Circle), the sun may:
- Never set (midnight sun in summer)
- Never rise (polar night in winter)

**Handling:**
- If `suncalc` returns invalid sunrise/sunset, show sun at fixed position
- Display appropriate message in widgets ("No sunset today")

### Short Days / Long Nights
Near winter solstice at high latitudes:
- Very short arc (sun barely rises above horizon)
- Adjust `heightRatio` if arc would be too shallow to be visible

### Timezone Edge Cases
- Users traveling across timezone boundaries
- DST transitions mid-session
- **Solution:** `TimeProvider` should detect timezone changes and trigger refresh

## Debug Mode

**A developer/testing mode accessible via a hidden gesture** that allows manual control of time and location for testing all sky states.

### Activation
- **Hidden Trigger:** Tap the **Location Name** in the bottom bar **5 times rapidly** (within 2 seconds).
- **Feedback:** A toast notification appears ("Developer Mode Enabled" / "Disabled").
- **UI:** When enabled, the debug panel overlay appears automatically.

### Debug Controls

#### Time Override
```
┌─────────────────────────────────────┐
│ 🕐 Time Override                    │
│ ┌─────────────────────────────────┐ │
│ │ ○ Use real time                 │ │
│ │ ● Manual time                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Date: [2026-01-21]                  │
│ Time: [14:30:00]                    │
│                                     │
│ Quick presets:                      │
│ [Dawn] [Sunrise] [Noon]             │
│ [Sunset] [Dusk] [Midnight]          │
│                                     │
│ ⏩ Time speed: [1x ▼]               │
│    (1x, 10x, 60x, 360x)             │
└─────────────────────────────────────┘
```

#### Location Override
```
┌─────────────────────────────────────┐
│ 📍 Location Override                │
│ ┌─────────────────────────────────┐ │
│ │ ○ Use detected location         │ │
│ │ ● Manual location               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Latitude:  [41.2995]                │
│ Longitude: [69.2401]                │
│ Timezone:  [Asia/Tashkent ▼]        │
│                                     │
│ Quick presets:                      │
│ [Tashkent] [New York] [London]      │
│ [Tokyo] [Tromsø] [Reykjavik]        │
└─────────────────────────────────────┘
```

### Debug Info Overlay
When debug mode is active, show small overlay with current values:
```
┌──────────────────────────┐
│ cycle: dusk              │
│ sun progress: 0.92       │
│ moon progress: 0.08      │
│ altitude: 0.12           │
│ gradient: dusk→night 45% │
└──────────────────────────┘
```

### Implementation Notes
- Debug state stored in `localStorage` under `waqt.debug`
- Time speed multiplier affects `setInterval` tick rate
- Override values bypass `LocationProvider` and `TimeProvider` when active
- Presets call predefined scenarios for quick testing

### Time Speed Multiplier
For testing transitions:
- **1x:** Real-time (1 second = 1 second)
- **10x:** 1 minute passes in 6 seconds
- **60x:** 1 hour passes in 1 minute
- **360x:** Full day passes in 4 minutes

## Testing Considerations
- Validate positioning via automated tests that confirm `sun`/`moon` CSS variables match expected values for known `orbit` inputs.
- Snapshot gradients for each `cycle` state to ensure correct colors are applied.
- Test responsive breakpoints (mobile/tablet/desktop) to ensure CSS variables adjust as planned.
- Test with extreme latitudes (Tromsø, Reykjavik) to verify polar edge case handling.
- Test sunrise/sunset moments to ensure smooth color transitions.
- Use debug mode presets for manual QA testing of all sky states.
