// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { DebugWidget } from "./DebugWidget";

// Mock TimeProvider
vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    time: () => new Date("2023-01-01T12:00:00Z"),
    cycle: () => "day",
    orbit: () => ({ sun: 0.5, moon: 0 }),
    helpers: {
      currentGradient: () => "linear-gradient(to bottom, #000 0%, #fff 100%)"
    }
  })
}));

// Mock DebugProvider
vi.mock("../../providers/DebugProvider", () => ({
  useDebug: () => ({
    state: () => ({
      enabled: true,
      timeOverride: { active: false, speed: 1 }
    })
  })
}));

// Mock LocationProvider
vi.mock("../../providers/LocationProvider", () => ({
  useLocation: () => ({
    location: () => ({ lat: 0, lon: 0 })
  })
}));

describe("DebugWidget", () => {
  it("renders detailed view when size is 4x2", () => {
    render(() => <DebugWidget size="4x2" />);
    expect(screen.getByText("TERMINAL")).toBeDefined();
    // Check for some fields
    expect(screen.getByText("Cycle:")).toBeDefined();
    expect(screen.getByText("Sun Alt:")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    render(() => <DebugWidget size="2x2" />);
    expect(screen.getByText("DEBUG")).toBeDefined();
    // Should NOT show "TERMINAL"
    expect(screen.queryByText("TERMINAL")).toBeNull();
  });
});
