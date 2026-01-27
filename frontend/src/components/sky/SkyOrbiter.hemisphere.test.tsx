import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import { SkyOrbiter } from "./SkyOrbiter";
import * as LocationProvider from "../../providers/LocationProvider";
import * as TimeProvider from "~/providers/useTime";
import * as DebugProvider from "../../providers/DebugProvider";

// Mock dependencies
vi.mock("../../providers/LocationProvider", () => ({
  useLocation: vi.fn(),
}));
vi.mock("~/providers/useTime", () => ({
  useTime: vi.fn(),
}));
vi.mock("../../providers/DebugProvider", () => ({
  useDebug: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

describe("SkyOrbiter Hemisphere Support", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        
        // Default mocks
        (DebugProvider.useDebug as any).mockReturnValue({
            state: () => ({ enabled: false })
        });
        
        (TimeProvider.useTime as any).mockReturnValue({
             orbit: () => ({ sun: 0.5, moon: 0.5 }),
             solar: () => ({}),
             cycle: () => "night",
             moonPhase: () => ({ phase: 0.1, fraction: 0.1 }), // Waxing Crescent
        });
    });

    it("sets --moon-scale-x to 1 for Northern Hemisphere", () => {
        (LocationProvider.useLocation as any).mockReturnValue({
            location: () => ({ lat: 40, lon: 0 }) // North
        });

        const { container } = render(() => <SkyOrbiter />);
        
        // Wait for rendering? Solid effects are synchronous usually unless suspended.
        // SkyOrbiter renders moon if cycle is night.
        const moon = container.querySelector(".sky-orbiter__moon") as HTMLElement;
        expect(moon).not.toBeNull();
        
        // Check CSS variable
        // JSDOM might not parse style objects into style.getPropertyValue if set via attribute?
        // SolidJS sets style attribute string or properties.
        // Let's check the outerHTML or style attribute.
        expect(moon.style.getPropertyValue("--moon-scale-x")).toBe("1");
    });

    it("sets --moon-scale-x to -1 for Southern Hemisphere", () => {
         (LocationProvider.useLocation as any).mockReturnValue({
            location: () => ({ lat: -33, lon: 151 }) // Sydney
        });

        const { container } = render(() => <SkyOrbiter />);
        const moon = container.querySelector(".sky-orbiter__moon") as HTMLElement;
        expect(moon).not.toBeNull();
        
        expect(moon.style.getPropertyValue("--moon-scale-x")).toBe("-1");
    });
    
    it("defaults to Northern Hemisphere (1) if location is null", () => {
         (LocationProvider.useLocation as any).mockReturnValue({
            location: () => null
        });

        const { container } = render(() => <SkyOrbiter />);
        const moon = container.querySelector(".sky-orbiter__moon") as HTMLElement;
        expect(moon.style.getPropertyValue("--moon-scale-x")).toBe("1");
    });
});
