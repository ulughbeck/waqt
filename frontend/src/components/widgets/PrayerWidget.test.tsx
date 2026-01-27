// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@solidjs/testing-library";
import { PrayerWidget } from "./PrayerWidget";

const now = new Date(2026, 0, 26, 13, 0, 0);
const mockPrayerTimes = {
  fajr: new Date(2026, 0, 26, 5, 0, 0),
  sunrise: new Date(2026, 0, 26, 6, 30, 0),
  dhuhr: new Date(2026, 0, 26, 12, 30, 0),
  asr: new Date(2026, 0, 26, 15, 45, 0),
  maghrib: new Date(2026, 0, 26, 18, 0, 0),
  isha: new Date(2026, 0, 26, 19, 30, 0),
};

const mockNextPrayer = {
  name: "asr",
  time: mockPrayerTimes.asr,
  secondsUntil: 9900,
};

const mockCurrentPrayer = {
  name: "dhuhr",
  startTime: mockPrayerTimes.dhuhr,
  endTime: mockPrayerTimes.asr,
  nextPrayerName: "asr",
};

vi.mock("~/providers/useTime", () => ({
  useTime: () => ({
    prayer: () => mockPrayerTimes,
    time: () => now,
    helpers: {
      nextPrayer: () => mockNextPrayer,
      currentPrayer: () => mockCurrentPrayer,
    },
    getPrayerSettings: () => ({ prayerMethod: "MuslimWorldLeague", madhab: "Shafi" }),
    setPrayerSettings: () => {},
  }),
}));

describe("PrayerWidget", () => {
  it("renders standard view when size is 4x2", () => {
    const { container } = render(() => <PrayerWidget size="4x2" />);
    expect(container.querySelector(".prayer-widget--standard")).not.toBeNull();
    expect(container.querySelector(".col-span-4")).not.toBeNull();
    expect(screen.getByText("Dhuhr")).toBeDefined();
    expect(screen.getByText("12:30")).toBeDefined();
    expect(screen.getByText("Asr")).toBeDefined();
    expect(screen.getByText("in 2h 45m")).toBeDefined();
  });

  it("renders compact view when size is 2x2", () => {
    const { container } = render(() => <PrayerWidget size="2x2" />);
    expect(container.querySelector(".prayer-widget--compact")).not.toBeNull();
    expect(container.querySelector(".col-span-2")).not.toBeNull();
    expect(screen.getByText("Dhuhr")).toBeDefined();
    expect(screen.getByText("12:30 - 15:45")).toBeDefined();
  });

  it("opens detail sheet with prayer list and settings", async () => {
    const { container } = render(() => <PrayerWidget size="4x2" />);

    const widget = container.querySelector(".prayer-widget__card") as HTMLElement;
    await fireEvent.click(widget);

    expect(screen.getByText("Prayer Times")).toBeDefined();
    expect(screen.getByText("Fajr")).toBeDefined();
    expect(screen.getByText("Sunrise")).toBeDefined();
    expect(screen.getByText("Isha")).toBeDefined();
    expect(screen.getByText("Prayer Calculation")).toBeDefined();

    const sheet = screen.getByRole("dialog", { name: "Prayer Times" });
    const currentRow = within(sheet).getByText("Dhuhr").closest(".prayer-detail__row");
    expect(currentRow?.classList.contains("prayer-detail__row--current")).toBe(true);
  });
});
