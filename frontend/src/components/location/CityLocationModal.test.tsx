import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, cleanup } from "@solidjs/testing-library";
import { CityLocationModal } from "./CityLocationModal";
import { LocationProvider } from "~/providers/LocationProvider";
import { TimeProvider } from "~/providers/TimeProvider";
import { DebugProvider } from "~/providers/DebugProvider";
import * as citySearch from "~/services/citySearch";

vi.mock("~/services/citySearch", () => ({
  searchCities: vi.fn(),
  formatCityLabel: (city: citySearch.CitySuggestion) => {
    const parts = [city.name];
    if (city.admin1) parts.push(city.admin1);
    parts.push(city.country);
    return parts.join(", ");
  },
}));

function renderWithProviders(ui: () => any) {
  return render(() => (
    <DebugProvider>
      <LocationProvider>
        <TimeProvider location={() => null}>
          {ui()}
        </TimeProvider>
      </LocationProvider>
    </DebugProvider>
  ));
}

const mockCities: citySearch.CitySuggestion[] = [
  {
    id: 1,
    name: "Tashkent",
    admin1: "Toshkent Shahri",
    country: "Uzbekistan",
    lat: 41.3,
    lon: 69.3,
    timezone: "Asia/Tashkent",
  },
  {
    id: 2,
    name: "Tashkent Region",
    country: "Uzbekistan",
    lat: 41.0,
    lon: 69.0,
    timezone: "Asia/Tashkent",
  },
];

