# Season Widget

This spec drills into the card that shows the current calendar season plus a countdown to the next seasonal change. It builds on the shared `WidgetCard` base and uses the `TimeProvider` clock so the card always reflects the user's locally observed day of year.

## Inputs
- `timeContext.clock`: the current Date in the resolved timezone (from `TimeProvider`).
- `locationContext.location.lat`: Latitude from `LocationProvider` used to determine the hemisphere.

## Season rules
- **Hemisphere Detection:**
  - **Northern Hemisphere** (Lat ≥ 0): Standard seasons.
  - **Southern Hemisphere** (Lat < 0): Seasons are inverted by 6 months.

- **Season Schedule (Northern Hemisphere):**
  * **Spring** – March 1 through May 31.
  * **Summer** – June 1 through August 31.
  * **Fall** – September 1 through November 30.
  * **Winter** – December 1 through February 28/29.

- **Season Schedule (Southern Hemisphere):**
  * **Fall** – March 1 through May 31.
  * **Winter** – June 1 through August 31.
  * **Spring** – September 1 through November 30.
  * **Summer** – December 1 through February 28/29.

- At midnight on a boundary day, the widget instantaneously switches to the new season.
- The "next season" is computed by looking up the next start date relative to the current hemisphere.

## Data contract
- `currentSeason`: one of `spring`, `summer`, `fall`, `winter` (lowercase for internal use) and a humanized label (`Spring`, `Summer`, etc.) for display.
- `nextSeasonLabel`: full season name for the upcoming period (e.g., "Summer").
- `nextSeasonStart`: ISO date/time for the upcoming season's first instant (local midnight, e.g., `2026-06-01T00:00:00` in the user's timezone).
- `daysUntilNextSeason`: whole days remaining (floor, 0 when it is the first day of the next season). Use `Math.max(0, differenceInDays)` to avoid negative values.
- The widget should expose a short phrase (e.g., "Spring ends in 25 days") and show the season-specific icon.

## Visual treatment

### Supported Variants
- **`4x2` (Mandatory):** Full card with title, detailed countdown, and large icon.
- **`2x2` (Optional):** Simplified card with just icon and "Ends in X days".

### Layout
- Reuse the `WidgetCard` container with concise copy.
- **`4x2` copy format (required):**
  - Line 1: current season only (Title Case), e.g. `Winter`
  - Line 2: countdown only, e.g. `ends in 19 days`
- Avoid redundant labels like "Current Season" or repeating the season name in the countdown sentence.
- A **season-specific icon** sits on the right for visual flavor.

### Season Icons
Each season displays a unique icon that changes dynamically:
- **Spring**: Pink blossom/flower icon (`#FF69B4`)
- **Summer**: Sun icon (gold/yellow `#FFD700`)
- **Fall**: Orange/brown leaf icon (`#FF8C00`)
- **Winter**: Snowflake icon (white/light blue `#87CEEB`)

- Highlight the card border with `--color-accent-primary` if the season change is within the next 24 hours and the widget is the "next event" in the timeline; otherwise keep the standard widget border.
- For reduced-motion or loading states, fade the icon opacity while keeping the text legible; avoid manual animations inside this card unless necessary.

## Accessibility & states
- The widget should have `role="region"` and `aria-live="polite"` so screen readers announce when the season flips.
- Provide a tooltip or visually hidden text that announces the next season start date (e.g., "Summer begins June 1").
- When indefinite (lack of clock data), fallback copy should mention the "default season" (Winter) with a placeholder countdown until March 1.

## Notes
- The widget relies on the `LocationProvider` latitude to flip the season logic for Southern Hemisphere users.
- If location is unavailable, default to Northern Hemisphere behavior.
