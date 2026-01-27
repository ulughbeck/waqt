# Prayer Widget

This widget displays the current and upcoming Islamic prayer times. It serves as the primary interface for daily prayer schedules and settings.

## Inputs
- `timeContext.prayer`: object containing `{ fajr, sunrise, dhuhr, asr, maghrib, isha }` timestamps.
- `timeContext.helpers.currentPrayer()`: returns current active prayer details.
- `timeContext.helpers.nextPrayer()`: returns next upcoming prayer details.
- `timeContext.clock`: the live Date signal.

## Behavior
- **Clickable**: Tapping the widget opens the **Detailed View** (Bottom Sheet).
- **Updates**: Refreshes immediately on time change or location update.

## Visual Layout

### Supported Variants
- **`2x2` (Compact)**: Shows current prayer status.
- **`4x2` (Standard)**: Shows current prayer and next prayer countdown.

### 1. Compact Variant (`2x2`)
Displays the **current active prayer**.

```
┌─────────────────┐
│  🌙             │
│  Dhuhr          │
│  12:30 - 15:45  │  <-- Start Time - Next Prayer Start Time
└─────────────────┘
```
- **Row 1**: Icon
- **Row 2**: Prayer Name
- **Row 3**: Time Range (Start Time - End Time)
- **Styling**: Minimalist, focused on current status.

### 2. Standard Variant (`4x2`)
Displays **current** and **next** prayer in a split-row layout (similar to Solar Times Widget).

```
┌─────────────────────────────────┐
│  🌙  Dhuhr           12:30       │ <-- Current Prayer
│  ─────────────────────────────  │
│  🌙  Asr          in 2h 15m      │ <-- Next Prayer
└─────────────────────────────────┘
```
- **Row 1 (Current)**: Icon (Left), Name (Center-Left), Start Time (Right).
- **Row 2 (Next)**: Icon (Left), Name (Center-Left), Countdown (Right).
- **Separator**: Thin divider between rows.

### Icon Specification
- **Icon**: Unique icon per prayer (e.g., sunrise/sun positions and crescent for night).
- **Color**: `#FFD700` (Gold).
- **Size**: 24-28px.

## Detailed View (Interaction)
**Trigger**: Tapping the widget opens a **Bottom Sheet**.

### Header
- Title: "Prayer Times"
- Current Date / Location (Optional)

### Content: Prayer List
Display all 5 daily prayers + Sunrise in a vertical list or grid.

```
┌─────────────────────────────────────────┐
│  Fajr           05:30                   │
│  Sunrise        06:45      (Solar)      │
│  Dhuhr          12:30      (Current)    │
│  Asr            15:45                   │
│  Maghrib        18:20                   │
│  Isha           19:50                   │
└─────────────────────────────────────────┘
```
- Highlight the **Current Prayer**.
- Show formatted 24h times.

### Content: Settings
**Moved from Global Settings**: The configuration for prayer calculation lives here.

1.  **Calculation Method**: Dropdown (e.g., "Muslim World League").
2.  **Asr Juristic Method (Madhab)**: Toggle/Radio (Shafi/Standard vs. Hanafi).

**Settings Persistence**:
- Update `localStorage`.
- Trigger `TimeProvider` refresh immediately.

## Accessibility
- **Widget**: `role="button"`, `aria-label="Prayer times, current is Dhuhr, next is Asr in 2 hours"`.
- **Detail View**: standard dialog accessibility (focus trap, close button).

## Notes
- This widget now owns the "Prayer Settings" logic.
- 2x2 variant focuses on "Now", 4x2 adds "Next".
