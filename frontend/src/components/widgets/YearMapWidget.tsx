import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import { computeYearMapCellSize, getYearMapModel } from "../../services/yearMap";
import "./YearMapWidget.css";

export function YearMapWidget(_props: WidgetProps) {
  const { time } = useTime();
  const DETAILED_GRID_ROWS = 9;
  const GRID_GAP = 1.5;
  const GRID_FILL_RATIO = 1;
  const MIN_CELL_SIZE = 4;
  const MAX_CELL_SIZE = 8;

  const now = createMemo(() => time());
  const model = createMemo(() => getYearMapModel(now()));
  const [gridWidth, setGridWidth] = createSignal(0);
  const detailedGridColumns = createMemo(() =>
    Math.ceil(model().cells.length / DETAILED_GRID_ROWS)
  );
  const gridCellSize = createMemo(() =>
    computeYearMapCellSize({
      containerWidth: gridWidth(),
      columns: detailedGridColumns(),
      gap: GRID_GAP,
      minSize: MIN_CELL_SIZE,
      maxSize: MAX_CELL_SIZE,
      fillRatio: GRID_FILL_RATIO,
    })
  );

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
  let gridWrapRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!gridWrapRef) return;
    setGridWidth(gridWrapRef.clientWidth);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setGridWidth(entry.contentRect.width);
      }
    });

    observer.observe(gridWrapRef);
    onCleanup(() => observer.disconnect());
  });

  return (
    <WidgetCard colSpan={4} rowSpan={2} aria-label="Year progress map" role="region">
      <div class="year-map-widget year-map-widget--detailed">
        <span class="sr-only">{summaryLabel()}</span>

        <div class="year-map-widget__grid-wrap" ref={gridWrapRef}>
          <div
            class="year-map-widget__grid"
            aria-hidden="true"
            style={{
              "--year-map-columns": String(detailedGridColumns()),
              "--year-map-rows": String(DETAILED_GRID_ROWS),
              "--year-map-gap": `${GRID_GAP}px`,
              "--year-map-cell-size": `${gridCellSize()}px`,
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
    </WidgetCard>
  );
}
