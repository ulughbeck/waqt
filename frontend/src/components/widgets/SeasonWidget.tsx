import { Show, createMemo } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import "./SeasonWidget.css";

const SeasonIcon = (props: { season: string }) => {
  const colors: Record<string, string> = {
    spring: "#FF69B4",
    summer: "#FFD700",
    fall: "#FF8C00",
    winter: "#87CEEB"
  };

  const iconColor = () => colors[props.season] || "#FFFFFF";

  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.8,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  } as const;

  return (
    <div class="season-widget__icon" style={{ color: iconColor() }}>
      <Show
        when={props.season === "spring"}
        fallback={
          <Show
            when={props.season === "summer"}
            fallback={
              <Show
                when={props.season === "fall"}
                fallback={
                  <svg {...common} aria-hidden="true">
                    <path d="M12 3v18" />
                    <path d="M7 5l1.5 2.5L6 9l2.5 1.5L7 13l2.5-1.5L12 14l2.5-2.5L17 13l-1.5-2.5L18 9l-2.5-1.5L17 5l-2.5 1.5L12 4l-2.5 2.5L7 5z" />
                  </svg>
                }
              >
                <svg {...common} aria-hidden="true">
                  <path d="M6 14c4-8 11-7 12-7-1 4-4 9-10 10-2 .3-3-.7-2-3z" />
                  <path d="M10 13c.5 1.5 2.2 4 5 6" />
                </svg>
              </Show>
            }
          >
            <svg {...common} aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3" />
              <path d="M12 19v3" />
              <path d="M2 12h3" />
              <path d="M19 12h3" />
              <path d="m4.9 4.9 2.1 2.1" />
              <path d="m17 17 2.1 2.1" />
              <path d="m4.9 19.1 2.1-2.1" />
              <path d="m17 7 2.1-2.1" />
            </svg>
          </Show>
        }
      >
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="7.5" r="3" />
          <circle cx="16.5" cy="12" r="3" />
          <circle cx="12" cy="16.5" r="3" />
          <circle cx="7.5" cy="12" r="3" />
          <circle cx="12" cy="12" r="1.2" />
        </svg>
      </Show>
    </div>
  );
};

export function SeasonWidget(props: WidgetProps) {
  const { seasonMeta } = useTime();

  const seasonName = createMemo(() => seasonMeta().currentSeason);
  const seasonLabel = createMemo(
    () => seasonName().charAt(0).toUpperCase() + seasonName().slice(1)
  );
  const daysLeft = createMemo(() => seasonMeta().daysUntilNextSeason);
  const nextSeasonStartLabel = createMemo(() =>
    seasonMeta().nextSeasonStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const isHighlighted = createMemo(() => daysLeft() <= 1);

  return (
    <WidgetCard 
      colSpan={props.size === '4x2' ? 4 : 2} 
      rowSpan={2}
      role="region"
      aria-live="polite"
      aria-label="Current season"
      highlighted={isHighlighted()}
    >
      <Show
        when={props.size === '4x2'}
        fallback={
          <div class="season-widget season-widget--compact">
            <SeasonIcon season={seasonName()} />
            <div class="season-widget__compact-season">{seasonLabel()}</div>
            <div class="season-widget__countdown">
              Ends in {daysLeft()}d
            </div>
          </div>
        }
      >
        <div class="season-widget season-widget--detailed">
          <div class="season-widget__header">
            <div>
               <div class="season-widget__name">{seasonLabel()}</div>
            </div>
            <SeasonIcon season={seasonName()} />
          </div>
          <div class="season-widget__countdown">
            ends in {daysLeft()} days
          </div>
          <span class="sr-only">
            {seasonMeta().nextSeasonLabel} begins {nextSeasonStartLabel()}
          </span>
        </div>
      </Show>
    </WidgetCard>
  );
}
