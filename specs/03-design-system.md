# Design System

## Purpose
Document the visual and interaction language for the immersive sky PWA so that the sky engine, dashboard widgets, and UI chrome all stay cohesive across breakpoints while remaining easy to implement with vanilla CSS and SolidJS components.

## Design tokens
Use CSS custom properties to expose the following tokens. Keep names kebab-case, grouped by purpose, and define them in `src/root.css` (global) as the base so every component can consume them.

### Colors
```css
:root {
  /* Sky gradients use multi-stop definitions - see 05-sky-engine.md for full specs */
  /* These are the key anchor colors for reference */
  --color-sky-dawn-zenith: #0C1020;
  --color-sky-dawn-horizon: #FFB088;
  --color-sky-day-zenith: #1A5FB4;
  --color-sky-day-horizon: #E8F4F8;
  --color-sky-dusk-zenith: #15192F;
  --color-sky-dusk-horizon: #FFB366;
  --color-sky-night-zenith: #050510;
  --color-sky-night-horizon: #252545;
  
  /* Sun colors are dynamic based on altitude - see 05-sky-engine.md */
  --color-sun-core: #FFFFFF;      /* White at zenith */
  --color-sun-corona: #FFF8E0;    /* Pale yellow glow */
  --color-moon: #f0f0f0;
  
  /* UI colors */
  --color-widget-bg: rgba(9, 18, 32, 0.85);
  --color-widget-border: rgba(255, 255, 255, 0.1);
  --color-accent-primary: #6ef5ff;
  --color-accent-secondary: #ff6abf;
  --color-text-primary: #f3f4f6;
  --color-text-secondary: rgba(243, 244, 246, 0.7);
  --color-text-muted: rgba(243, 244, 246, 0.4);
  --color-shadow: rgba(0, 0, 0, 0.45);
}
```

**Sky gradients are multi-stop (3-6 colors) and smoothly interpolated between cycles.** The Sky Engine updates the full `--sky-gradient` property dynamically. See [05-sky-engine.md](./05-sky-engine.md) for complete gradient definitions.

**Migration note:** Replace legacy sky token names (`--color-sky-*-top` / `--color-sky-*-bottom`) with `--color-sky-*-zenith` / `--color-sky-*-horizon` in any component styles.

