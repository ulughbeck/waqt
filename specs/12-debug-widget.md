# Debug Mode & Widget

This document defines the Developer/Debug tools for Waqt, including the **Debug Widget** and the **Debug Mode** activation/controls.

## 1. Debug Mode Activation

### Enable/Disable
- **Activation**: Tap the **Map Pin icon** in the Location modal search input **7 times** rapidly.
- **Feedback**: A toast notification appears ("Developer Mode Enabled" / "Disabled").
- **Persistence**: State stored in `localStorage` key `waqt.debug` (full debug state object).

### Debug Controls (Location Modal)
When Debug Mode is ON, the **Location Modal** transforms to include developer controls:

1.  **"Disable Developer Mode" Button**: At the top, to turn it off.
2.  **Time Override**:
    - Toggle: "Use real time" vs "Manual time".
    - Inputs: Date/Time picker.
    - Presets: Dawn, Sunrise, Noon, Sunset, Dusk, Midnight.
    - Speed Multiplier: 1x, 10x, 60x, 360x (for animation testing).
3.  **Location Override**:
    - Toggle: "Use detected" vs "Manual".
    - Inputs: Lat/Lon.
    - Presets: Tashkent, New York, London, Tokyo, Tromsø (Polar), Reykjavik.

## 2. Debug Widget

This widget renders telemetry from the Sky Engine directly into the dashboard grid, appearing **only** when Debug Mode is active.

- **Position**: When Debug Mode is ON, debug widget is pinned first in the grid.
- **Style**: Tech/Terminal aesthetic (Monospace font, Green/Cyan accents).

### Supported Variants

#### `4x2` (Mandatory / Detailed)
Displays full telemetry table.

```
┌─────────────────────────────────┐
│  TERMINAL                 120x  │
│  ─────────────────────────────  │
│  Cycle: night                   │
│  Sun Alt: -45.2°                │
│  Moon Prog: 0.45                │
│  Gradient: #000 -> #123...      │
└─────────────────────────────────┘
```
**Fields**: Cycle, Speed, Sun Altitude, Orbit Progress, Gradient values.

#### `2x2` (Compact)
Displays critical state only.

```
┌───────────────┐
│  DEBUG        │
│  NIGHT        │
│  60x          │
└───────────────┘
```

## 3. Debug Data Structure

```ts
interface DebugState {
  enabled: boolean;
  timeOverride: {
    active: boolean;
    date: string;      // ISO date
    time: string;      // HH:MM:SS
    speed: number;     // 1, 10, 60, 360
  };
  locationOverride: {
    active: boolean;
    lat: number;
    lon: number;
    timezone: string;
  };
}

// Storage Key: waqt.debug
```
