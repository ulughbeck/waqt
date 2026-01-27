import { describe, it, expect } from "vitest";
import { getSkyGradientCss, getSkyGradientStops } from "./skyGradients";

describe("skyGradients", () => {
  it("builds CSS gradients from the canonical stops", () => {
    const css = getSkyGradientCss("dawn");
    const stops = getSkyGradientStops("dawn");

    expect(css).toContain("linear-gradient(");
    expect(css).toContain("to bottom");
    expect(css).toContain(stops[0].color);
    expect(css).toContain(stops[stops.length - 1].color);
  });
});
