import { createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import MapPin from "lucide-solid/icons/map-pin";
import Locate from "lucide-solid/icons/locate";
import X from "lucide-solid/icons/x";
import { useLocation } from "~/providers/useLocation";
import { useTime } from "~/providers/useTime";
import { useDebug } from "~/providers/DebugProvider";
import {
  searchCities,
  formatCityLabel,
  type CitySuggestion,
} from "~/services/citySearch";
import { BottomSheet } from "~/components/ui/BottomSheet";
import { DebugPanel } from "./DebugPanel";
import "./CityLocationModal.css";

export interface CityLocationModalProps {
  onClose: () => void;
}

export function CityLocationModal(props: CityLocationModalProps) {
  const {
    location,
    manualLocation,
    refreshLocation,
    error: locationContextError,
  } = useLocation();
  const { refreshTiming } = useTime();
  const debug = useDebug();

  const [query, setQuery] = createSignal(location()?.city ?? "");
  const [userInteracted, setUserInteracted] = createSignal(false);
  const [suggestions, setSuggestions] = createSignal<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isOffline, setIsOffline] = createSignal(!navigator.onLine);
  const [locateError, setLocateError] = createSignal(false);

  const [clickCount, setClickCount] = createSignal(0);
  const [lastClickTime, setLastClickTime] = createSignal(0);
  const [showToast, setShowToast] = createSignal(false);
  const [toastMessage, setToastMessage] = createSignal("");

  let inputRef: HTMLInputElement | undefined;
  let abortController: AbortController | null = null;
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const loc = location();
    if (loc?.city && !userInteracted()) {
      setQuery(loc.city);
    }
  });

  createEffect(() => {
    inputRef?.focus();
  });

  createEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    onCleanup(() => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    });
  });

  onCleanup(() => {
    abortController?.abort();
    if (debounceTimeout) clearTimeout(debounceTimeout);
  });

  function handleInputChange(value: string) {
    setQuery(value);
    setUserInteracted(true);
    setError(null);

    if (debounceTimeout) clearTimeout(debounceTimeout);
    abortController?.abort();

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimeout = setTimeout(async () => {
      if (isOffline()) {
        setError("Search requires internet");
        return;
      }

      setIsLoading(true);
      abortController = new AbortController();

      const result = await searchCities(value, {
        signal: abortController.signal,
      });

      setIsLoading(false);

      if (result.error) {
        setError(result.error);
        setSuggestions([]);
      } else {
        setSuggestions(result.suggestions);
      }
    }, 300);
  }

  function handleSelect(city: CitySuggestion) {
    manualLocation({
      lat: city.lat,
      lon: city.lon,
      city: city.name,
      timezone: city.timezone,
    });
    props.onClose();
  }

  function handleClear() {
    setQuery("");
    setUserInteracted(true);
    setSuggestions([]);
    setError(null);
    inputRef?.focus();
  }

  function handleMapPinClick() {
    const now = Date.now();
    if (now - lastClickTime() < 500) {
      setClickCount((c) => c + 1);
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);

    if (clickCount() === 7) {
      const newState = !debug.state().enabled;
      debug.setEnabled(newState);
      setToastMessage(
        newState ? "Developer Mode Enabled" : "Developer Mode Disabled",
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setClickCount(0);
    }
  }

  async function handleUseCurrentLocation() {
    setLocateError(false);

    await refreshLocation();

    if (locationContextError()) {
      setLocateError(true);
      setTimeout(() => setLocateError(false), 3000);
    } else {
      props.onClose();
    }
  }

  return (
    <BottomSheet
      isOpen={true}
      onClose={props.onClose}
      class="location-modal-sheet"
      title="Location"
    >
      <div class="location-modal__content">
        <Show when={debug.state().enabled}>
          <button
            class="location-modal__debug-disable-btn"
            onClick={() => {
              debug.setEnabled(false);
              const loc = location();
              if (loc?.city) {
                setQuery(loc.city);
                setUserInteracted(false);
                setSuggestions([]);
                setError(null);
                inputRef?.focus();
              } else {
                handleClear();
              }
            }}
          >
            Disable Developer Mode
          </button>
        </Show>
        <div class="location-modal__input-wrapper">
          <button
            type="button"
            class="location-modal__input-icon-btn"
            onClick={handleMapPinClick}
            aria-label="Debug Toggle"
          >
            <MapPin size={18} class="location-modal__input-icon" />
          </button>
          <input
            ref={inputRef}
            type="text"
            class="location-modal__input"
            placeholder="Search city..."
            value={query()}
            onInput={(e) => handleInputChange(e.currentTarget.value)}
            aria-label="City search"
            disabled={debug.state().enabled}
          />
          <Show when={query().length > 0 && !debug.state().enabled}>
            <button
              type="button"
              class="location-modal__clear-btn"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          </Show>
        </div>

        <Show when={!debug.state().enabled}>
          <Show when={isOffline() && query().length >= 2}>
            <div class="location-modal__message location-modal__message--offline">
              Search requires internet
            </div>
          </Show>

          <Show when={query().length === 0}>
            <ul class="location-modal__suggestions" role="listbox">
              <li
                class="location-modal__suggestion"
                onClick={handleUseCurrentLocation}
                role="option"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleUseCurrentLocation();
                  }
                }}
              >
                <Locate size={16} class="location-modal__suggestion-icon" />
                <span>
                  {locateError()
                    ? "Enable location in settings"
                    : "Use my current location"}
                </span>
              </li>
            </ul>
          </Show>

          <Show when={error() && !isOffline()}>
            <div class="location-modal__message location-modal__message--error">
              {error()}
            </div>
          </Show>

          <Show when={isLoading()}>
            <div class="location-modal__message">Searching...</div>
          </Show>

          <Show when={suggestions().length > 0 && !isLoading()}>
            <ul class="location-modal__suggestions" role="listbox">
              <For each={suggestions()}>
                {(city) => (
                  <li
                    class="location-modal__suggestion"
                    onClick={() => handleSelect(city)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelect(city);
                      }
                    }}
                  >
                    <MapPin size={16} class="location-modal__suggestion-icon" />
                    <span>{formatCityLabel(city)}</span>
                  </li>
                )}
              </For>
            </ul>
          </Show>

          <Show
            when={
              query().length >= 2 &&
              suggestions().length === 0 &&
              !isLoading() &&
              !error() &&
              !isOffline()
            }
          >
            <div class="location-modal__message">No cities found</div>
          </Show>
        </Show>

        <DebugPanel />

        <Show when={showToast()}>
          <div
            style={{
              position: "fixed",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "8px 16px",
              "border-radius": "20px",
              "font-size": "14px",
              "z-index": "9999",
              "pointer-events": "none",
              "backdrop-filter": "blur(4px)",
            }}
          >
            {toastMessage()}
          </div>
        </Show>
      </div>
    </BottomSheet>
  );
}
