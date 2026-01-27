import { createMemo, Show } from "solid-js";
import SunCalc from "suncalc";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { useDebug } from "../../providers/DebugProvider";
import { useLocation } from "../../providers/LocationProvider";
import { WidgetProps } from "./types";

export function DebugWidget(props: WidgetProps) {
  const timeCtx = useTime();
  const debug = useDebug();
  const { location } = useLocation();

  const sunAltitude = createMemo(() => {
    const loc = location();
    const t = timeCtx.time();
    if (!loc) return 0;
    
    // SunCalc.getPosition returns radians
    const pos = SunCalc.getPosition(t, loc.lat, loc.lon);
    return (pos.altitude * 180) / Math.PI;
  });

  const speed = createMemo(() => {
    const s = debug.state().timeOverride;
    return s.active ? `${s.speed}x` : "1x";
  });

  const gradientStr = createMemo(() => {
    return timeCtx.helpers.currentGradient();
  });

  const styles = {
    "font-family": "'JetBrains Mono', 'Fira Code', monospace",
    "font-size": "0.8rem",
    "line-height": "1.2",
    color: "#00ff00",
    display: "flex",
    "flex-direction": "column",
    height: "100%",
    width: "100%",
    padding: "4px"
  };

  return (
    <WidgetCard 
      colSpan={props.size === "4x2" ? 4 : 2} 
      rowSpan={2}
      class="debug-widget"
    >
      <div style={styles}>
        <Show when={props.size === "4x2"} fallback={
          // 2x2 Compact
          <div style={{ display: "flex", "flex-direction": "column", height: "100%", "justify-content": "space-between" }}>
             <div style={{ "font-weight": "bold", "border-bottom": "1px solid rgba(0,255,0,0.3)", "padding-bottom": "4px" }}>DEBUG</div>
             <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
               <div style={{ "text-transform": "uppercase" }}>{timeCtx.cycle()}</div>
               <div>{speed()}</div>
             </div>
          </div>
        }>
          {/* 4x2 Detailed */}
          <div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
             <div style={{ display: "flex", "justify-content": "space-between", "border-bottom": "1px solid rgba(0,255,0,0.3)", "padding-bottom": "4px", "margin-bottom": "8px" }}>
               <strong>TERMINAL</strong>
               <span>{speed()}</span>
             </div>
             
             <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", "gap": "4px 16px" }}>
                <div>Cycle:</div>
                <div style={{ "text-align": "right", "text-transform": "uppercase" }}>{timeCtx.cycle()}</div>

                <div>Sun Alt:</div>
                <div style={{ "text-align": "right" }}>{sunAltitude().toFixed(1)}°</div>

                <div>Moon Prog:</div>
                <div style={{ "text-align": "right" }}>{timeCtx.orbit().moon.toFixed(2)}</div>
                
                <div>Gradient:</div>
                <div style={{ "text-align": "right", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "max-width": "120px" }} title={gradientStr()}>
                  {gradientStr()}
                </div>
             </div>
          </div>
        </Show>
      </div>
    </WidgetCard>
  );
}
