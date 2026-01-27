// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { SolarTimesWidget } from "./SolarTimesWidget";

const mockSolar = {
  sunrise: new Date(2026, 0, 26, 7, 12, 0),
  sunset: new Date(2026, 0, 26, 17, 48, 0),
  dawn: new Date(2026, 0, 26, 6, 30, 0),
  dusk: new Date(2026, 0, 26, 18, 30, 0),
  solarNoon: new Date(2026, 0, 26, 12, 30, 0),
  dayLength: 38280,
};

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    solar: () => mockSolar,
    cycle: () => "day",
  }),
}));

describe("SolarTimesWidget", () => {
  it("renders detailed view when size is 4x2", () => {
    const { container } = render(() => <SolarTimesWidget size="4x2" />);
    expect(container.querySelector(".solar-times-widget--detailed")).not.toBeNull();
    expect(screen.getByText("Sunset")).toBeDefined();
    expect(screen.getByText("Night Start")).toBeDefined();
    expect(screen.getByText("17:48")).toBeDefined();
    expect(screen.getByText("18:30")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    const { container } = render(() => <SolarTimesWidget size="2x2" />);
    expect(container.querySelector(".solar-times-widget--compact")).not.toBeNull();
    expect(screen.getByText("Sunset")).toBeDefined();
    expect(screen.getByText("17:48")).toBeDefined();
    expect(screen.queryByText("Night Start")).toBeNull();
  });

  it("announces updates via aria-live", () => {
    const { container } = render(() => <SolarTimesWidget size="2x2" />);
    const card = container.querySelector('[aria-label="Solar times"]');
    expect(card?.getAttribute("aria-live")).toBe("polite");
    expect(card?.getAttribute("role")).toBe("region");
  });
});
