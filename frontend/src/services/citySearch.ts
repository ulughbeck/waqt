export interface CitySuggestion {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface CitySearchResult {
  suggestions: CitySuggestion[];
  error?: string;
}

interface OpenMeteoResult {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface OpenMeteoResponse {
  results?: OpenMeteoResult[];
}

const API_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchCities(
  query: string,
  options: { signal?: AbortSignal } = {}
): Promise<CitySearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { suggestions: [] };
  }

  try {
    const url = new URL(API_URL);
    url.searchParams.set("name", trimmed);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), { signal: options.signal });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.results) {
      return { suggestions: [] };
    }

    const suggestions: CitySuggestion[] = data.results.map((result) => ({
      id: result.id,
      name: result.name,
      admin1: result.admin1,
      country: result.country,
      lat: result.latitude,
      lon: result.longitude,
      timezone: result.timezone,
    }));

    return { suggestions };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { suggestions: [] };
    }
    return {
      suggestions: [],
      error: err instanceof Error ? err.message : "Search failed",
    };
  }
}

export function formatCityLabel(city: CitySuggestion): string {
  const parts = [city.name];
  if (city.admin1) {
    parts.push(city.admin1);
  }
  parts.push(city.country);
  return parts.join(", ");
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  options: { signal?: AbortSignal } = {}
): Promise<string | undefined> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());

  try {
    const response = await fetch(url.toString(), {
      signal: options.signal,
      headers: {
        "User-Agent": "WaqtApp/1.0",
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    const addr = data.address;

    return (
      addr?.city ||
      addr?.town ||
      addr?.village ||
      addr?.hamlet ||
      addr?.municipality ||
      addr?.suburb ||
      addr?.county ||
      addr?.state_district
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return undefined;
    }
    console.warn("Reverse geocoding failed", err);
    return undefined;
  }
}
