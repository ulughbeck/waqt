import { Show, createMemo } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import "./SeasonWidget.css";

// Icons as simple circles for now with colors from spec
const SeasonIcon = (props: { season: string }) => {
  const colors: Record<string, string> = {
    spring: "#FF69B4",
    summer: "#FFD700",
    autumn: "#FF8C00",
    winter: "#87CEEB"
  };
  
  return (
    <div class="season-widget__icon" style={{ 
      "background-color": colors[props.season] || "#fff",
      "border-radius": "50%" 
    }} />
  );
};

export function SeasonWidget(props: WidgetProps) {
  const { season } = useTime();
  
  // TODO: Implement proper countdown logic based on location (hemisphere)
  // For now using placeholder
  const daysLeft = 25; 

  return (
    <WidgetCard 
      colSpan={props.size === '4x2' ? 4 : 2} 
      rowSpan={2}
      aria-label="Current season"
    >
      <Show
        when={props.size === '4x2'}
        fallback={
          <div class="season-widget season-widget--compact">
            <SeasonIcon season={season()} />
            <div class="season-widget__countdown" style={{"margin-top": "8px"}}>
              Ends in {daysLeft}d
            </div>
          </div>
        }
      >
        <div class="season-widget season-widget--detailed">
          <div class="season-widget__header">
            <div>
               <div class="season-widget__title">Current Season</div>
               <div class="season-widget__name">{season()}</div>
            </div>
            <SeasonIcon season={season()} />
          </div>
          <div class="season-widget__countdown">
            Ends in {daysLeft} days
          </div>
        </div>
      </Show>
    </WidgetCard>
  );
}
