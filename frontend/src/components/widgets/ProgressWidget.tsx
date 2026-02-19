import { Show, createMemo, For } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import { formatCountdown, formatWidgetTime } from "../../services/format";
import "./ProgressWidget.css";

const SEGMENT_COUNT = 24;

export const PROGRESS_SEGMENT_COLORS = [
  "#4A90D9", "#6BB3E0",
  "#FF6B35", "#FF7438", "#FF7E3D", "#FF8C42", "#FF9A4C",
  "#FFA84F", "#FFB552", "#FFC55A", "#FFD700", "#FFDF33",
  "#FFDF33", "#FFD700", "#FFC55A", "#FFB552", "#FFA84F",
  "#FF9A4C", "#FF8C42", "#FF7E3D", "#FF7438", "#FF6B35",
  "#6BB3E0", "#4A90D9",
];

export function ProgressWidget(props: WidgetProps) {
  const { cycle, helpers, time } = useTime();
  const isNight = createMemo(() => cycle() === "night");
  const phaseLabel = createMemo(() => (isNight() ? "Night" : "Day"));

  const window = createMemo(() =>
    isNight() ? helpers.getNightWindow() : helpers.getDayWindow()
  );

  const hasValidWindow = createMemo(() => {
    const w = window();
    return Boolean(w && w.end.getTime() > w.start.getTime());
  });

  const progress = createMemo(() => {
    if (!hasValidWindow()) return 0.5;

    const now = time().getTime();
    const w = window()!;
    const start = w.start.getTime();
    const end = w.end.getTime();

    return Math.max(0, Math.min(1, (now - start) / (end - start)));
  });

  const timeLabels = createMemo(() => {
      if (!hasValidWindow()) return { start: "--:--", end: "--:--" };
      const w = window()!;
      return { start: formatWidgetTime(w.start), end: formatWidgetTime(w.end) };
  });

  const remainingSeconds = createMemo(() => {
    if (!hasValidWindow()) return 0;
    const now = time().getTime();
    const end = window()!.end.getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  const countdownText = createMemo(() => {
    if (!hasValidWindow()) return "Sunrise/Sunset unavailable";
    return `${phaseLabel()} ends ${formatCountdown(remainingSeconds())}`;
  });

  const progressAriaLabel = createMemo(() => {
    if (!hasValidWindow()) return `${phaseLabel()} progress unavailable`;
    return `${phaseLabel()} progress: ${Math.round(progress() * 100)}% complete`;
  });

  const liveModeLabel = createMemo(() => {
    if (!hasValidWindow()) return `${phaseLabel()} progress unavailable`;
    return `${phaseLabel()} progress mode`;
  });

  const segmentColors = createMemo(() => PROGRESS_SEGMENT_COLORS);

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
               {phaseLabel()}
            </div>
            <div class="progress-widget__compact-value">
              {hasValidWindow() ? `${Math.round(progress() * 100)}%` : "Unavailable"}
            </div>
          </div>
        }
      >
        <div class="progress-widget progress-widget--detailed">
          <span class="sr-only" aria-live="polite">
            {liveModeLabel()}
          </span>
          <div class="progress-bar__time-labels">
            <span>{timeLabels().start}</span>
            <span>{timeLabels().end}</span>
          </div>
          
          <div
            class="progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progress() * 100)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={progressAriaLabel()}
          >
             <For each={Array(SEGMENT_COUNT).fill(0)}>
               {(_, i) => (
                  <div class="progress-bar__segment" 
                       aria-hidden="true"
                       style={{ 
                         opacity: ((i() + 1) / SEGMENT_COUNT) > progress() ? 0.3 : 1,
                         "background-color": segmentColors()[i()]
                       }} 
                  />
               )}
             </For>
             <div class="progress-bar__playhead" style={{ left: `${progress() * 100}%` }} />
          </div>

          <div class="progress-widget__countdown">
             {countdownText()}
          </div>
        </div>
      </Show>
    </WidgetCard>
  );
}
