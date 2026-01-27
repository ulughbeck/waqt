import { For, Show, createMemo, createSignal } from "solid-js";
import { WidgetCard } from "../dashboard/WidgetCard";
import { useTime } from "~/providers/useTime";
import { WidgetProps } from "./types";
import { BottomSheet } from "../ui/BottomSheet";
import { formatCountdown, formatWidgetTime } from "../../services/format";
import "./PrayerWidget.css";

const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const CALCULATION_METHODS = [
  { value: "MuslimWorldLeague", label: "Muslim World League" },
  { value: "Egyptian", label: "Egyptian" },
  { value: "Karachi", label: "Karachi" },
  { value: "UmmAlQura", label: "Umm Al-Qura" },
  { value: "Dubai", label: "Dubai" },
  { value: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { value: "NorthAmerica", label: "North America (ISNA)" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Qatar", label: "Qatar" },
  { value: "Singapore", label: "Singapore" },
  { value: "Tehran", label: "Tehran" },
  { value: "Turkey", label: "Turkey" },
];

function PrayerIcon(props: { name: string }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.6,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  } as const;

  switch (props.name) {
    case "fajr":
      return (
        <svg {...commonProps}>
          <path d="M4 16h16" />
          <path d="M7 16a5 5 0 0 1 10 0" />
          <path d="M12 5v3" />
          <path d="M8 7l-1.5-1.5" />
          <path d="M16 7l1.5-1.5" />
        </svg>
      );
    case "sunrise":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="11" r="4" />
          <path d="M4 16h16" />
          <path d="M12 3v2" />
          <path d="M5 9l1.5 1.5" />
          <path d="M19 9l-1.5 1.5" />
        </svg>
      );
    case "dhuhr":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M12 2v2" />
          <path d="M5 8h2" />
          <path d="M17 8h2" />
          <path d="M7 4l1.5 1.5" />
          <path d="M17 4l-1.5 1.5" />
          <path d="M12 20v2" />
        </svg>
      );
    case "asr":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M4 18h16" />
          <path d="M5 6l2 2" />
          <path d="M19 6l-2 2" />
        </svg>
      );
    case "maghrib":
      return (
        <svg {...commonProps}>
          <path d="M4 16h16" />
          <path d="M8 16a4 4 0 0 0 8 0" />
          <path d="M12 6v3" />
          <path d="M6 9l1.5 1.5" />
          <path d="M18 9l-1.5 1.5" />
        </svg>
      );
    case "isha":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 0 0 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 0 9-9z" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

function PrayerSettings() {
  const { getPrayerSettings, setPrayerSettings } = useTime();
  const settings = getPrayerSettings();

  function handleMethodChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setPrayerSettings({ prayerMethod: target.value });
  }

  function handleMadhabChange(madhab: string) {
    setPrayerSettings({ madhab });
  }

  return (
    <div class="prayer-settings">
      <h3 class="prayer-settings__section-title">Prayer Calculation</h3>

      <div class="prayer-settings__field">
        <label class="prayer-settings__label" for="prayer-method">
          Calculation Method
        </label>
        <select
          id="prayer-method"
          class="prayer-settings__select"
          value={settings.prayerMethod}
          onChange={handleMethodChange}
        >
          {CALCULATION_METHODS.map((method) => (
            <option value={method.value}>{method.label}</option>
          ))}
        </select>
        <span class="prayer-settings__hint">Used for Fajr and Isha timing</span>
      </div>

      <div class="prayer-settings__field">
        <label class="prayer-settings__label">Asr Calculation (Madhab)</label>
        <div class="prayer-settings__radio-group">
          <label class="prayer-settings__radio-label">
            <input
              type="radio"
              name="madhab"
              class="prayer-settings__radio-input"
              value="Shafi"
              checked={settings.madhab === "Shafi"}
              onChange={() => handleMadhabChange("Shafi")}
            />
            Shafi
          </label>
          <label class="prayer-settings__radio-label">
            <input
              type="radio"
              name="madhab"
              class="prayer-settings__radio-input"
              value="Hanafi"
              checked={settings.madhab === "Hanafi"}
              onChange={() => handleMadhabChange("Hanafi")}
            />
            Hanafi
          </label>
        </div>
        <span class="prayer-settings__hint">
          Shafi: Earlier Asr · Hanafi: Later Asr
        </span>
      </div>
    </div>
  );
}

