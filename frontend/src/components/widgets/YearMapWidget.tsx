import { For, Show, createMemo } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import {
  getCurrentMonthProgress,
  getWeekdayIndexMondayFirst,
  getYearMapModel,
} from "../../services/yearMap";
import "./YearMapWidget.css";

function buildMonthCells(now: Date): Array<{
  key: string;
  isToday: boolean;
  isFuture: boolean;
}> {
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  const offset = getWeekdayIndexMondayFirst(firstDay);
  const todayKey = `${year}-${month + 1}-${now.getDate()}`;
  const cells: Array<{ key: string; isToday: boolean; isFuture: boolean }> = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push({ key: `pad-${i}`, isToday: false, isFuture: true });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const key = `${year}-${month + 1}-${day}`;
    cells.push({
      key,
      isToday: key === todayKey,
      isFuture: date.getTime() > new Date(year, month, now.getDate()).getTime(),
    });
  }

  return cells;
}

export function YearMapWidget(props: WidgetProps) {
  const { time } = useTime();
  const DETAILED_GRID_ROWS = 9;

  const now = createMemo(() => time());
  const model = createMemo(() => getYearMapModel(now()));
  const detailedGridColumns = createMemo(() =>
    Math.ceil(model().cells.length / DETAILED_GRID_ROWS)
  );
  const monthProgress = createMemo(() => getCurrentMonthProgress(now()));
  const compactMonthCells = createMemo(() => buildMonthCells(now()));

  const summaryLabel = createMemo(
    () =>
      `${model().meta.daysLeft} days left, ${Math.round(
        model().meta.progress * 100
      )} percent of year completed.`
  );

  const daysLeftText = createMemo(() => `${model().meta.daysLeft}d left`);
  const progressText = createMemo(
    () => `${Math.round(model().meta.progress * 100)}%`
  );

  return (
    <WidgetCard
      colSpan={props.size === "4x2" ? 4 : 2}
      rowSpan={2}
      aria-label="Year progress map"
      role="region"
    >
      <Show
        when={props.size === "4x2"}
        fallback={
          <div class="year-map-widget year-map-widget--compact">
            <div class="year-map-widget__compact-header">
              <span>{monthProgress().monthLabel}</span>
              <span>{Math.round(monthProgress().progress * 100)}%</span>
            </div>
            <div class="year-map-widget__compact-subtitle">
              {monthProgress().dayOfMonth}/{monthProgress().totalDaysInMonth} days
            </div>
            <div class="year-map-widget__compact-grid" aria-hidden="true">
              <For each={compactMonthCells()}>
                {(cell) => (
                  <div
                    class={`year-map-widget__compact-cell${
                      cell.isToday
                        ? " year-map-widget__compact-cell--today"
                        : cell.isFuture
                          ? " year-map-widget__compact-cell--future"
                          : " year-map-widget__compact-cell--done"
                    }`}
                  />
                )}
              </For>
            </div>
          </div>
        }
      >
        <div class="year-map-widget year-map-widget--detailed">
          <span class="sr-only">{summaryLabel()}</span>

          <div class="year-map-widget__grid-wrap">
            <div
              class="year-map-widget__grid"
              aria-hidden="true"
              style={{
                "--year-map-columns": String(detailedGridColumns()),
                "--year-map-rows": String(DETAILED_GRID_ROWS),
              }}
            >
              <For each={model().cells}>
                {(cell) => (
                  <div
                    class={`year-map-widget__cell year-map-widget__cell--level-${cell.level}${
                      cell.isToday ? " year-map-widget__cell--today" : ""
                    }`}
                    title={cell.date}
                  />
                )}
              </For>
            </div>
          </div>
          <div class="year-map-widget__footer">
            <span class="year-map-widget__footer-primary">{daysLeftText()}</span>
            <span class="year-map-widget__footer-separator"> - </span>
            <span class="year-map-widget__footer-secondary">{progressText()}</span>
          </div>
        </div>
      </Show>
    </WidgetCard>
  );
}
