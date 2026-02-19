# Year Map Widget

This widget renders a day-progress map for the current year. It updates from `TimeProvider` time and supports a single size: `4x2`.

## Current implementation status
- Implemented in:
  - `frontend/src/components/widgets/YearMapWidget.tsx`
  - `frontend/src/components/widgets/YearMapWidget.css`
  - `frontend/src/services/yearMap.ts`
- Registered in widget registry and dashboard grid.
- Included in default layout after `PROGRESS`.

## Inputs
- `timeContext.time`: current `Date` from `TimeProvider`.
- Year/day boundaries are based on the provided `Date` and local date math in `yearMap.ts`.

## Core behavior
- Render one cell per day for the current year (365 or 366).
- Day classification:
  - Future days -> level `0`
  - Past days -> level `1`
  - Today -> level `4`
- Monday-first weekday indexing is used in model helpers.
- Model recomputes whenever `time()` changes.
- Dot size is computed from actual widget inner width (via `ResizeObserver`) so layout scales consistently across phone/tablet/desktop.

## Day states
Implemented via level CSS classes:
- `level-0`: `rgba(255, 255, 255, 0.16)` (future)
- `level-1`: `rgba(255, 255, 255, 0.92)` (past)
- `level-4`: `#FF6B35` (today)
- `level-2` and `level-3` exist in types/CSS for compatibility but currently render same white as past.

## Visual layout

### Supported variants
- **`4x2` (implemented):** detailed year grid + footer progress text.

### `4x2` layout
Main area:
- Dense dot grid, column-flow layout.
- Row count fixed to `9`.
- Column count derived: `ceil(totalDays / 9)`.
- For non-leap year, this yields `41` columns.

Bottom row:
- Text format: `Xd left - Y%`
- `X = totalDays - dayOfYear`
- `Y = round(progress * 100)`

### Cell sizing (implemented)
- Grid gap: `1.5px`
- Cell size: computed by `computeYearMapCellSize(...)` in `frontend/src/services/yearMap.ts` using:
  - measured grid-wrap width
  - current column count
  - fill ratio (`1.0`)
  - min/max clamp (`4px..8px`)
- Computed size is applied to both grid tracks and cell width/height (square dots).
- Radius: `999px` (dot style)

## Data contract (widget-internal)
```ts
type DayLevel = 0 | 1 | 2 | 3 | 4;

interface YearMapCell {
  date: string; // YYYY-MM-DD in local timezone
  weekIndex: number;
  weekdayIndex: number; // Monday-first: 0..6
  level: DayLevel;
  isToday: boolean;
  isFuture: boolean;
}

interface YearMapMeta {
  year: number;
  dayOfYear: number; // 1..365/366
  totalDays: number; // 365 or 366
  progress: number; // 0..1
  daysLeft: number; // totalDays - dayOfYear
}

interface MonthMarker {
  label: string;
  weekIndex: number;
}

interface YearMapModel {
  cells: YearMapCell[];
  meta: YearMapMeta;
  totalWeeks: number;
  monthMarkers: MonthMarker[];
}
```

## Interaction
- Read-only.

## Accessibility
- Widget card: `role="region"` with `aria-label="Year progress map"`.
- Screen-reader summary is rendered in `sr-only` text:
  - `"${daysLeft} days left, ${percent} percent of year completed."`
- Visual grid is `aria-hidden="true"`.

## Dashboard placement
Default layout order is:
1. `PROGRESS`
2. `YEAR_MAP`
3. `SOLAR`
4. `SEASON`
5. `PRAYER`

(Debug widget remains present in layout and is pinned first when debug mode is enabled.)

## Tests (current coverage)
- `frontend/src/services/yearMap.test.ts`:
  - leap-year detection
  - total day count
  - Monday-first weekday index
  - full cell generation (365/366)
  - day-level mapping
  - responsive cell-size clamping helper
- `frontend/src/components/widgets/YearMapWidget.test.tsx`:
  - `4x2` render with 365 cells and today marker

## Notes
- Week start is **Monday-first**.
- Bottom text format is `Xd left - Y%`.
- No dedicated fallback state for missing time context (current `TimeProvider` contract provides `time`).
