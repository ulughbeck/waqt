import { describe, it, expect, vi } from "vitest";
import { render } from "@solidjs/testing-library";
import { WidgetGrid } from "./WidgetGrid";

const mockState = vi.hoisted(() => ({
  layout: [{ id: "w1", type: "PRAYER", size: "2x2" }] as Array<{
    id: string;
    type:
      | "PRAYER"
      | "SOLAR"
      | "SEASON"
      | "PROGRESS"
      | "YEAR_MAP"
      | "DEBUG";
    size: "2x2" | "4x2";
  }>,
  debugEnabled: false,
}));

// Mock the dependencies
vi.mock("~/providers/LayoutProvider", () => ({
  useLayout: () => ({
    layout: () => mockState.layout,
    updateLayout: vi.fn(),
    isEditing: () => false,
    persistLayout: vi.fn(),
    cycleWidgetSize: vi.fn(),
  }),
}));

vi.mock("~/providers/DebugProvider", () => ({
  useDebug: () => ({
    state: () => ({ enabled: mockState.debugEnabled }),
  }),
}));

// Mock the widgets to avoid rendering deep trees
vi.mock("../widgets", () => ({
  PrayerWidget: () => <div data-testid="prayer-widget">Prayer Widget</div>,
  SeasonWidget: () => <div data-testid="season-widget">Season Widget</div>,
  SolarTimesWidget: () => <div data-testid="solar-widget">Solar Widget</div>,
  ProgressWidget: () => <div data-testid="progress-widget">Progress Widget</div>,
  YearMapWidget: () => <div data-testid="year-map-widget">Year Map Widget</div>,
  DebugWidget: () => <div data-testid="debug-widget">Debug Widget</div>,
}));

describe("WidgetGrid", () => {
  describe("rendering", () => {
    it("renders configured widgets", () => {
      mockState.layout = [{ id: "w1", type: "PRAYER", size: "2x2" }];
      mockState.debugEnabled = false;
      const { getByTestId } = render(() => <WidgetGrid />);
      expect(getByTestId("prayer-widget")).toBeDefined();
    });

    it("has widget-grid class", () => {
      mockState.layout = [{ id: "w1", type: "PRAYER", size: "2x2" }];
      mockState.debugEnabled = false;
      const { container } = render(() => <WidgetGrid />);
      const grid = container.querySelector(".widget-grid");
      expect(grid).not.toBeNull();
    });

    it("renders debug widget first when debug mode is enabled", () => {
      mockState.layout = [
        { id: "w1", type: "PRAYER", size: "2x2" },
        { id: "debug-1", type: "DEBUG", size: "4x2" },
        { id: "w2", type: "SOLAR", size: "2x2" },
      ];
      mockState.debugEnabled = true;

      const { container, getByTestId } = render(() => <WidgetGrid />);
      expect(getByTestId("debug-widget")).toBeDefined();

      const firstWidget = container.querySelector(
        ".widget-grid .sortable-widget:first-child [data-testid]"
      );
      expect(firstWidget?.getAttribute("data-testid")).toBe("debug-widget");
    });
  });
});
