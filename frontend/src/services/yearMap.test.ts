import { describe, expect, it } from "vitest";
import {
  getCurrentMonthProgress,
  getDayLevel,
  getTotalDaysInYear,
  getWeekdayIndexMondayFirst,
  getYearMapModel,
  isLeapYear,
} from "./yearMap";

describe("yearMap", () => {
  it("detects leap years correctly", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it("returns expected total days for leap and non-leap years", () => {
    expect(getTotalDaysInYear(2024)).toBe(366);
    expect(getTotalDaysInYear(2025)).toBe(365);
  });

  it("uses Monday-first weekday indexing", () => {
    expect(getWeekdayIndexMondayFirst(new Date("2024-01-01T12:00:00"))).toBe(0); // Monday
    expect(getWeekdayIndexMondayFirst(new Date("2023-01-01T12:00:00"))).toBe(6); // Sunday
  });

  it("builds full year cells including leap years", () => {
    const leap = getYearMapModel(new Date("2024-12-31T12:00:00"));
    const regular = getYearMapModel(new Date("2025-12-31T12:00:00"));

    expect(leap.cells).toHaveLength(366);
    expect(regular.cells).toHaveLength(365);
    expect(leap.meta.dayOfYear).toBe(366);
    expect(regular.meta.dayOfYear).toBe(365);
    expect(regular.meta.daysLeft).toBe(0);
    expect(leap.monthMarkers).toHaveLength(4);
  });

  it("computes deterministic day levels", () => {
    const today = new Date("2026-04-10T12:00:00");
    expect(getDayLevel(new Date("2026-04-11T12:00:00"), today)).toBe(0); // future
    expect(getDayLevel(new Date("2026-04-10T00:00:00"), today)).toBe(4); // today
    expect(getDayLevel(new Date("2026-04-05T00:00:00"), today)).toBe(1); // past
    expect(getDayLevel(new Date("2026-04-01T00:00:00"), today)).toBe(1); // past
    expect(getDayLevel(new Date("2026-02-15T00:00:00"), today)).toBe(1); // past
    expect(getDayLevel(new Date("2025-12-01T00:00:00"), today)).toBe(1); // past
  });

  it("calculates current month progress", () => {
    const month = getCurrentMonthProgress(new Date("2026-02-10T12:00:00"));
    expect(month.monthLabel).toBe("Feb");
    expect(month.dayOfMonth).toBe(10);
    expect(month.totalDaysInMonth).toBe(28);
    expect(month.progress).toBeCloseTo(10 / 28, 5);
  });
});
