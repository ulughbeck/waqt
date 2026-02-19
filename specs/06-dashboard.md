# Dashboard (Widgets + Location Trigger)

This spec describes the area below the horizon: the dashboard that houses the widget grid and the floating location trigger. It captures the layout, responsive behavior, data context assumptions, and the shared "widget card" base component.

## The Earth/Sky Metaphor

**CRITICAL: The app uses a planetary visual metaphor.**

The interface is divided into two distinct zones:
- **Sky (above horizon)**: Dynamic gradient background with sun/moon orbit, stars, and atmospheric effects
- **Earth/Ground (below horizon)**: Solid black background representing the planet's surface

The curved horizon line is the boundary between these zones.

### Ground Background
```css
.dashboard-shell {
  background: #000000;
  /* The entire area below the horizon is solid black */
}
```

## Grid Architecture: The "Base-4" System

The dashboard uses a flexible **Bento Box** grid system based on a **4-column unit**. This aligns with mobile OS standards (iOS/Android) and standard 12-column web layouts.

### Grid Breakpoints (Points)
We use a universal grid unit (1 "Point").
- **Desktop (>1024px)**: 12 Points wide.
- **Tablet (641px–1024px)**: 8 Points wide.
- **Mobile (≤640px)**: 4 Points wide.

### Row Height & Aspect Ratio (Density Rule)
**CRITICAL: Optimize for information density on mobile.**

The user rule of thumb: **"On mobile, I want to see 2 full widget rows and a peek of the 3rd row."**

To achieve this within the ~60% dashboard vertical space:
- **Mobile Grid Row Height**: Should be approximately **60px**.
    -   This creates a standard widget (`4x2` or `2x2`) height of roughly **136px**.
    -   It ensures ~2.5 widgets fit in the visible dashboard area on standard phones.
    -   **Target Squatness**: `2x2` widgets should be wider than they are tall (~148px width x 136px height).

- **Tablet/Desktop**: **Apply the same density rule.**
    -   Keep row heights around **60px - 70px**.
    -   Prevent `4x2` banners from becoming excessively tall.
    -   It is better to have slightly "squat" (wide) widgets than tall ones that push content off-screen.

- **Gap**: `var(--space-md)` (16px).

### Widget Sizing & Variants (Adaptive Capability Model)
To ensure responsiveness without hardcoded roles, widgets declare their **Supported Variants** based on grid dimensions.

1.  **Mandatory Base Size (`4xN`)**:
    -   Usually `4x2` (Rectangular).
    -   Every widget **MUST** implement this size.
    -   Serves as the universal fallback for all breakpoints.

2.  **Optional Variants**:
    -   Widgets can optionally support other sizes like `2x2`, `6x4`, `8x2`, etc.
    -   **`2x2` (Small Square)**: Highly recommended for mobile to allow side-by-side layout.

### Smart Grid Logic
The Widget Grid determines which variant to render based on the current breakpoint and the widget's capabilities.

-   **Mobile (4 Columns)**:
    -   **Logic**: Check if widget supports `2x2`.
    -   **If Yes**: Render `2x2` (allows 2 widgets per row).
    -   **If No**: Render `4xN` (fills full width).
    
-   **Tablet (8 Columns) & Desktop (12 Columns)**:
    -   Default to `4xN` (Standard) or `2x2` (Small) based on the widget's specific default preference.
    -   Future: User can resize widgets to any variant supported by the widget.

### Widget Internal Layout
-   Widgets receive a `size` prop (e.g., `"4x2"`, `"2x2"`).
-   **`4x2`**: Renders detailed view (Text + Data + Icon).
-   **`2x2`**: Renders minimal view (Icon + Primary Value).

## Layout & implementation

- The dashboard wraps in a container (`.dashboard-shell`) with `max-width: 1200px` (increased for 12-col), horizontal `margin: 0 auto`, and `padding: 0 var(--space-md) var(--space-xl)`.
- **Parallax Scrolling**: The Sky Scene (background) should scroll slower than the dashboard content.

