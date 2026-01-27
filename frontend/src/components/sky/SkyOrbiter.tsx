import { createMemo, createSignal, onMount, onCleanup } from "solid-js";
import { useTime } from "~/providers/useTime";
import { useLocation } from "../../providers/LocationProvider";
import { useDebug } from "../../providers/DebugProvider";
import "./SkyOrbiter.css";

interface OrbiterPosition {
  x: number;
  y: number;
  scale: number;
  altitude: number;
}

interface SunColors {
  core: string;
  corona: string;
  glow: string;
  glowOpacity: number;
}

export function getMoonShadowPath(phase: number): string {
  // phase: 0..1 (0=New, 0.25=First Quarter, 0.5=Full, 0.75=Last Quarter)
  // We draw the SHADOW shape on top of the lit moon.
  
  const isWaxing = phase <= 0.5;
  
  // Main Semicircle (The "dark side" half)
  // Waxing (0->0.5): Shadow is on Left.
  // Waning (0.5->1): Shadow is on Right.
  const mainArc = isWaxing
    ? `M 50 0 A 50 50 0 0 0 50 100` // Left semicircle
    : `M 50 0 A 50 50 0 0 1 50 100`; // Right semicircle

  // Terminator X offset (varies from 50 to -50 relative to center)
  // dx = 50 * cos(phase * 2 * PI)
  let dx = 50 * Math.cos(phase * 2 * Math.PI);
  if (Math.abs(dx) < 0.01) dx = 0;
  const rx = Math.abs(dx);
  
  // Sweep flag for terminator arc (returning from bottom 100 to top 0)
  // Waxing:
  //   p < 0.25 (Crescent, dx>0): Shadow covers Center. Bulge Right. Sweep 1.
  //   p > 0.25 (Gibbous, dx<0): Shadow exposes Center. Bulge Left. Sweep 0.
  // Waning:
  //   p < 0.75 (Gibbous, dx<0): Shadow exposes Center. Bulge Right. Sweep 1.
  //   p > 0.75 (Crescent, dx>0): Shadow covers Center. Bulge Left. Sweep 0.
  
  let termSweep = 0;
  if (isWaxing) {
     termSweep = (phase < 0.25) ? 0 : 1;
  } else {
     termSweep = (phase < 0.75) ? 0 : 1;
  }
  
  // Path: Main Arc -> Terminator Arc back to start
  return `${mainArc} A ${rx} 50 0 0 ${termSweep} 50 0`;
}

