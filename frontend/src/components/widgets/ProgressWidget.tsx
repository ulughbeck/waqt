import { Show, createMemo, For } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import { formatWidgetTime } from "../../services/format";
import "./ProgressWidget.css";

export function ProgressWidget(props: WidgetProps) {
  const { cycle, helpers, time } = useTime();

  // Basic progress calculation (simplified)
  const progress = createMemo(() => {
    const now = time().getTime();
    const window = cycle() === "night" ? helpers.getNightWindow() : helpers.getDayWindow();
    if (!window) return 0.5;
    
    const start = window.start.getTime();
    const end = window.end.getTime();
    if (end <= start) return 0.5;

    return Math.max(0, Math.min(1, (now - start) / (end - start)));
  });

  const timeLabels = createMemo(() => {
      const window = cycle() === "night" ? helpers.getNightWindow() : helpers.getDayWindow();
      if (!window) return { start: "--:--", end: "--:--" };
      return { start: formatWidgetTime(window.start), end: formatWidgetTime(window.end) };
  });

  return (
    <WidgetCard 
      colSpan={props.size === '4x2' ? 4 : 2} 
      rowSpan={2}
      aria-label="Daily progress"
    >
      <Show
        when={props.size === '4x2'}
        fallback={
          <div class="progress-widget progress-widget--compact">
            <div class="progress-widget__status">
               {cycle() === 'night' ? 'Night' : 'Day'}
            </div>
            <div>
               {Math.round(progress() * 100)}%
            </div>
          </div>
        }
      >
        <div class="progress-widget progress-widget--detailed">
          <div class="progress-bar__time-labels">
            <span>{timeLabels().start}</span>
            <span>{timeLabels().end}</span>
          </div>
          
          <div class="progress-bar" role="progressbar" aria-valuenow={Math.round(progress() * 100)} aria-valuemin="0" aria-valuemax="100">
             <For each={Array(24).fill(0)}>
               {(_, i) => (
                  <div class="progress-bar__segment" 
                       style={{ 
                         opacity: (i / 24) > progress() ? 0.3 : 1,
                         // TODO: Actual gradient colors
                         "background-color": cycle() === 'night' ? '#2B4A6F' : '#FFD700'
                       }} 
                  />
               )}
             </For>
             <div class="progress-bar__playhead" style={{ left: `${progress() * 100}%` }} />
          </div>

          <div class="progress-widget__countdown">
             {cycle() === 'night' ? 'Night' : 'Day'} ends in ...
          </div>
        </div>
      </Show>
    </WidgetCard>
  );
}