### CSS Grid Config
```css
.widget-grid {
  display: grid;
  gap: 12px; /* Tighter gap than standard space-md */
    /* Mobile: 4 columns */
    grid-template-columns: repeat(4, 1fr); 
    grid-auto-rows: 60px; /* Base row height */
    padding: var(--space-md);
}

@media (min-width: 641px) {
  .widget-grid {
    /* Tablet: 8 columns */
    grid-template-columns: repeat(8, 1fr);
    grid-auto-rows: 60px;
  }
}

@media (min-width: 1025px) {
  .widget-grid {
    /* Desktop: 12 columns */
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 60px;
  }
}
```

### Widget Card Base
- Extends `WidgetCard` component.
- **Classes**:
  - `.col-span-2` -> `grid-column: span 2`
  - `.col-span-4` -> `grid-column: span 4`
  - `.row-span-2` -> `grid-row: span 2`
- **Internal Layout**: 
  - **Height Enforce**: The root `.widget-card` **MUST** have `height: 100%` to ensure it fills the grid cell completely, regardless of content size.
  - `4xN` layouts use horizontal flex/grid.
  - `2x2` layouts use vertical stack (Icon Top, Value Bottom).

## Widget card style
-   Background: `var(--color-widget-bg)` with `backdrop-filter: blur(18px)`.
-   Border: `1px solid var(--color-widget-border)`.
-   Radius: `var(--radius-lg)`.

## Location Trigger (Floating Pill)
**Style**: "Floating Glass" pill.
- **Position**: Fixed bottom center, z-index 100, `bottom: var(--space-lg)`.
- **Layout**: Single pill displaying current city name and location icon.
- **Behavior**: Background is blurred; interactable.

```
                  ┌─────────────────────────────┐
                  │  📍 TASHKENT                │
                  └─────────────────────────────┘
```

### Interactions
- **Tap**: Opens Location Selection Modal.
- **Long Press**: Enters **Edit Mode**.

### Edit Mode Behavior
- **Visual**: Pill transforms into a **"Save"** button.
- **Icon**: Changes to Checkmark or Save icon.
- **Tap**: Saves layout changes and exits Edit Mode.

## Data & State
- Widgets consume `LocationProvider` + `TimeProvider`.
- Grid layout state is persisted in `localStorage` (`waqt.layout`).
- On load, saved layout is reconciled against current `DEFAULT_LAYOUT`:
  - Keep existing saved widgets and their order.
  - Append any widget types that exist in `DEFAULT_LAYOUT` but are missing from saved layout.
  - Normalize invalid saved sizes to each widget's registry default size.
  - Ignore unknown/removed widget types not present in registry.

## Grid Customization (Edit Mode)

### UX Overview
- **Trigger**: User **Long Presses** the Location Trigger (floating pill).
- **Visual Feedback**:
  - All widgets begin a gentle "shake" animation (similar to iOS).
  - The Location Trigger transforms into a **"Save"** button.
- **Interactions**:
  - **Reorder**: Drag and drop widgets to new positions.
  - **Resize**: Tap a widget to cycle through its supported sizes (e.g., `2x2` → `4x2` → `2x2`).
  - **Save**: Tap "Save" on the floating location trigger to persist changes and exit mode.

### Technical Implementation

#### 1. Dependencies
- Use **`@thisbeyond/solid-dnd`** for drag-and-drop interactions.

#### 2. Persistence (`waqt.layout`)
Layout state is stored in `localStorage` key `waqt.layout` as an array of widget definitions.

**Load reconciliation behavior:**
- Parse stored layout.
- Preserve existing user widgets in saved order.
- Append missing widgets from current `DEFAULT_LAYOUT` to the end.
- For each stored widget, if saved `size` is not in registry `supportedSizes`, fallback to registry `defaultSize`.
- Drop unknown widget types.

