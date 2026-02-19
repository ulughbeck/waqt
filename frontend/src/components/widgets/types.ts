export type WidgetSize = "2x2" | "4x2";

export type WidgetType =
  | "PRAYER"
  | "SOLAR"
  | "SEASON"
  | "PROGRESS"
  | "YEAR_MAP"
  | "DEBUG";

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  size: WidgetSize;
}

export interface WidgetProps {
  size: WidgetSize;
}

export const WIDGET_REGISTRY: Record<
  WidgetType,
  { defaultSize: WidgetSize; supportedSizes: WidgetSize[] }
> = {
  PRAYER: { defaultSize: "4x2", supportedSizes: ["4x2", "2x2"] },
  SOLAR: { defaultSize: "2x2", supportedSizes: ["2x2", "4x2"] },
  SEASON: { defaultSize: "2x2", supportedSizes: ["2x2", "4x2"] },
  PROGRESS: { defaultSize: "4x2", supportedSizes: ["4x2"] },
  YEAR_MAP: { defaultSize: "4x2", supportedSizes: ["4x2", "2x2"] },
  DEBUG: { defaultSize: "4x2", supportedSizes: ["4x2"] },
};