### Icons
- **Icon library**: [Lucide Icons](https://lucide.dev/) — use `lucide-solid` package for SolidJS
- **Performance**: Use **deep imports** to avoid loading the entire library in development.
  - ❌ `import { MapPin } from 'lucide-solid'`
  - ✅ `import MapPin from 'lucide-solid/icons/map-pin'`
- Icon sizes: 24px default, 20px for compact contexts, 16px for inline
- Icon color: inherit from parent text color (use `currentColor`)

### Typography
- Base font family: `font-family: 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;`
- Headings (clock, event titles): `font-weight: 600`, `letter-spacing: 0.02em`, `font-size` scalable (see layout section).
- Body text (widget details): `font-weight: 400`, `font-size: 0.9rem`, `line-height: 1.4`. Use `color-text-secondary` for descriptors, `color-text-primary` for primary numbers.
- Use uppercase tracking (0.08em) for small labels inside widgets (e.g., "DAY START").

### Time & Date Formats
- **All times use 24-hour format** — consistent throughout the app.
- **Main Clock**: `13:36:54` — large, centered in sky area.
- **Widget times**: `17:25` — no AM/PM indicator.
- **Date**: Full weekday with abbreviated month (`Wednesday, Jan 15`).
- **Countdowns**: Use compact format `in 2h 15m` (not "2 hr, 15 min" or "2 hours 15 minutes").
  - Hours + minutes: `in 2h 15m`
  - Minutes only: `in 45m`
  - Less than a minute: `in <1m` or `now`

### Spacing & Layout values
- Base unit: `1rem` (~16px). Define spacing tokens: `--space-xs` (0.25rem), `--space-sm` (0.5rem), `--space-md` (1rem), `--space-lg` (1.5rem), `--space-xl` (2.5rem).
- Border radius: `--radius-lg` (24px) for widgets, `--radius-pill` (999px) for buttons.
- Shadow: `box-shadow: 0 12px 30px var(--color-shadow);` for floating cards.

### Animations & timing
- Define easing tokens: `--ease-smooth: cubic-bezier(0.34, 0.69, 0.1, 1);`, `--ease-fast: cubic-bezier(0.4, 0, 0.2, 1);`
- Sun/moon orbit: `transition: transform 1s var(--ease-smooth);`.
- Gradient changes: `transition: background 0.8s var(--ease-smooth);`.
- Widget fade-ins: `animation: widget-fade-in 0.6s var(--ease-fast) forwards;`.

## Layout principles
### Breakpoints
Use responsive breakpoints to recalibrate the sky height, horizon curvature, and widget grid.
- **Mobile (≤640px)**: Portrait orientation. Sky height: ~40% viewport height. Smaller sun/moon (48px). **Grid: 4 columns**.
- **Tablet (641px–1024px)**: Sky height ~40% viewport, sun/moon ~56px. **Grid: 8 columns**.
- **Desktop (>1024px)**: Sky height ~42% viewport, sun/moon ~64px. **Grid: 12 columns** with max-width container (1200px).

**Note:** The mockups show approximately 40-42% of the viewport as sky, with the remaining ~58-60% as the dark "earth" ground with widgets.

### Widget Grid Column Rules
The widget grid adapts to viewport width using a **Base-4 System**:
- **12 columns** on wide screens (>1024px)
- **8 columns** on medium screens (641px–1024px)
- **4 columns** on narrow screens (≤640px)

All widgets remain visible on all breakpoints — users scroll to see them on smaller screens.

### Sky area
- The sky occupies the top portion of the screen with a curved bottom edge (semi-ellipse). Use CSS variables for arc radius per breakpoint: `--arc-radius-mobile`, `--arc-radius-desktop`.
- Clock position: center horizontally by default, vertical position shifts based on breakpoint (see `specs/05-sky-engine.md` for specific values).
- Sun/Moon sizes adjust per breakpoint (`--orbiter-size-mobile`, `--orbiter-size-desktop`). Keep icons visually balanced relative to horizon width.
- Background gradient defined by `--gradient-start`/`--gradient-end` and layered with radial gradients for glow.

### Dashboard & widgets — The Earth/Sky Metaphor

**CRITICAL: The app uses a sky/earth visual metaphor. This is the core design concept.**

The interface is divided into two distinct visual zones:
- **Above the horizon (SKY)**: Dynamic gradient background with sun/moon orbit, stars, atmospheric glow, and light effects
- **Below the horizon (EARTH)**: **Solid pure black** (`#000000`) representing the earth's surface/ground

This creates an immersive planetary perspective where users appear to be standing on the earth, looking up at the sky above.

#### Dashboard Background — Solid Black with Ambient Grounding

**The dashboard shell base is solid black `#000000`, but it engages with the sky through ambient light.**

While the ground is dark, it is not a void. It reflects the atmosphere:
1. **Base:** Solid black `#000000` to maintain contrast and "float" the widgets.
2. **Ambient Spill:** The very top edge (just below the horizon) receives a subtle ambient light spill matching the sky cycle. This visually "grounds" the horizon so it doesn't look like a floating cutout.

```css
.dashboard-shell {
  background: #000000;
  position: relative;
}

/* Ambient spill at top edge */
.dashboard-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, var(--color-sky-horizon-glow, rgba(255,255,255,0.1)), transparent);
  opacity: 0.3;
  pointer-events: none;
}
```

#### Widget Styling on Dark Ground
- Widget grid uses CSS Grid with `gap: var(--space-md)`; allow wrap. Max width 1200px, center-aligned, margin `0 auto`.
- Widgets: Base height ~100px, `border-radius: var(--radius-lg)`, `background: var(--color-widget-bg)`, `backdrop-filter: blur(18px)` (if performance permits).
- The dark ground makes the semi-transparent widgets appear to float above the surface.
- Each widget is a self-contained card with `display: flex`, key/value layout, optional icon on the right.
- Text inside widgets uses tokens defined above. Secondary info uses `color-text-muted`.
- Location trigger is a floating pill centered near the bottom of the viewport. Use a glassy background, pill radius, and subtle lift on hover.

### Buttons & chrome
- City override button uses `border-radius: var(--radius-pill)`, `background: rgba(255, 255, 255, 0.08)`, `color: var(--color-text-primary)`, `padding: 0.5rem 1.2rem`, `font-weight: 500`.
- Hover/active states: lighten background via `rgba(255, 255, 255, 0.12)` and apply slight upward translate (`transform: translateY(-2px)`).
- Icons remain tonal (use CSS `filter` or `mask-image` if using SVGs) and sized around 22–28px.

## Sky Engine-specific guidance
- Maintain CSS variables for key state values (`--sun-x`, `--sun-y`, `--moon-x`, `--moon-y`). The Sky Engine updates them in JS and applies them with `transform: translate()`.
- Use layered radial gradients behind the sun/moon to simulate glow. Color tokens for glow: `--color-sun-glow: rgba(255, 208, 91, 0.45)`; `--color-moon-glow: rgba(255, 255, 255, 0.3)`.

### Star Field (Night Sky)
- Stars should be **randomly distributed evenly across the entire sky area** on each render.
- **Not too many stars** — keep it subtle (~40-60 stars), not overwhelming.
- **Varying brightness** — opacity range `0.3-0.8`, sizes `1-3px`.
- **Subtle twinkle effect** — 20-30% of stars have gentle opacity animation.
- Stars fade in during dusk and are fully visible at night; fade out during dawn.
- Generate star positions randomly using JS, apply via `box-shadow` or inline styles.

```js
// Example: Generate ~50 random stars with atmospheric extinction
const stars = Array.from({ length: 50 }, () => {
  // Bias Y toward upper sky (fewer stars near horizon due to atmosphere)
  const y = Math.pow(Math.random(), 1.5) * 100;
  
  return {
    x: Math.random() * 100,
    y,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.5,
    twinkle: Math.random() < 0.25,
    twinkleDuration: 2 + Math.random() * 2,
  };
});

// Apply atmospheric extinction: stars fade near horizon
function getStarOpacity(baseOpacity, yPercent) {
  if (yPercent > 70) {
    return baseOpacity * (1 - (yPercent - 70) / 30);
  }
  return baseOpacity;
}
```

### Horizon Glow/Rim Light
**CRITICAL: The horizon is an optical event, not just a line.**
- **Rim Light:** A thin, glowing line along the curve.
- **Optical Bloom:** The light from the sky should "bleed" over the edge onto the earth.
- **Implementation:**
```css
.horizon-curve {
  /* Existing curve styles... */
  /* Sharp rim light */
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  /* Soft bloom */
  box-shadow: 0 -4px 30px var(--horizon-glow-color, rgba(110, 245, 255, 0.25));
}
```
- The glow color should shift based on cycle:
  - Dawn/Dusk: warm orange glow (`rgba(255, 140, 60, 0.4)`)
  - Day: subtle white/cyan glow
  - Night: cool teal glow (`--color-accent-primary` at low opacity)

## Widget & dashboard states
- Define state tokens: `--state-success: #6ef5ff`, `--state-alert: #ff8c42`, `--state-muted: rgba(243, 244, 246, 0.35)`.
- Widgets should support three visual states: normal, highlighted (when representing the next upcoming event), and disabled/loading (reduce opacity to 0.5, show spinner or pulsing dot).
- Provide a consistent `label-value` hierarchy: small uppercase label, bold numeric value, secondary descriptor below.

## UI Components

### Bottom Sheet (Modal)
Shared component for all bottom-sheet style modals (Settings, Location Search).

- **Z-Index Strategy**:
  - `z-index: 200` for backdrop (above bottom bar which is 100).
  - `z-index: 201` for modal content.
- **Backdrop**:
  - `position: fixed; inset: 0`
  - `background: rgba(0, 0, 0, 0.6)`
  - Closes modal on click.
- **Container**:
  - `position: absolute; bottom: 0; left: 0; right: 0`
  - `max-width: 600px; margin: 0 auto` (centered on desktop)
  - `background: var(--color-widget-bg)`
  - `backdrop-filter: blur(20px)`
  - `border-radius: var(--radius-lg) var(--radius-lg) 0 0`
  - **Animation**: Slide up from bottom (`transform: translateY(100%)` → `0`).

```css
.bottom-sheet__backdrop {
  z-index: 200; /* Above bottom bar (100) */
  /* ... */
}

.bottom-sheet__content {
  z-index: 201;
  /* ... */
}
```

## Mobile Safe Areas & Orientation

### Safe Area Handling
For notched phones (iPhone X+) and devices with home indicators:

#### Sky Area
**The sky should extend behind the notch and status bar** for an immersive experience:
```css
.sky-scene {
  /* Extend into safe area at top */
  padding-top: env(safe-area-inset-top);
  /* Or use negative margin with overflow to bleed behind */
}
```

#### Bottom Bar
**Must respect the home indicator area:**
```css
.bottom-bar {
  padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
}
```

#### Dashboard
```css
.dashboard {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Orientation Lock
- **Mobile (≤640px):** Lock to **portrait** orientation
- **Tablet/Desktop:** Allow both orientations

```css
/* In manifest.webmanifest */
{
  "orientation": "portrait"
}

/* CSS fallback for browsers */
@media (max-width: 640px) and (orientation: landscape) {
  .app-root {
    /* Show rotate device message or force layout */
  }
}
```

### Viewport Meta
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
The `viewport-fit=cover` is required for `env(safe-area-inset-*)` to work.

## Accessibility & motion
- Provide reduced-motion support via `@media (prefers-reduced-motion: reduce)` to disable gradient transitions and disable orbit easing (set `animation-duration: 0.001s`).
- Ensure contrast ratios exceed WCAG AA (maintain bright text on dark backgrounds).
- Use `aria-live` regions for key time updates if needed (clock, next prayer). Widgets should have `role="region"` and `aria-label` describing their content.
- Font sizes should never drop below 0.75rem even on small screens; use `clamp()` for scaling if necessary.

## Implementation notes
- Keep CSS modular: global tokens in `src/root.css`, component-specific styles in matching `.css` files imported in Solid components (e.g., `SkyScene.css`, `WidgetCard.css`).
- Use CSS custom properties to allow animations and JS updates without dom reflow (update `style.setProperty('--sun-x', value)` from the Sky Engine).
- Reference the design token names consistently across components so future changes only require editing `root.css`.