**Schema:**
```json
[
  { "id": "progress-1", "type": "PROGRESS", "size": "4x2" },
  { "id": "year-map-1", "type": "YEAR_MAP", "size": "4x2" },
  { "id": "solar-1", "type": "SOLAR", "size": "2x2" },
  { "id": "season-1", "type": "SEASON", "size": "2x2" },
  { "id": "prayer-1", "type": "PRAYER", "size": "4x2" }
]
```

#### 3. Widget Registry & Capabilities
The code maintains a registry of available widget types and their allowed sizes to support the "Tap to Resize" feature.

**CRITICAL:** This registry is the source of truth for the grid. See [07-widgets-developer-guide.md](./07-widgets-developer-guide.md) for full implementation details.

| Widget Type | Default Size | Supported Sizes |
|-------------|--------------|-----------------|
| `PRAYER`    | `4x2`        | `['4x2', '2x2']`|
| `SOLAR`     | `2x2`        | `['2x2', '4x2']`|
| `SEASON`    | `2x2`        | `['2x2', '4x2']`|
| `PROGRESS`  | `4x2`        | `['4x2']`       |
| `YEAR_MAP`  | `4x2`        | `['4x2']`       |
| `DEBUG`     | `4x2`        | `['4x2']`       |

*(Note: `4x2` is the standard wide banner, `2x2` is the small square)*

#### 4. Interaction Details
- **Long Press**: Implement a `useLongPress` hook (approx 500ms threshold) on the Location Trigger.
- **Drag Constraint**: Dragging is **STRICTLY DISABLED** unless `isEditing === true`. Long-pressing a widget in normal mode should NOT start a drag.
- **Shake Animation**: CSS keyframe animation applied to `.widget-card` only when `isEditing === true`.
- **Drag & Drop Implementation**:
  - **Overlay**: The `DragOverlay` **must** receive the dynamic position/transform styles from the library to track the cursor.
  - **Live Reordering (Ghost)**: As the user drags the overlay, the "ghost" slot (the empty space in the grid) must visually move to the potential drop position immediately. The user should see the grid rearrange itself *while* dragging.
  - **Stability**:
    - **Throttling**: The reordering logic (`moveItemLocally`) must be throttled (e.g., 150ms cooldown) to prevent "jitter loops" while still running immediately on the first drag-over event for each new target. This ensures the grid reacts as soon as the cursor hovers over any slot (including the original position) and avoids the dead-zone where the ghost cannot return to its source during a continuous hover.
    - **Layout Sync**: Because the DnD library caches each widget's bounding box, any manual DOM reorder must be followed by a `recomputeLayouts` call so the cached layouts stay in sync. Otherwise, collision detection keeps pointing at the old coordinates and the ghost cannot target the widget's original spot even though the DOM has moved.
    - **Ghost Interaction**: The ghost element in the grid must have `pointer-events: none` to ensure the cursor interacts with the underlying drop targets (other widgets), not the ghost itself.
    - **Transforms**: Do not apply CSS transforms to grid items during live reordering; rely on physical DOM order changes.
  - **Commit Strategy**: Reordering logic must occur in `onDragOver` (live mutation) to ensure the "ghost" slot moves visibly. `onDragEnd` triggers storage save (`persistLayout`).
  - **Collision Detection**: Switch to `closestCorners` (instead of `closestCenter`) to prevent the "dead zone" bug where the original position becomes undroppable during live layout updates.
  - **Touch Action**: Ensure `touch-action: none` is applied to draggable elements to prevent scrolling while dragging.
- **Tap-to-Resize**:
  - In Edit Mode, `onClick` on a widget **stops propagation** to internal widget logic.
  - Instead, it triggers `cycleWidgetSize(id)`.
  - **Constraint**: The resize action MUST NOT trigger if the user was dragging the widget. Ensure `onClick` is ignored if a drag operation just completed.
  - Logic: Find current size index in `supportedSizes`, increment, update state.
