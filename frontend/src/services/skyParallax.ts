export interface SkyParallaxOptions {
  factor?: number;
  maxOffset?: number;
  cssVar?: string;
}

export function computeParallaxOffset(
  scrollY: number,
  factor: number,
  maxOffset?: number
) {
  const raw = scrollY * factor;
  if (typeof maxOffset === "number") {
    return Math.max(-maxOffset, Math.min(raw, maxOffset));
  }
  return raw;
}

export function createSkyParallax(
  target: HTMLElement,
  options: SkyParallaxOptions = {}
) {
  const factor = options.factor ?? 0.35;
  const maxOffset = options.maxOffset;
  const cssVar = options.cssVar ?? "--sky-parallax-offset";
  let rafId = 0;
  let ticking = false;
  let latestScroll = 0;

  const update = () => {
    ticking = false;
    const offset = computeParallaxOffset(latestScroll, factor, maxOffset);
    target.style.setProperty(cssVar, `${Math.round(offset)}px`);
  };

  const onScroll = () => {
    latestScroll = window.scrollY || window.pageYOffset || 0;
    if (!ticking) {
      ticking = true;
      rafId = requestAnimationFrame(update);
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    if (rafId) cancelAnimationFrame(rafId);
  };
}
