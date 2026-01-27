import { describe, it, expect } from "vitest";
import { formatClockTime, formatCountdown, formatDate, formatWidgetTime } from "./format";

describe("format service", () => {
  it("formats clock time with seconds in 24-hour format", () => {
    const date = new Date("2026-01-21T13:36:54");
    expect(formatClockTime(date)).toBe("13:36:54");
  });

  it("formats widget time with minutes in 24-hour format", () => {
    const date = new Date("2026-01-21T06:05:00");
    expect(formatWidgetTime(date)).toBe("06:05");
  });

  it("formats date with full weekday and short month", () => {
    const date = new Date("2026-01-21T13:36:54");
    expect(formatDate(date)).toBe("Wednesday, Jan 21");
  });

  it("formats countdowns in compact form", () => {
    expect(formatCountdown(0)).toBe("now");
    expect(formatCountdown(30)).toBe("in <1m");
    expect(formatCountdown(90)).toBe("in 1m");
    expect(formatCountdown(3600)).toBe("in 1h");
    expect(formatCountdown(3660)).toBe("in 1h 1m");
  });
});
