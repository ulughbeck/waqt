// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { ProgressWidget } from "./ProgressWidget";

const dayStart = new Date(2026, 0, 26, 6, 0, 0);
const dayEnd = new Date(2026, 0, 26, 18, 0, 0);
const now = new Date(2026, 0, 26, 12, 0, 0);

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    cycle: () => "day",
    time: () => now,
    helpers: {
      getDayWindow: () => ({ start: dayStart, end: dayEnd }),
      getNightWindow: () => null,
    },
  }),
}));

describe("ProgressWidget", () => {
  it("renders detailed view when size is 4x2", () => {
    const { container } = render(() => <ProgressWidget size="4x2" />);
    expect(container.querySelector(".progress-widget--detailed")).not.toBeNull();
    expect(container.querySelector("[role=\"progressbar\"]")).not.toBeNull();
    expect(screen.getByText("06:00")).toBeDefined();
    expect(screen.getByText("18:00")).toBeDefined();
    expect(screen.getByText("Day ends in ...")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    const { container } = render(() => <ProgressWidget size="2x2" />);
    expect(container.querySelector(".progress-widget--compact")).not.toBeNull();
    expect(screen.getByText("Day")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });
});