describe("CityLocationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("rendering", () => {
    it("renders modal with backdrop", () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      expect(container.querySelector(".bottom-sheet__backdrop")).not.toBeNull();
      expect(container.querySelector(".bottom-sheet")).not.toBeNull();
    });

    it("renders search input", () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input");
      expect(input).not.toBeNull();
      expect(input?.getAttribute("placeholder")).toBe("Search city...");
    });

    it("auto-focuses input on mount", async () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      await waitFor(() => {
        const input = container.querySelector(".location-modal__input");
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe("search behavior", () => {
    it("does not search with less than 2 characters", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: [] });

      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "T" } });

      await new Promise((r) => setTimeout(r, 400));
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("searches after 300ms debounce", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: mockCities });

      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Tash" } });

      expect(mockSearch).not.toHaveBeenCalled();

      await waitFor(
        () => {
          expect(mockSearch).toHaveBeenCalledWith("Tash", expect.any(Object));
        },
        { timeout: 500 }
      );
    });

    it("displays search results", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: mockCities });

      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Tash" } });

      await waitFor(() => {
        const suggestions = container.querySelectorAll(".location-modal__suggestion");
        expect(suggestions.length).toBe(2);
      });
    });

    it("shows no cities found message", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: [] });

      const { container, getByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "xyz" } });

      await waitFor(() => {
        expect(getByText("No cities found")).toBeDefined();
      });
    });
  });

  describe("interactions", () => {
    it("calls onClose when backdrop is clicked", async () => {
      const handleClose = vi.fn();
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={handleClose} />
      ));

      const backdrop = container.querySelector(".bottom-sheet__backdrop") as HTMLElement;
      await fireEvent.click(backdrop);

      expect(handleClose).toHaveBeenCalled();
    });

    it("does not close when modal content is clicked", async () => {
      const handleClose = vi.fn();
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={handleClose} />
      ));

      const modal = container.querySelector(".bottom-sheet") as HTMLElement;
      await fireEvent.click(modal);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it("shows clear button when input has text", async () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;

      expect(container.querySelector(".location-modal__clear-btn")).toBeNull();

      await fireEvent.input(input, { target: { value: "Test" } });

      expect(container.querySelector(".location-modal__clear-btn")).not.toBeNull();
    });

    it("clears input when clear button is clicked", async () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Test" } });

      const clearBtn = container.querySelector(".location-modal__clear-btn") as HTMLElement;
      await fireEvent.click(clearBtn);

      expect(input.value).toBe("");
    });

    it("closes modal and updates location when city is selected", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: mockCities });
      const handleClose = vi.fn();

      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={handleClose} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Tash" } });

      await waitFor(() => {
        expect(container.querySelectorAll(".location-modal__suggestion").length).toBe(2);
      });

      const firstSuggestion = container.querySelector(".location-modal__suggestion") as HTMLElement;
      await fireEvent.click(firstSuggestion);

      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("debug mode", () => {
    it("toggles debug mode after 7 clicks on map pin", async () => {
      const { container, findByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const pinBtn = container.querySelector(
        '.location-modal__input-icon-btn'
      ) as HTMLElement;
      expect(pinBtn).not.toBeNull();

      // Click 6 times
      for (let i = 0; i < 6; i++) {
        await fireEvent.click(pinBtn);
      }

      // Should not be enabled yet (no toast)
      expect(container.textContent).not.toContain("Developer Mode Enabled");

      // Click 7th time
      await fireEvent.click(pinBtn);

      // Should show toast
      expect(await findByText("Developer Mode Enabled")).toBeDefined();
    });

    it("shows disable button and disables input when debug mode is enabled", async () => {
      const { container, findByText, queryByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      // Enable debug mode
      const pinBtn = container.querySelector('.location-modal__input-icon-btn') as HTMLElement;
      for (let i = 0; i < 7; i++) {
        await fireEvent.click(pinBtn);
      }
      
      // Wait for toast to confirm enabled
      await findByText("Developer Mode Enabled");

      // Verify "Disable Developer Mode" button exists
      const disableBtn = await findByText("Disable Developer Mode");
      expect(disableBtn).toBeDefined();

      // Verify input is disabled
      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      
      // Click disable button
      await fireEvent.click(disableBtn);
      
      // Verify input is enabled again
      expect(input.disabled).toBe(false);
      
      // Verify button is gone
      expect(queryByText("Disable Developer Mode")).toBeNull();
    });

    it("clears input when debug mode is disabled", async () => {
      const { container, findByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Test City" } });
      expect(input.value).toBe("Test City");

      // Enable debug mode
      const pinBtn = container.querySelector('.location-modal__input-icon-btn') as HTMLElement;
      for (let i = 0; i < 7; i++) {
        await fireEvent.click(pinBtn);
      }
      await findByText("Developer Mode Enabled");
      
      expect(input.disabled).toBe(true);
      
      // Disable debug mode
      const disableBtn = await findByText("Disable Developer Mode");
      await fireEvent.click(disableBtn);
      
      // Input should be cleared
      expect(input.value).toBe("");
    });

    it("pre-fills input with current city when debug mode is disabled and location is set", async () => {
      // Setup local storage with a location
      const mockLocation = {
        lat: 41.3,
        lon: 69.3,
        timezone: "Asia/Tashkent",
        city: "Tashkent",
        source: "manual",
        timestamp: Date.now(),
      };
      localStorage.setItem("waqt.location", JSON.stringify(mockLocation));

      const { container, findByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      // Enable debug mode
      const pinBtn = container.querySelector('.location-modal__input-icon-btn') as HTMLElement;
      for (let i = 0; i < 7; i++) {
        await fireEvent.click(pinBtn);
      }
      await findByText("Developer Mode Enabled");
      
      // Disable debug mode
      const disableBtn = await findByText("Disable Developer Mode");
      await fireEvent.click(disableBtn);
      
      // Input should be pre-filled with city
      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      expect(input.value).toBe("Tashkent");
    });
  });

  describe("offline handling", () => {
    it("shows offline message when offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });

      const { container, getByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Tash" } });

      await waitFor(() => {
        expect(getByText("Search requires internet")).toBeDefined();
      });
    });
  });

  describe("accessibility", () => {
    it("has dialog role", () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it("input has aria-label", () => {
      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input");
      expect(input?.getAttribute("aria-label")).toBe("City search");
    });

    it("suggestions have listbox role", async () => {
      const mockSearch = vi.mocked(citySearch.searchCities);
      mockSearch.mockResolvedValue({ suggestions: mockCities });

      const { container } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "Tash" } });

      await waitFor(() => {
        expect(container.querySelector('[role="listbox"]')).not.toBeNull();
      });
    });
  });

  describe("Use my current location", () => {
    it("renders option when input is empty", () => {
      const { getByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));
      expect(getByText("Use my current location")).toBeDefined();
    });

    it("does not render option when input is not empty", async () => {
      const { container, queryByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));
      
      const input = container.querySelector(".location-modal__input") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "T" } });
      
      expect(queryByText("Use my current location")).toBeNull();
    });

    it("triggers refreshLocation and closes on success", async () => {
      // Mock Geolocation Success
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementation((success) => {
          success({
            coords: {
              latitude: 51.1,
              longitude: 45.3,
            },
          });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      // Mock IP Fetch failure to rely on Geolocation
      vi.spyOn(window, "fetch").mockRejectedValue(new Error("IP fetch failed"));

      const handleClose = vi.fn();
      const { getByText } = renderWithProviders(() => (
        <CityLocationModal onClose={handleClose} />
      ));

      await fireEvent.click(getByText("Use my current location"));

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it("shows error message temporarily on failure", async () => {
      vi.useFakeTimers();
      
      // Mock Geolocation Failure
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementation((success, error) => {
          error({
            code: 1,
            message: "User denied Geolocation",
          });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      // Mock IP Fetch failure
      vi.spyOn(window, "fetch").mockRejectedValue(new Error("IP fetch failed"));

      const { getByText, findByText } = renderWithProviders(() => (
        <CityLocationModal onClose={() => {}} />
      ));

      const option = getByText("Use my current location");
      await fireEvent.click(option);

      // Should show error message
      await findByText("Enable location in settings");

      // Advance time
      vi.advanceTimersByTime(3000);

      // Should revert
      await findByText("Use my current location");
      
      vi.useRealTimers();
    });
  });
});
