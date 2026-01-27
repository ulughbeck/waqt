// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeParallaxOffset, createSkyParallax } from "./skyParallax";

describe("skyParallax", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "pageYOffset", {
      value: 0,
      writable: true,
      configurable: true,
    });

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("computes parallax offset with optional clamp", () => {
    expect(computeParallaxOffset(100, 0.3)).toBe(30);
    expect(computeParallaxOffset(100, 0.3, 20)).toBe(20);
    expect(computeParallaxOffset(-200, 0.5, 50)).toBe(-50);
  });

  it("updates css variable based on scroll", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    const cleanup = createSkyParallax(target, { factor: 0.5, maxOffset: 120 });

    (window.scrollY as number) = 200;
    window.dispatchEvent(new Event("scroll"));

    expect(target.style.getPropertyValue("--sky-parallax-offset")).toBe("100px");

    (window.scrollY as number) = 400;
    window.dispatchEvent(new Event("scroll"));

    expect(target.style.getPropertyValue("--sky-parallax-offset")).toBe("120px");

    cleanup();
  });
});
