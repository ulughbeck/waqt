import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchCities, formatCityLabel, reverseGeocode, type CitySuggestion } from "./citySearch";

describe("citySearch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchCities", () => {
    it("returns empty suggestions for queries shorter than 2 chars", async () => {
      const result = await searchCities("a");
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("returns empty suggestions for empty query", async () => {
      const result = await searchCities("");
      expect(result.suggestions).toEqual([]);
    });

    it("returns empty suggestions for whitespace-only query", async () => {
      const result = await searchCities("   ");
      expect(result.suggestions).toEqual([]);
    });

    it("fetches and transforms results from Open-Meteo API", async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            name: "London",
            admin1: "England",
            country: "United Kingdom",
            latitude: 51.5074,
            longitude: -0.1278,
            timezone: "Europe/London",
          },
          {
            id: 2,
            name: "London",
            admin1: "Ontario",
            country: "Canada",
            latitude: 42.9849,
            longitude: -81.2453,
            timezone: "America/Toronto",
          },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchCities("London");

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]).toEqual({
        id: 1,
        name: "London",
        admin1: "England",
        country: "United Kingdom",
        lat: 51.5074,
        lon: -0.1278,
        timezone: "Europe/London",
      });
      expect(result.suggestions[1]).toEqual({
        id: 2,
        name: "London",
        admin1: "Ontario",
        country: "Canada",
        lat: 42.9849,
        lon: -81.2453,
        timezone: "America/Toronto",
      });
    });

    it("returns empty suggestions when API returns no results", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await searchCities("XYZ123");
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("returns error on API failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await searchCities("London");
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBe("API error: 500");
    });

    it("returns error on network failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const result = await searchCities("London");
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBe("Network error");
    });

    it("returns empty on abort without error", async () => {
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError);

      const result = await searchCities("London");
      expect(result.suggestions).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("passes abort signal to fetch", async () => {
      const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      const controller = new AbortController();
      await searchCities("London", { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("geocoding-api.open-meteo.com"),
        { signal: controller.signal }
      );
    });

    it("constructs correct API URL", async () => {
      const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await searchCities("New York");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/name=New(\+|%20)York/);
      expect(calledUrl).toContain("count=5");
      expect(calledUrl).toContain("language=en");
      expect(calledUrl).toContain("format=json");
    });
  });

  describe("formatCityLabel", () => {
    it("formats city with admin1 and country", () => {
      const city: CitySuggestion = {
        id: 1,
        name: "London",
        admin1: "England",
        country: "United Kingdom",
        lat: 51.5074,
        lon: -0.1278,
        timezone: "Europe/London",
      };

      expect(formatCityLabel(city)).toBe("London, England, United Kingdom");
    });

    it("formats city without admin1", () => {
      const city: CitySuggestion = {
        id: 1,
        name: "Singapore",
        country: "Singapore",
        lat: 1.3521,
        lon: 103.8198,
        timezone: "Asia/Singapore",
      };

      expect(formatCityLabel(city)).toBe("Singapore, Singapore");
    });

    it("handles city with empty admin1", () => {
      const city: CitySuggestion = {
        id: 1,
        name: "Monaco",
        admin1: "",
        country: "Monaco",
        lat: 43.7384,
        lon: 7.4246,
        timezone: "Europe/Monaco",
      };

      expect(formatCityLabel(city)).toBe("Monaco, Monaco");
    });
  });

  describe("reverseGeocode", () => {
    it("fetches city name from Nominatim", async () => {
      const mockResponse = {
        address: {
          city: "Tashkent",
          country: "Uzbekistan",
        },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await reverseGeocode(41.2995, 69.2401);
      expect(result).toBe("Tashkent");
    });

    it("falls back to town/village if city is missing", async () => {
      const mockResponse = {
        address: {
          town: "Smallville",
          country: "USA",
        },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await reverseGeocode(40.0, -80.0);
      expect(result).toBe("Smallville");
    });

    it("returns undefined on API failure", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await reverseGeocode(0, 0);
      expect(result).toBeUndefined();
    });

    it("returns undefined on network error", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network"));
      const result = await reverseGeocode(0, 0);
      expect(result).toBeUndefined();
    });
  });
});
