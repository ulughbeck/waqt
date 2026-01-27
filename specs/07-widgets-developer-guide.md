# Widget System Developer Guide

This document is the canonical reference for creating, registering, and maintaining widgets in the Waqt application. It defines the architectural contracts, data availability, and steps required to add new functionality to the dashboard.

## 1. Widget Architecture

Widgets are modular "mini-apps" that reside in the Dashboard below the horizon. They follow a strict **Provider → Consumer** pattern.

### The Contract
Every widget must:
1.  **Be Stateless (mostly)**: Rely on `TimeContext` and `LocationContext` for data. Local state should be transient (e.g., UI toggles).
2.  **Be Responsive**: Support at least the mandatory `4x2` size. Optional `2x2` support is highly encouraged for mobile.
3.  **Use `WidgetCard`**: Wrap all content in the shared `WidgetCard` component for consistent styling (blur, border, padding).
4.  **Be Registered**: Must be added to the `WIDGET_REGISTRY` in `types.ts` to be recognized by the grid and drag-and-drop system.

## 2. Widget Interface

### Props
All widgets receive a standardized props object:

```typescript
export interface WidgetProps {
  size: '2x2' | '4x2'; // The current size assigned by the grid
}
```

### Registry (`frontend/src/components/widgets/types.ts`)
The registry controls the capabilities of each widget. **You must explicitly define all supported sizes here.**

```typescript
export const WIDGET_REGISTRY = {
  PRAYER: { 
    defaultSize: '4x2', 
    supportedSizes: ['4x2', '2x2'] // <--- CRITICAL: List ALL variants here
  },
  // ...
};
```

If a size is not listed in `supportedSizes`, the "Tap to Resize" interaction will ignore it, even if the component code handles that prop.

## 3. Data Sources ("Host Environment")

Widgets have access to two primary data streams via hooks.

### `useTime()` (TimeProvider)
The heartbeat of the application.
- **`time()`**: Current `Date` (ticking every second).
- **`solar()`**: `{ sunrise, sunset, dawn, dusk, solarNoon }`.
- **`prayer()`**: `{ fajr, dhuhr, asr, maghrib, isha }` (based on current location + settings).
- **`cycle()`**: `'dawn' | 'day' | 'dusk' | 'night'`.
- **`season()`**: `'winter' | 'spring' | 'summer' | 'autumn'`.
- **`helpers`**:
    - `currentPrayer()`: Returns active prayer.
    - `nextPrayer()`: Returns upcoming prayer with countdown.
    - `timeUntilNextSolarEvent()`: Returns seconds until next sun phase.

### `useLocation()` (LocationProvider)
- **`location()`**: `{ city, lat, lon, timezone }`.
- **`isLoading` / `error`**: Status of location resolution.

## 4. Creating a New Widget

### Step 1: Create Component
Create `frontend/src/components/widgets/MyNewWidget.tsx`.

```tsx
import { Show } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { WidgetProps } from "./types";
import { useTime } from "../../providers/TimeProvider";

export function MyNewWidget(props: WidgetProps) {
  const { time } = useTime();

  return (
    <WidgetCard
      colSpan={props.size === '4x2' ? 4 : 2}
      rowSpan={2}
      aria-label="My Widget"
    >
      <Show when={props.size === '4x2'} fallback={<div>Compact View</div>}>
        <div>Standard View: {time().toLocaleTimeString()}</div>
      </Show>
    </WidgetCard>
  );
}
```

### Step 2: Add Styles
Create `MyNewWidget.css`. Use CSS variables from `03-design-system.md`.

```css
.my-widget {
  color: var(--color-text-primary);
}
```

### Step 3: Register Widget
1.  Open `frontend/src/components/widgets/types.ts`.
2.  Add your widget type to `WidgetType`.
3.  Add configuration to `WIDGET_REGISTRY`.

```typescript
export type WidgetType = 'PRAYER' | ... | 'MY_NEW_WIDGET';

export const WIDGET_REGISTRY = {
  // ...
  MY_NEW_WIDGET: { defaultSize: '4x2', supportedSizes: ['4x2'] }
};
```

### Step 4: Add to Grid
Update `frontend/src/components/dashboard/WidgetGrid.tsx` to render your component when the type matches.

## 5. Best Practices
- **Fail Gracefully**: If `solar()` or `prayer()` is null (initial load), render a loading skeleton or a safe fallback.
- **No API Calls**: Widgets should not fetch data directly. Ask the `TimeProvider` or `LocationProvider` to handle data fetching.
- **Accessibility**: Always provide `aria-label` to `WidgetCard` describing the widget's current content.
