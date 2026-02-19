export type DayLevel = 0 | 1 | 2 | 3 | 4;

export interface YearMapCell {
  date: string;
  weekIndex: number;
  weekdayIndex: number; // Monday-first: 0..6
  level: DayLevel;
  isToday: boolean;
  isFuture: boolean;
}

export interface YearMapMeta {
  year: number;
  dayOfYear: number;
  totalDays: number;
  progress: number;
  daysLeft: number;
}

export interface MonthMarker {
  label: string;
  weekIndex: number;
}

export interface YearMapModel {
  cells: YearMapCell[];
  meta: YearMapMeta;
  totalWeeks: number;
  monthMarkers: MonthMarker[];
}

export interface YearMapCellSizeInput {
  containerWidth: number;
  columns: number;
  gap: number;
  minSize: number;
  maxSize: number;
  fillRatio: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeYearMapCellSize(input: YearMapCellSizeInput): number {
  const { containerWidth, columns, gap, minSize, maxSize, fillRatio } = input;
  if (columns <= 0 || containerWidth <= 0) return minSize;

  const clampedFillRatio = Math.min(1, Math.max(0, fillRatio));
  const available = containerWidth * clampedFillRatio - (columns - 1) * gap;
  const raw = available / columns;
  const clamped = Math.min(maxSize, Math.max(minSize, raw));
  return Number.isFinite(clamped) ? clamped : minSize;
}

function getLocalDateStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTotalDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getDayOfYear(date: Date): number {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const diff = getLocalDateStart(date).getTime() - yearStart.getTime();
  return Math.floor(diff / MS_PER_DAY) + 1;
}

export function getWeekdayIndexMondayFirst(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function getDayLevel(targetDate: Date, today: Date): DayLevel {
  const current = getLocalDateStart(today).getTime();
  const target = getLocalDateStart(targetDate).getTime();
  const ageDays = Math.floor((current - target) / MS_PER_DAY);

  if (ageDays < 0) return 0;
  if (ageDays === 0) return 4;
  return 1;
}

export function getYearMapModel(now: Date): YearMapModel {
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const totalDays = getTotalDaysInYear(year);
  const firstWeekday = getWeekdayIndexMondayFirst(jan1);
  const todayKey = toDateKey(now);
  const cells: YearMapCell[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(year, 0, i + 1);
    const weekIndex = Math.floor((firstWeekday + i) / 7);
    const weekdayIndex = getWeekdayIndexMondayFirst(day);
    const dateKey = toDateKey(day);
    const isToday = dateKey === todayKey;
    const isFuture = day.getTime() > getLocalDateStart(now).getTime();

    cells.push({
      date: dateKey,
      weekIndex,
      weekdayIndex,
      level: getDayLevel(day, now),
      isToday,
      isFuture,
    });
  }

  const totalWeeks = Math.max(...cells.map((cell) => cell.weekIndex)) + 1;
  const dayOfYear = getDayOfYear(now);

  const monthMarkers: MonthMarker[] = [0, 3, 6, 9].map((month) => {
    const monthStart = new Date(year, month, 1);
    const dayIndex = getDayOfYear(monthStart) - 1;
    return {
      label: monthStart.toLocaleDateString("en-US", { month: "short" }),
      weekIndex: Math.floor((firstWeekday + dayIndex) / 7),
    };
  });

  return {
    cells,
    meta: {
      year,
      dayOfYear,
      totalDays,
      progress: dayOfYear / totalDays,
      daysLeft: totalDays - dayOfYear,
    },
    totalWeeks,
    monthMarkers,
  };
}
