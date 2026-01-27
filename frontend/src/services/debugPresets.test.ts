import { describe, it, expect } from "vitest";
import { TIME_PRESETS, LOCATION_PRESETS } from "./debugPresets";

describe("debugPresets", () => {
  it("exposes time presets with expected labels and keys", () => {
    expect(TIME_PRESETS).toEqual([
      { label: "Dawn", key: "dawn" },
      { label: "Sunrise", key: "sunrise" },
      { label: "Noon", key: "solarNoon" },
      { label: "Sunset", key: "sunset" },
      { label: "Dusk", key: "dusk" },
      { label: "Midnight", key: "nadir" }
    ]);
  });

  it("exposes location presets with expected labels and coordinates", () => {
    expect(LOCATION_PRESETS).toEqual([
      { label: "Tashkent", lat: 41.2995, lon: 69.2401, tz: "Asia/Tashkent" },
      { label: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
      { label: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
      { label: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
      { label: "Tromsø", lat: 69.6492, lon: 18.9553, tz: "Europe/Oslo" },
      { label: "Reykjavik", lat: 64.1466, lon: -21.9426, tz: "Atlantic/Reykjavik" }
    ]);
  });
});
