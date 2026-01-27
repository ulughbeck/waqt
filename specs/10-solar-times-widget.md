# Solar Times Widget

This widget displays the key solar event times (Sunset/Sunrise and Night Start/End) in a two-row list format, as shown in the mockups. It complements the Progress Widget by providing explicit time values rather than a visual progress indicator.

## Inputs
- `timeContext.cycle`: `dawn | day | dusk | night` from `TimeProvider`.
- `timeContext.solar`: object containing `sunrise`, `sunset`, `dawn`, `dusk` timestamps.
- `timeContext.clock`: the live Date signal for determining which times to show.

## Behavior

### Day Mode (when cycle is dawn, day, or dusk)
Display two rows:
1. **Sunset** — The upcoming sunset time with sun icon
2. **Night Start** — When astronomical night begins (typically dusk time)

### Night Mode (when cycle is night)
Display two rows:
1. **Sunrise** — The upcoming sunrise time with sun icon
2. **Night End** — When astronomical night ends (typically dawn time)

### Time Formatting
- **Use 24-hour format**: `17:25` (per design system — consistent throughout app)
- Times should be **large and prominent** on the right side of each row
- Color-code times for visual distinction:
  - Sunset/Sunrise: Gold/Yellow (`#FFD700`)
  - Night Start/End: Pink/Magenta (`#FF4D94`)

## Visual Layout

### Supported Variants
- **`4x2` (Mandatory):** Shows both solar events (Sunset + Night Start) in list format.
- **`2x2` (Optional):** Shows only the *next* upcoming solar event (e.g., just Sunset).

### Card Structure
```
┌─────────────────────────────────┐
│  ☀️  SUNSET             19:57  │
│      ─────────────────────────  │
│  🌙  NIGHT START        20:23  │
└─────────────────────────────────┘
```
Note: Times shown in 24-hour format per design system.

### Row Design
- Each row contains:
  - **Left**: Small icon (sun or moon, 16-20px)
  - **Center**: Label in uppercase muted text (`SUNSET`, `NIGHT START`)
  - **Right**: Time value in bold, color-coded

### Styling
```css
.solar-times__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) 0;
}

.solar-times__row:first-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.solar-times__icon {
  width: 18px;
  height: 18px;
  margin-right: var(--space-sm);
}

.solar-times__label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  flex: 1;
}

.solar-times__time {
  font-size: 1rem;
  font-weight: 600;
}

.solar-times__time--sunset {
  color: #FFD700; /* Gold */
}

.solar-times__time--night {
  color: #FF4D94; /* Pink/Magenta */
}

.solar-times__timezone {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-left: var(--space-xs);
}
```

### Icons
- **Sun icon**: Simple circle with rays, or filled sun glyph
- **Moon icon**: Crescent moon glyph
- Icons should be tinted to match their respective time colors

## Accessibility
- Widget container uses `role="region"` with `aria-label="Solar times"`.
- Each time row should be readable as a complete phrase: "Sunset at 17:57".
- Use `aria-live="polite"` to announce when times update (e.g., after location change).

## Notes
- This widget provides a quick-glance view of exact times, while the Progress Widget shows visual progress toward those times.
- Consider combining this with the Prayer Widget in a future iteration if screen space is limited.
- Times should update immediately when location changes.
