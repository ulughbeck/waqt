import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import { LocationTrigger } from "./LocationTrigger";
import { LocationProvider } from "~/providers/LocationProvider";
import { DebugProvider } from "~/providers/DebugProvider";
import { LayoutProvider } from "~/providers/LayoutProvider";

const STORAGE_KEY = "waqt.location";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

function renderWithProvider(ui: () => any) {
  return render(() => (
    <DebugProvider>
      <LocationProvider>
        <LayoutProvider>{ui()}</LayoutProvider>
      </LocationProvider>
    </DebugProvider>
  ));
}

describe("LocationTrigger", () => {
  it("renders floating location trigger button", () => {
    const { container } = renderWithProvider(() => (
      <LocationTrigger onCityClick={() => {}} />
    ));

    const trigger = container.querySelector(".location-trigger");
    expect(trigger).not.toBeNull();
  });

  it("shows fallback text when no location", () => {
    const { getByText } = renderWithProvider(() => (
      <LocationTrigger onCityClick={() => {}} />
    ));

    expect(getByText("Select City")).toBeDefined();
  });

  it("calls onCityClick when clicked", async () => {
    const handleClick = vi.fn();
    const { container } = renderWithProvider(() => (
      <LocationTrigger onCityClick={handleClick} />
    ));

    const trigger = container.querySelector('button[aria-label="Change location"]');
    if (trigger) {
      await fireEvent.click(trigger);
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("preserves raw city casing in button text", () => {
    const city = "McAllen";
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lat: 26.2034,
        lon: -98.2300,
        timezone: "America/Chicago",
        city,
        source: "manual",
        timestamp: Date.now(),
      })
    );

    const { getByText } = renderWithProvider(() => (
      <LocationTrigger onCityClick={() => {}} />
    ));

    expect(getByText(city)).toBeDefined();
  });
});
