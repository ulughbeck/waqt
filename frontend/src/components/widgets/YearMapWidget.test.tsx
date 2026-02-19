// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { YearMapWidget } from "./YearMapWidget";

const now = new Date("2026-02-19T12:00:00");

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    time: () => now,
  }),
}));

describe("YearMapWidget", () => {
  it("renders year map in 4x2 size", () => {
    const { container } = render(() => <YearMapWidget size="4x2" />);

    expect(container.querySelectorAll(".year-map-widget__cell").length).toBe(365);
    expect(container.querySelectorAll(".year-map-widget__cell--today").length).toBe(1);
    expect(screen.getByText("315d left")).toBeDefined();
    expect(screen.getByText("14%")).toBeDefined();
    expect(container.querySelector(".year-map-widget__compact-grid")).toBeNull();
  });
});
