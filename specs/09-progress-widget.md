# Progress Widget

This widget implements the **segmented progress bar** and countdown copy shown in the mockups. The bar visually symbolizes the sky color throughout the day/night cycle — it's a visual representation of the sky gradient from sunrise through noon to sunset (for day) or from sunset through midnight to sunrise (for night).

## Inputs
- `timeContext.cycle`: `dawn | day | dusk | night` from `TimeProvider`.
- `timeContext.clock`: the live Date signal.
- `timeContext.solar`: object containing `sunrise`, `sunset`, `dawnEnd`, `duskStart`, and optionally explicit `nightStart`/`nightEnd` values (default to `sunset`/`sunrise` when missing).
- `timeContext.helpers.timeUntilNextSolarEvent()` or equivalents, if available, to surface human-friendly countdown text.

## Behavior
- Determine whether to show the **day** progress bar or the **night** progress bar by looking at `cycle`. Treat `dawn`, `day`, and `dusk` as the day phase so the widget tracks sunrise→sunset. Treat `night` as the night phase that tracks night start→night end (where night start is generally `solar.duskStart` or `solar.sunset`, and night end is `solar.dawnEnd` or the next sunrise).
- Compute the progress value:
  * `dayProgress = clamp((clock - sunrise) / (sunset - sunrise), 0, 1)` when tracking day.
  * `nightProgress = clamp((clock - nightStart) / (nightEnd - nightStart), 0, 1)` when tracking night.
- The widget shows **time labels on both ends** of the progress bar:
  * **Day view**: Left label shows **Sunrise time**, Right label shows **Sunset time**
  * **Night view**: Left label shows **Night Start time**, Right label shows **Night End time**
  * **Time format**: 24-hour (e.g., `06:45`, `17:25`) per design system
- The widget also shows countdown text:
  * Day view: `Day ends in 2h 17m` derived from `sunset - clock`.
  * Night view: `Night ends in 11h 50m` derived from `nightEnd - clock`.
- If the times required for the current segment are missing (polar regions, missing cache), show a fallback message such as "Sunrise/Sunset unavailable" and keep the progress bar at 50% while disabling animations.

## Visual layout — Segmented Bar Design

### Supported Variants
- **`4x2` (Mandatory):** Shows the full 24-segment bar with start/end times.
- **`2x2` (Optional):** Shows a simplified circular progress or just the current status text.

**CRITICAL: The progress bar symbolizes the SKY COLOR throughout the day/night cycle.**

The bar is NOT a simple past/future indicator — it's a visual representation of what the sky looks like at each point in time, like a compressed timeline of the sky gradient.

### Segmented Bar Structure
- The progress bar consists of **24 vertical segments** representing the hours of the day/night period.
- Each segment is a thin vertical rectangle with rounded ends (pill shape).
- Segments are arranged horizontally with small gaps (2-3px) between them.
- Segment dimensions: approximately `4px wide × 24px tall`.

### Day Mode Color Scheme (Symbolizing Sky Throughout Day)

**The colors represent the sky color at each time of day:**

```
Sunrise ────────────────── Noon ────────────────── Sunset
   │                         │                        │
   ▼                         ▼                        ▼
 Blue ──→ Red ──→ Orange ──→ Yellow ──→ Orange ──→ Red ──→ Blue
(dawn)        (morning)     (midday)    (afternoon)      (dusk)
```

- **Edge segments (sunrise/sunset)**: Cool blue tones (`#4A90D9`, `#6BB3E0`)
- **Transition segments**: Red/orange (`#FF6B35`, `#FF8C42`)
- **Center segments (noon)**: Warm yellow/orange (`#FFD700`, `#FFA500`)
- **Symmetrical**: Left half mirrors right half with noon as the center peak

### Night Mode Color Scheme (Symbolizing Sky Throughout Night)

**The colors represent the sky color at each time of night:**

