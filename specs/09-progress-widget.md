# Progress Widget

This widget renders a segmented progress bar and countdown text for the current solar window.

## Inputs
- `timeContext.cycle`: `dawn | day | dusk | night`
- `timeContext.time`: live local `Date`
- `timeContext.helpers.getDayWindow()`: `{ start, end }` for day
- `timeContext.helpers.getNightWindow()`: `{ start, end }` for night

## Core behavior
- Window selection:
  - `night` cycle -> use `getNightWindow()`
  - otherwise (`dawn|day|dusk`) -> use `getDayWindow()`
- Progress:
  - `progress = clamp((now - start) / (end - start), 0, 1)`
- Labels:
  - left = window start time
  - right = window end time
- Countdown:
  - `${phaseLabel} ends ${formatCountdown(secondsLeft)}`
- Invalid/missing window (`!window` or `end <= start`):
  - `4x2`: labels `--:--`, message `Sunrise/Sunset unavailable`, progress `50%`
  - `2x2`: value `Unavailable`

## Visual structure

### Variants
- `4x2`: detailed (time labels + segmented bar + countdown)
- `2x2`: compact (`Day/Night` + percent/unavailable)

### Segmented bar
- Segment count: `24`
- Playhead: orange dot (`#FF6B35`) with glow
- Future segments: reduced opacity (`0.3`)

### Simplified color logic
Use one unified palette for both day and night display states:
- Exactly **2 blue segments on the left**
- Exactly **2 blue segments on the right**
- All middle segments represent day colors (warm orange/yellow gradient)

Palette used in code (`ProgressWidget.tsx`):
- edges: `#4A90D9`, `#6BB3E0` ... `#6BB3E0`, `#4A90D9`
- middle: warm progression from `#FF6B35` to `#FFD700` and back

This intentionally replaces the previous night-specific dark gradient.

## Accessibility
- Progress container uses:
  - `role="progressbar"`
  - `aria-valuemin="0"`
  - `aria-valuemax="100"`
  - `aria-valuenow` based on current progress
  - `aria-label` with phase and percent
- Mode announcement is exposed via polite live region text (mode-level only).
- Visual segments are `aria-hidden`.

## Files
- `frontend/src/components/widgets/ProgressWidget.tsx`
- `frontend/src/components/widgets/ProgressWidget.css`
- `frontend/src/components/widgets/ProgressWidget.test.tsx`
