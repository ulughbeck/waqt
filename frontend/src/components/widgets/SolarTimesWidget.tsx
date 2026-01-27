import { Show, createMemo } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import { formatWidgetTime } from "../../services/format";
import "./SolarTimesWidget.css";

export function SolarTimesWidget(props: WidgetProps) {
  const { solar, cycle } = useTime();

  const isNight = createMemo(() => cycle() === 'night');

  const data = createMemo(() => {
    const s = solar();
    if (!s) return null;
    
    if (isNight()) {
      return [
        { label: "Sunrise", time: s.sunrise, type: "gold", icon: "sun" },
        { label: "Night End", time: s.dawn, type: "pink", icon: "moon" }
      ];
    } else {
       return [
        { label: "Sunset", time: s.sunset, type: "gold", icon: "sun" },
        { label: "Night Start", time: s.dusk, type: "pink", icon: "moon" }
      ];
    }
  });

  return (
    <WidgetCard 
      colSpan={props.size === '4x2' ? 4 : 2} 
      rowSpan={2}
      role="region"
      aria-label="Solar times"
      aria-live="polite"
    >
      <Show when={data()}>
        {(items) => (
          <Show
            when={props.size === '4x2'}
            fallback={
              <div class="solar-times-widget solar-times-widget--compact">
                {/* Show first item (next event) */}
                <div class="solar-times__icon" style={{ color: items()[0].type === 'gold' ? '#FFD700' : '#FF4D94' }}>
                   {items()[0].icon === 'sun' ? (
                     <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2"/></svg>
                   ) : (
                     <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 0 9-9z"/></svg>
                   )}
                </div>
                <div class="solar-times__label">{items()[0].label}</div>
                <div class={`solar-times__time solar-times__time--${items()[0].type}`}>
                  {formatWidgetTime(items()[0].time)}
                </div>
              </div>
            }
          >
            <div class="solar-times-widget solar-times-widget--detailed">
              {items().map((item) => (
                <div class="solar-times__row">
                   <div class="solar-times__icon" style={{ color: item.type === 'gold' ? '#FFD700' : '#FF4D94' }}>
                     {item.icon === 'sun' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2"/></svg>
                     ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 0 9-9z"/></svg>
                     )}
                   </div>
                   <div class="solar-times__label">{item.label}</div>
                   <div class={`solar-times__time solar-times__time--${item.type}`}>
                     {formatWidgetTime(item.time)}
                   </div>
                </div>
              ))}
            </div>
          </Show>
        )}
      </Show>
    </WidgetCard>
  );
}