export function PrayerWidget(props: WidgetProps) {
  const { helpers, prayer } = useTime();
  const [isDetailOpen, setIsDetailOpen] = createSignal(false);
  const nextPrayer = createMemo(() => helpers.nextPrayer());
  const currentPrayer = createMemo(() => helpers.currentPrayer());

  const prayerList = createMemo(() => {
    const p = prayer();
    if (!p) return [];
    return [
      { name: "fajr", time: p.fajr },
      { name: "sunrise", time: p.sunrise },
      { name: "dhuhr", time: p.dhuhr },
      { name: "asr", time: p.asr },
      { name: "maghrib", time: p.maghrib },
      { name: "isha", time: p.isha },
    ];
  });

  const timeRange = createMemo(() => {
    const start = currentPrayer().startTime;
    const end = currentPrayer().endTime;
    return `${formatWidgetTime(start)} - ${formatWidgetTime(end)}`;
  });

  const ariaLabel = createMemo(() => {
    const currentName = PRAYER_LABELS[currentPrayer().name] || currentPrayer().name;
    const nextName = PRAYER_LABELS[nextPrayer().name] || nextPrayer().name;
    const countdown = formatCountdown(nextPrayer().secondsUntil);
    return `Prayer times, current is ${currentName}, next is ${nextName} ${countdown}`;
  });

  function handleOpenDetail() {
    setIsDetailOpen(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsDetailOpen(true);
    }
  }

  return (
    <>
      <WidgetCard
        colSpan={props.size === "4x2" ? 4 : 2}
        rowSpan={2}
        aria-label={ariaLabel()}
        role="button"
        tabIndex={0}
        interactive
        class="prayer-widget__card"
        onClick={handleOpenDetail}
        onKeyDown={handleKeyDown}
      >
        <Show
          when={props.size === "4x2"}
          fallback={
            <div class="prayer-widget prayer-widget--compact">
              <div class="prayer-widget__icon">
                <PrayerIcon name={currentPrayer().name} />
              </div>
              <div class="prayer-widget__name">
                {PRAYER_LABELS[currentPrayer().name] || currentPrayer().name}
              </div>
              <div class="prayer-widget__range">{timeRange()}</div>
            </div>
          }
        >
          <div class="prayer-widget prayer-widget--standard">
            <div class="prayer-widget__row prayer-widget__row--current">
              <div class="prayer-widget__icon">
                <PrayerIcon name={currentPrayer().name} />
              </div>
              <div class="prayer-widget__name">
                {PRAYER_LABELS[currentPrayer().name] || currentPrayer().name}
              </div>
              <div class="prayer-widget__time">{formatWidgetTime(currentPrayer().startTime)}</div>
            </div>
            <div class="prayer-widget__divider" />
            <div class="prayer-widget__row prayer-widget__row--next">
              <div class="prayer-widget__icon">
                <PrayerIcon name={nextPrayer().name} />
              </div>
              <div class="prayer-widget__name">
                {PRAYER_LABELS[nextPrayer().name] || nextPrayer().name}
              </div>
              <div class="prayer-widget__countdown">
                {formatCountdown(nextPrayer().secondsUntil)}
              </div>
            </div>
          </div>
        </Show>
      </WidgetCard>

      <BottomSheet
        isOpen={isDetailOpen()}
        onClose={() => setIsDetailOpen(false)}
        title="Prayer Times"
      >
        <div class="prayer-detail">
          <Show
            when={prayerList().length > 0}
            fallback={<div class="prayer-detail__empty">Prayer times unavailable.</div>}
          >
            <div class="prayer-detail__list">
              <For each={prayerList()}>
                {(item) => {
                  const isCurrent = () => item.name === currentPrayer().name;
                  return (
                    <div
                      class={`prayer-detail__row ${isCurrent() ? "prayer-detail__row--current" : ""}`}
                    >
                      <div class="prayer-detail__name">
                        {PRAYER_LABELS[item.name] || item.name}
                      </div>
                      <div class="prayer-detail__time">{formatWidgetTime(item.time)}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          <div class="prayer-detail__settings">
            <PrayerSettings />
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