```
Sunset ────────────────── Midnight ────────────────── Sunrise
   │                          │                          │
   ▼                          ▼                          ▼
 Red ──→ Blue ──→ Dark Grey/Black ──→ Blue ──→ Red
(dusk)   (evening)  (deep night)    (pre-dawn)  (dawn)
```

- **Edge segments (sunset/sunrise)**: Warm red/pink (`#FF6B35`, `#FF4D94`)
- **Transition segments**: Deep blue (`#1E3A5F`, `#2B4A6F`)
- **Center segments (midnight)**: Dark grey/near-black (`#1A1A2E`, `#0D0D1A`)
- **Symmetrical**: Left half mirrors right half with midnight as the darkest center

### Segment Coloring Implementation

```ts
// Day mode: blue → red → yellow/orange → red → blue
const dayGradient = [
  '#4A90D9', '#5A9FE3', '#6BB3E0',  // blue (sunrise)
  '#FF8C42', '#FF9F5A', '#FFAD66',  // orange-red
  '#FFD700', '#FFDF33', '#FFE566',  // yellow (noon) - center
  '#FFAD66', '#FF9F5A', '#FF8C42',  // orange-red
  '#6BB3E0', '#5A9FE3', '#4A90D9',  // blue (sunset)
];

// Night mode: red → blue → dark grey/black → blue → red
const nightGradient = [
  '#FF6B35', '#E85A4F', '#CC4A63',  // red (sunset)
  '#5C3D7A', '#3D4A7A', '#2B4A6F',  // purple-blue
  '#1A1A2E', '#0D0D1A', '#0A0A12',  // dark (midnight) - center
  '#2B4A6F', '#3D4A7A', '#5C3D7A',  // purple-blue
  '#CC4A63', '#E85A4F', '#FF6B35',  // red (sunrise)
];
```

### Playhead Indicator
- A **circular dot** (8-10px diameter) positioned below the current segment serves as the playhead marker.
- **Day mode**: Orange/red dot (`#FF6B35`) with warm glow
- **Night mode**: Orange/red dot (`#FF6B35`) with warm glow
- The dot should have a subtle glow/shadow (`box-shadow: 0 0 8px rgba(255,107,53,0.6)`).
- Position updates smoothly as progress advances.

### Future Segments (After Playhead)
- Segments after the current time position use muted/faded versions of their assigned colors
- Apply `opacity: 0.3` or desaturated versions to indicate "not yet reached"
- This maintains the sky symbolism while clearly showing progress

### CSS Implementation
```css
.progress-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm) 0;
}

.progress-bar__segment {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  transition: opacity 0.3s ease;
}

.progress-bar__segment--future {
  opacity: 0.3;
}

.progress-bar__playhead {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FF6B35;
  box-shadow: 0 0 8px rgba(255, 107, 53, 0.6);
  position: absolute;
  bottom: -16px;
}

.progress-bar__time-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}
```

### Card Layout
- The card should reuse `WidgetCard` styles.
- Layout from top to bottom:
  1. **Time labels row**: Left time (sunrise/night start) — Right time (sunset/night end)
  2. **Segmented progress bar**: 24 segments with sky-color gradient and playhead
  3. **Countdown text**: `Day ends in 2 hr, 17 min` or `Night ends in 11 hr, 50 min`

## Accessibility
- The progress bar container should expose `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` attributes reflecting the clamped progress value plus an `aria-label` such as "Day progress: 43% complete" or "Night progress: 62% complete."
- Provide screen-reader-friendly text for the countdown copy, e.g., `aria-live="polite"` so that when the clock transitions from day to night the new label is announced.
- Each segment can be `aria-hidden="true"` since the overall progressbar role conveys the information.

## Notes
- This widget drives the progress calculation, so ensure `TimeProvider` exposes the raw start/end timestamps (even if they are the same as sunrise/sunset) so the widget doesn't need to re-derive them externally.
- In future versions we may break this card into separate day and night variants, but for now the single widget toggles modes based on `cycle` so it behaves consistently with the provided mockups.
