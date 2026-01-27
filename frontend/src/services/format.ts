const CLOCK_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const WIDGET_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

export function formatClockTime(date: Date): string {
  return CLOCK_FORMATTER.format(date);
}

export function formatWidgetTime(date: Date): string {
  return WIDGET_TIME_FORMATTER.format(date);
}

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

export function formatCountdown(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "now";
  if (seconds < 60) return "in <1m";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
  return `in ${m}m`;
}
