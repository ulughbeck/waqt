import { describe, it, expect } from "vitest";
import { getMoonShadowPath } from "./SkyOrbiter";

describe("getMoonShadowPath", () => {
  it("should generate correct path for New Moon (phase 0)", () => {
    // Phase 0: Waxing (<=0.5). dx = 50. Sweep 0 (CCW).
    // Main: Left Semicircle.
    // Term: dx=50. rx=50. Sweep 0 (Bulge Right).
    // Path: Left + Right = Full Shadow.
    const path = getMoonShadowPath(0);
    expect(path).toContain("M 50 0 A 50 50 0 0 0 50 100"); // Main Arc Left
    expect(path).toContain("A 50 50 0 0 0 50 0"); // Sweep 0
  });

  it("should generate correct path for Full Moon (phase 0.5)", () => {
    // Phase 0.5: Waxing (<=0.5). dx = -50. Sweep 1 (CW).
    // Main: Left Semicircle.
    // Term: dx=-50. rx=50. Sweep 1 (Bulge Left).
    // Path: Left + Left = No Shadow (Zero area).
    const path = getMoonShadowPath(0.5);
    expect(path).toContain("M 50 0 A 50 50 0 0 0 50 100");
    expect(path).toContain("A 50 50 0 0 1 50 0"); // Sweep 1
  });

  it("should generate correct path for First Quarter (phase 0.25)", () => {
    // Phase 0.25: Waxing. dx = 0. Sweep 1.
    const path = getMoonShadowPath(0.25);
    expect(path).toContain("M 50 0 A 50 50 0 0 0 50 100");
    // Sweep 1 because phase >= 0.25
    expect(path).toContain("A 0 50 0 0 1 50 0");
  });
  
  it("should generate correct path for Last Quarter (phase 0.75)", () => {
    // Phase 0.75: Waning (>0.5). dx = 0. Sweep 1.
    const path = getMoonShadowPath(0.75);
    expect(path).toContain("M 50 0 A 50 50 0 0 1 50 100"); // Main Arc Right
    // Sweep 1 because phase >= 0.75
    expect(path).toContain("A 0 50 0 0 1 50 0");
  });
});
