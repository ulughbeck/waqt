// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { ProgressWidget, PROGRESS_SEGMENT_COLORS } from "./ProgressWidget";

const dayStart = new Date(2026, 0, 26, 6, 0, 0);
const dayEnd = new Date(2026, 0, 26, 18, 0, 0);
const now = new Date(2026, 0, 26, 12, 0, 0);
const mockState = vi.hoisted(() => ({
  cycle: "day" as "day" | "night",
}));

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    cycle: () => mockState.cycle,
    time: () => now,
    helpers: {
      getDayWindow: () => ({ start: dayStart, end: dayEnd }),
      getNightWindow: () => ({ start: dayEnd, end: dayStart }),
    },
  }),
}));

describe("ProgressWidget", () => {
  it("uses unified segment palette with 2 blue edge segments", () => {
    expect(PROGRESS_SEGMENT_COLORS).toHaveLength(24);
    expect(PROGRESS_SEGMENT_COLORS[0]).toBe("#4A90D9");
    expect(PROGRESS_SEGMENT_COLORS[1]).toBe("#6BB3E0");
    expect(PROGRESS_SEGMENT_COLORS[22]).toBe("#6BB3E0");
    expect(PROGRESS_SEGMENT_COLORS[23]).toBe("#4A90D9");
  });

  it("renders detailed view when size is 4x2", () => {
    mockState.cycle = "day";
    const { container } = render(() => <ProgressWidget size="4x2" />);
    expect(container.querySelector(".progress-widget--detailed")).not.toBeNull();
    expect(container.querySelector("[role=\"progressbar\"]")).not.toBeNull();
    expect(screen.getByText("06:00")).toBeDefined();
    expect(screen.getByText("18:00")).toBeDefined();
    expect(screen.getByText("Day ends in 6h")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    mockState.cycle = "day";
    const { container } = render(() => <ProgressWidget size="2x2" />);
    expect(container.querySelector(".progress-widget--compact")).not.toBeNull();
    expect(screen.getByText("Day")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });

  it("renders night mode using the same unified palette", () => {
    mockState.cycle = "night";
    const { container } = render(() => <ProgressWidget size="4x2" />);
    const segments = Array.from(container.querySelectorAll(".progress-bar__segment"));
    const progressbar = container.querySelector('[role="progressbar"]');

    expect(segments).toHaveLength(24);
    expect(progressbar?.getAttribute("aria-label")).toContain("Night progress");
  });
});
