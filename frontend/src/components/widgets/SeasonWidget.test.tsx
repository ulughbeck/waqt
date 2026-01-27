// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { SeasonWidget } from "./SeasonWidget";

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    season: () => "spring",
  }),
}));

describe("SeasonWidget", () => {
  it("renders detailed view when size is 4x2", () => {
    const { container } = render(() => <SeasonWidget size="4x2" />);
    expect(container.querySelector(".season-widget--detailed")).not.toBeNull();
    expect(screen.getByText("Current Season")).toBeDefined();
    expect(screen.getByText("spring")).toBeDefined();
    expect(screen.getByText("Ends in 25 days")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    const { container } = render(() => <SeasonWidget size="2x2" />);
    expect(container.querySelector(".season-widget--compact")).not.toBeNull();
    expect(screen.getByText("Ends in 25d")).toBeDefined();
    expect(screen.queryByText("Current Season")).toBeNull();
  });
});
