import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@solidjs/testing-library";
import { LayoutProvider, reconcileLayoutWithDefaults, useLayout } from "./LayoutProvider";

const STORAGE_KEY = "waqt.layout";

describe("LayoutProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses default layout when no saved layout exists", () => {
    const { result } = renderHook(() => useLayout(), { wrapper: LayoutProvider });

    const types = result.layout().map((widget) => widget.type);
    expect(types).toEqual(["PROGRESS", "YEAR_MAP", "SOLAR", "SEASON", "PRAYER", "DEBUG"]);
  });

  it("appends missing widgets from default layout after saved widgets", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: "prayer-custom", type: "PRAYER", size: "2x2" },
        { id: "progress-custom", type: "PROGRESS", size: "4x2" },
      ])
    );

    const { result } = renderHook(() => useLayout(), { wrapper: LayoutProvider });

    expect(result.layout().map((widget) => widget.type)).toEqual([
      "PRAYER",
      "PROGRESS",
      "YEAR_MAP",
      "SOLAR",
      "SEASON",
      "DEBUG",
    ]);
  });

  it("normalizes unsupported saved sizes to widget defaults", () => {
    const reconciled = reconcileLayoutWithDefaults([
      { id: "year-map-custom", type: "YEAR_MAP", size: "2x2" },
    ]);

    expect(reconciled[0]).toEqual({
      id: "year-map-custom",
      type: "YEAR_MAP",
      size: "4x2",
    });
  });

  it("ignores unknown widget types from saved layouts", () => {
    const reconciled = reconcileLayoutWithDefaults([
      { id: "bad", type: "UNKNOWN", size: "4x2" },
      { id: "progress-custom", type: "PROGRESS", size: "4x2" },
    ]);

    expect(reconciled.some((widget) => widget.id === "bad")).toBe(false);
    expect(reconciled[0].type).toBe("PROGRESS");
  });
});