export function SkyOrbiter() {
  const { orbit, solar, cycle, moonPhase } = useTime();
  const { location } = useLocation();
  const debug = useDebug();
  const [dimensions, setDimensions] = createSignal({
    width: typeof window !== "undefined" ? document.documentElement.clientWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const [isReady, setIsReady] = createSignal(false);

  onMount(() => {
    const handleResize = () => {
      setDimensions({
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      });
    };

    // Force initial measure to ensure accuracy before showing
    handleResize();

    // Use ResizeObserver to detect layout changes (more robust than window.resize)
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(document.body);

    // Fix: Wait for render cycle to ensure dimensions are applied before showing
    // Also re-measure dimensions inside RAF to catch any layout shifts or initial mis-reads
    requestAnimationFrame(() => {
      handleResize();
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    });

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  const skyHeight = createMemo(() => {
    const vh = dimensions().height;
    const width = dimensions().width;
    if (width > 1024) return vh * 0.42;
    if (width > 640) return vh * 0.41;
    return vh * 0.4;
  });

  const arcParams = createMemo(() => {
    const width = dimensions().width;
    
    // Responsive radius calculation
    // Mobile/Tablet: 40vw radius (80% width)
    // Desktop: 28vw radius (56% width)
    const isDesktop = width > 1024;
    const radiusMultiplier = isDesktop ? 0.28 : 0.40;
    
    let radiusX = width * radiusMultiplier;
    
    // Cap orbit width at 950px (radius at 475px)
    // AND apply Vertical Safety Constraint: radiusX <= skyHeight - 80px
    radiusX = Math.min(radiusX, 475, skyHeight() - 80);
    
    const heightRatio = 1.0;
    const radiusY = radiusX * heightRatio;
    const centerX = width / 2;
    const horizonY = skyHeight();

    return { radiusX, radiusY, centerX, horizonY };
  });

  const pathD = createMemo(() => {
    const { radiusX, radiusY, centerX, horizonY } = arcParams();

    return { radiusX, radiusY, centerX, horizonY };
  });

  const orbitPathStyle = createMemo(() => {
    const { radiusX, radiusY, horizonY } = arcParams();
    return {
      "--orbit-radius-x": `${radiusX}px`,
      "--orbit-radius-y": `${radiusY}px`,
      "--horizon-y": `${horizonY}px`,
    };
  });

  const sunPosition = createMemo((): OrbiterPosition => {
    const progress = orbit().sun;
    const { radiusX, radiusY, centerX, horizonY } = arcParams();

    const angle = Math.PI * (1 - progress);
    const x = centerX + radiusX * Math.cos(angle);
    const y = horizonY - radiusY * Math.sin(angle);

    const altitude = Math.sin(progress * Math.PI);
    const scale = 1 + 0.25 * (1 - altitude);

    return { x, y, scale, altitude };
  });

  const moonPosition = createMemo((): OrbiterPosition => {
    const progress = orbit().moon;
    const { radiusX, radiusY, centerX, horizonY } = arcParams();

    const angle = Math.PI * (1 - progress);
    const x = centerX + radiusX * Math.cos(angle);
    const y = horizonY - radiusY * Math.sin(angle);

    const altitude = Math.sin(progress * Math.PI);
    const scale = 1 + 0.25 * (1 - altitude);

    return { x, y, scale, altitude };
  });

  const sunColors = createMemo((): SunColors => {
    const { altitude } = sunPosition();

    if (altitude > 0.7) {
      return {
        core: "#ffffff",
        corona: "#fff8e0",
        glow: "rgba(255, 248, 224, 0.5)",
        glowOpacity: 0.8,
      };
    }
    if (altitude > 0.3) {
      return {
        core: "#ffffff",
        corona: "#ffd700",
        glow: "rgba(255, 215, 0, 0.5)",
        glowOpacity: 0.85,
      };
    }
    if (altitude > 0.1) {
      return {
        core: "#fffaf0",
        corona: "#ff6b00",
        glow: "rgba(255, 107, 0, 0.6)",
        glowOpacity: 0.9,
      };
    }
    return {
      core: "#ffe4c4",
      corona: "#ff4500",
      glow: "rgba(255, 69, 0, 0.7)",
      glowOpacity: 1,
    };
  });

  const moonOpacity = createMemo((): number => {
    const currentCycle = cycle();

    switch (currentCycle) {
      case "night":
        return 1;
      case "dusk":
        return 0.6;
      case "dawn":
        return 0.4;
      case "day":
        return 0;
      default:
        return 0;
    }
  });

  const moonGlowOpacity = createMemo((): number => {
    const mp = moonPhase();
    const fraction = mp ? mp.fraction : 1;
    // Glow intensity depends on phase (New Moon = 0, Full Moon = 1)
    return moonOpacity() * 0.6 * fraction;
  });

  const sunGlowOpacity = createMemo((): number => {
    const currentCycle = cycle();
    const { altitude } = sunPosition();

    if (currentCycle === "night") return 0;
    if (currentCycle === "dusk" || currentCycle === "dawn") {
      return 1;
    }
    return 0.6 + altitude * 0.4;
  });

  const sunStyle = createMemo(() => ({
    "--sun-x": `${sunPosition().x}px`,
    "--sun-y": `${sunPosition().y}px`,
    "--sun-scale": sunPosition().scale,
    "--sun-core-color": sunColors().core,
    "--sun-corona-color": sunColors().corona,
  }));

  const sunGlowStyle = createMemo(() => ({
    "--sun-x": `${sunPosition().x}px`,
    "--sun-y": `${sunPosition().y}px`,
    "--sun-glow-color": sunColors().glow,
    "--sun-glow-opacity": sunGlowOpacity(),
  }));

  const moonStyle = createMemo(() => {
    const mp = moonPhase();
    const loc = location();
    const isSouth = (loc?.lat ?? 0) < 0;
    
    let rotation = 0;
    if (mp) {
      // suncalc.angle is angle of bright limb from North (CW)
      // suncalc.parallacticAngle is angle of Zenith from North (CW)
      // Visual Angle (from Zenith) = angle - parallacticAngle
      const pa = mp.parallacticAngle ?? 0;
      const targetAngleDeg = (mp.angle - pa) * (180 / Math.PI);
      
      // Base orientation:
      // North: Waxing moon is drawn Right-Lit (90 deg).
      // South: Waxing moon is flipped (scaleX -1), so Left-Lit (180 deg? or 270/-90?).
      //   scaleX(-1) on Right(90) -> Left(180/270).
      //   Actually, scaleX(-1) flips X axis. 
      //   If we apply rotation AFTER scaleX, we rotate the flipped image.
      //   Flipped image has bright limb at 180 (Left).
      //   So Base = 180.
      
      const baseAngle = isSouth ? 180 : 90;
      rotation = targetAngleDeg - baseAngle;
    }

    return {
      "--moon-x": `${moonPosition().x}px`,
      "--moon-y": `${moonPosition().y}px`,
      "--moon-scale": moonPosition().scale,
      "--moon-scale-x": isSouth ? -1 : 1,
      "--moon-opacity": moonOpacity(),
      "--moon-rotation": `${rotation}deg`,
    };
  });

  const moonGlowStyle = createMemo(() => ({
    "--moon-x": `${moonPosition().x}px`,
    "--moon-y": `${moonPosition().y}px`,
    "--moon-glow-opacity": moonGlowOpacity(),
  }));

  const showSun = createMemo(() => cycle() !== "night");
  const showMoon = createMemo(() => moonOpacity() > 0);

  const moonShadowPath = createMemo(() => {
    const mp = moonPhase();
    const phase = mp ? mp.phase : 0.5; // Default to full moon if unknown
    return getMoonShadowPath(phase);
  });

  const shadowMask = createMemo(() => {
    const d = moonShadowPath();
    // Use base64 encoded SVG for mask to avoid character encoding issues
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="black" /></svg>`;
    return `url('data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(svg) : Buffer.from(svg).toString('base64')}')`;
  });

  return (
    <div
      class="sky-orbiter"
      style={{
        opacity: isReady() ? 1 : 0,
        transition: "opacity 0.2s",
        ...orbitPathStyle() as any,
      }}
    >
      <div class="sky-orbiter__path" />
      {showSun() && (
        <>
          <div class="sky-orbiter__sun-glow" style={sunGlowStyle()} />
          <div class="sky-orbiter__sun" style={sunStyle()}>
            <div class="sky-orbiter__sun-corona" />
            <div class="sky-orbiter__sun-core" />
          </div>
        </>
      )}

      {showMoon() && (
        <>
          <div class="sky-orbiter__moon-glow" style={moonGlowStyle()} />
          <div class="sky-orbiter__moon" style={moonStyle()}>
            <div class="sky-orbiter__moon-surface" />
            <div 
              class="sky-orbiter__moon-shadow"
              style={{
                "-webkit-mask-image": shadowMask(),
                "mask-image": shadowMask(),
                "-webkit-mask-size": "100% 100%",
                "mask-size": "100% 100%"
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
