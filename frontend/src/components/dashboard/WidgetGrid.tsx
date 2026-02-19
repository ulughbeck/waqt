import { For, Show, createMemo, createSignal, createEffect, onMount } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  closestCorners,
  transformStyle,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import { useLayout } from "~/providers/LayoutProvider";
import { useDebug } from "~/providers/DebugProvider";
import {
  PrayerWidget,
  SeasonWidget,
  SolarTimesWidget,
  ProgressWidget,
  YearMapWidget,
  DebugWidget,
} from "../widgets";
import { WidgetType, WidgetDefinition } from "../widgets/types";
import "./WidgetGrid.css";

const WidgetMap: Record<WidgetType, (props: { size: any }) => any> = {
  PRAYER: PrayerWidget,
  SOLAR: SolarTimesWidget,
  SEASON: SeasonWidget,
  PROGRESS: ProgressWidget,
  YEAR_MAP: YearMapWidget,
  DEBUG: DebugWidget,
};

function prioritizeDebugWidget(
  widgets: WidgetDefinition[],
  debugEnabled: boolean
): WidgetDefinition[] {
  if (!debugEnabled) return widgets;

  const debugWidget = widgets.find((widget) => widget.type === "DEBUG");
  if (!debugWidget) return widgets;

  return [
    debugWidget,
    ...widgets.filter((widget) => widget.id !== debugWidget.id),
  ];
}

const SortableWidget = (props: { item: WidgetDefinition }) => {
  const sortable = createSortable(props.item.id);
  const { isEditing, cycleWidgetSize } = useLayout();
  const Component = WidgetMap[props.item.type];

  const handleClick = (e: MouseEvent) => {
    if (isEditing()) {
      e.stopPropagation();
      e.preventDefault();
      cycleWidgetSize(props.item.id);
    }
  };

  const spanClass = props.item.size === '4x2' ? 'col-span-4' : 'col-span-2';

  return (
    <div
      ref={sortable.ref}
      class={`sortable-widget ${spanClass} row-span-2 ${sortable.isActiveDraggable ? "opacity-25 pointer-events-none" : ""} ${
        isEditing() && !sortable.isActiveDraggable ? "cursor-move animate-shake" : ""
      }`}
      {...(isEditing() ? sortable.dragActivators : {})}
      onClick={handleClick}
    >
      <Component size={props.item.size} />
    </div>
  );
};

export function WidgetGrid() {
  const { layout, updateLayout, isEditing, persistLayout } = useLayout();
  const debug = useDebug();

  const [localLayout, setLocalLayout] = createSignal(
    prioritizeDebugWidget(layout(), debug.state().enabled)
  );

  createEffect(() => {
    setLocalLayout(prioritizeDebugWidget(layout(), debug.state().enabled));
  });

  const visibleWidgets = createMemo(() => {
    return layout().filter((w) => {
      if (w.type === "DEBUG" && !debug.state().enabled) return false;
      return true;
    });
  });

  const localVisibleWidgets = createMemo(() => {
    return localLayout().filter((w) => {
      if (w.type === "DEBUG" && !debug.state().enabled) return false;
      return true;
    });
  });

  const ids = createMemo(() => localVisibleWidgets().map((w) => w.id));

  return (
    <DragDropProvider collisionDetector={closestCorners}>
      <DragDropSensors />
      <WidgetGridDragHandler
        localLayout={localLayout}
        setLocalLayout={setLocalLayout}
        updateLayout={updateLayout}
        persistLayout={persistLayout}
      />
      <div class="widget-grid">
        <SortableProvider ids={ids()}>
          <For each={localVisibleWidgets()}>
            {(item) => <SortableWidget item={item} />}
          </For>
        </SortableProvider>
      </div>
      <DragOverlay>
        {(draggable) => {
            const item = visibleWidgets().find(w => w.id === draggable?.id);
            if (!item) return null;
            const Component = WidgetMap[item.type];
            const spanClass = item.size === '4x2' ? 'col-span-4' : 'col-span-2';
            return (
              <div 
                class={`widget-overlay ${spanClass} row-span-2`}
                style={draggable ? transformStyle(draggable.transform) : undefined}
              >
                 <Component size={item.size} />
          </div>
        );
      }}
    </DragOverlay>
  </DragDropProvider>
);
}

type WidgetGridDragHandlerProps = {
  localLayout: () => WidgetDefinition[];
  setLocalLayout: (layout: WidgetDefinition[]) => void;
  updateLayout: (newLayout: WidgetDefinition[]) => void;
  persistLayout: () => void;
};

const WidgetGridDragHandler = (props: WidgetGridDragHandlerProps) => {
  const context = useDragDropContext();
  if (!context) return null;

  const [, { onDragOver, onDragEnd, recomputeLayouts }] = context;
  const THROTTLE_MS = 150;
  let lastMoveTimestamp = 0;
  let lastMoveFrom: string | null = null;
  let lastMoveTo: string | null = null;

  const moveItemLocally = (fromId: string, toId: string) => {
    const now = performance.now();
    const isSamePair = lastMoveFrom === fromId && lastMoveTo === toId;

    if (isSamePair && now - lastMoveTimestamp < THROTTLE_MS) {
      return;
    }

    lastMoveTimestamp = now;
    lastMoveFrom = fromId;
    lastMoveTo = toId;

    const currentLayout = props.localLayout();
    const fromIndex = currentLayout.findIndex((w) => w.id === fromId);
    const toIndex = currentLayout.findIndex((w) => w.id === toId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const updated = [...currentLayout];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      props.setLocalLayout(updated);
      queueMicrotask(() => recomputeLayouts());
    }
  };

  onMount(() => {
    onDragOver(({ draggable, droppable }) => {
      if (draggable && droppable) {
        moveItemLocally(draggable.id, droppable.id);
      }
    });

    onDragEnd(({ draggable, droppable }) => {
      if (draggable && droppable) {
        props.updateLayout(props.localLayout());
        props.persistLayout();
      }
    });
  });

  return null;
};
