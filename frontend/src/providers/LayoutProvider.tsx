import { createSignal, createContext, useContext, JSX, onMount } from "solid-js";
import { WidgetDefinition, WidgetSize, WIDGET_REGISTRY } from "../components/widgets/types";

interface LayoutContextValue {
  layout: () => WidgetDefinition[];
  isEditing: () => boolean;
  toggleEditMode: () => void;
  saveLayout: () => void;
  persistLayout: () => void;
  updateLayout: (newLayout: WidgetDefinition[]) => void;
  cycleWidgetSize: (id: string) => void;
}

const LayoutContext = createContext<LayoutContextValue>();

const STORAGE_KEY = "waqt.layout";

const DEFAULT_LAYOUT: WidgetDefinition[] = [
  { id: "progress-1", type: "PROGRESS", size: "4x2" },
  { id: "year-map-1", type: "YEAR_MAP", size: "4x2" },
  { id: "solar-1", type: "SOLAR", "size": "2x2" },
  { id: "season-1", type: "SEASON", "size": "2x2" },
  { id: "prayer-1", type: "PRAYER", size: "4x2" },
  { id: "debug-1", type: "DEBUG", size: "4x2" },
];

export function LayoutProvider(props: { children: JSX.Element }) {
  const [layout, setLayout] = createSignal<WidgetDefinition[]>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = createSignal(false);

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLayout(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse layout from localStorage", e);
      }
    }
  });

  const saveLayout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout()));
    setIsEditing(false);
  };

  const persistLayout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout()));
  };

  const toggleEditMode = () => {
    if (isEditing()) {
      saveLayout();
    } else {
      setIsEditing(true);
    }
  };

  const updateLayout = (newLayout: WidgetDefinition[]) => {
    setLayout(newLayout);
  };

  const cycleWidgetSize = (id: string) => {
    if (!isEditing()) return;

    setLayout((prev) =>
      prev.map((widget) => {
        if (widget.id === id) {
          const registry = WIDGET_REGISTRY[widget.type];
          const currentIndex = registry.supportedSizes.indexOf(widget.size);
          const nextIndex = (currentIndex + 1) % registry.supportedSizes.length;
          return { ...widget, size: registry.supportedSizes[nextIndex] };
        }
        return widget;
      })
    );
  };

  return (
    <LayoutContext.Provider
      value={{
        layout,
        isEditing,
        toggleEditMode,
        saveLayout,
        persistLayout,
        updateLayout,
        cycleWidgetSize,
      }}
    >
      {props.children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
