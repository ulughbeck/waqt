import { describe, it, expect, vi } from "vitest";
import { render } from "@solidjs/testing-library";
import { WidgetGrid } from "./WidgetGrid";

// Mock the dependencies
vi.mock("~/providers/LayoutProvider", () => ({
  useLayout: () => ({
    layout: () => [
       { id: "w1", type: "PRAYER", size: "2x2" }
    ],
    updateLayout: vi.fn(),
    isEditing: () => false,
    persistLayout: vi.fn(),
    cycleWidgetSize: vi.fn(),
  }),
}));

vi.mock("~/providers/DebugProvider", () => ({
  useDebug: () => ({
    state: () => ({ enabled: false }),
  }),
}));

// Mock the widgets to avoid rendering deep trees
vi.mock("../widgets", () => ({
  PrayerWidget: () => <div data-testid="prayer-widget">Prayer Widget</div>,
  SeasonWidget: () => <div />,
  SolarTimesWidget: () => <div />,
  ProgressWidget: () => <div />,
  DebugWidget: () => <div />,
}));

describe("WidgetGrid", () => {
  describe("rendering", () => {
    it("renders configured widgets", () => {
      const { getByTestId } = render(() => <WidgetGrid />);
      expect(getByTestId("prayer-widget")).toBeDefined();
    });

    it("has widget-grid class", () => {
      const { container } = render(() => <WidgetGrid />);
      const grid = container.querySelector(".widget-grid");
      expect(grid).not.toBeNull();
    });
  });
});
