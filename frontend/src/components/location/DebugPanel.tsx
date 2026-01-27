import { createSignal, Show, For } from "solid-js";
import SunCalc from "suncalc";
import { useDebug, type TimeOverrideState, type LocationOverrideState } from "../../providers/DebugProvider";
import { useLocation } from "../../providers/LocationProvider";
import { TIME_PRESETS, LOCATION_PRESETS } from "../../services/debugPresets";
import "./DebugPanel.css";

export function DebugPanel() {
  const debug = useDebug();
  const locationCtx = useLocation();

  const handleTimePreset = (key: string) => {
    const loc = locationCtx.location();
    if (!loc) return;

    // Use current debug date if available, otherwise today
    const dateStr = debug.state().timeOverride.date || new Date().toISOString().split("T")[0];
    const date = new Date(dateStr + "T12:00:00"); // Noon to avoid timezone shifts affecting day
    
    const times = SunCalc.getTimes(date, loc.lat, loc.lon);
    // @ts-ignore
    const time = times[key] as Date;
    
    if (time) {
       const timeStr = time.toTimeString().slice(0, 8);
       debug.setTimeOverride({
         active: true,
         time: timeStr
       });
    }
  };

  const handleLocationPreset = (preset: typeof LOCATION_PRESETS[number]) => {
    debug.setLocationOverride({
      active: true,
      lat: preset.lat,
      lon: preset.lon,
      timezone: preset.tz
    });
  };

  return (
    <Show when={debug.state().enabled}>
      <div class="debug-panel">
        {/* Time Override */}
        <div class="debug-panel__divider" />
        <section class="debug-panel__section">
          <h3 class="debug-panel__header">Time Override</h3>
          
          <div class="debug-panel__radio-group">
            <label class="debug-panel__radio-label">
              <input
                type="radio"
                name="time-mode"
                class="debug-panel__radio-input"
                checked={!debug.state().timeOverride.active}
                onChange={() => debug.setTimeOverride({ active: false })}
              />
              Use real time
            </label>
            <label class="debug-panel__radio-label">
              <input
                type="radio"
                name="time-mode"
                class="debug-panel__radio-input"
                checked={debug.state().timeOverride.active}
                onChange={() => debug.setTimeOverride({ active: true })}
              />
              Manual time
            </label>
          </div>

          <Show when={debug.state().timeOverride.active}>
            <div class="debug-panel__controls">
              <div class="debug-panel__input-group">
                <input
                  type="date"
                  class="debug-panel__input"
                  value={debug.state().timeOverride.date}
                  onInput={(e) => debug.setTimeOverride({ date: e.currentTarget.value })}
                />
                <input
                  type="time"
                  step="1"
                  class="debug-panel__input"
                  value={debug.state().timeOverride.time}
                  onInput={(e) => debug.setTimeOverride({ time: e.currentTarget.value })}
                />
              </div>

              <div class="debug-panel__presets">
                <For each={TIME_PRESETS}>
                  {(preset) => (
                    <button
                      type="button"
                      class="debug-panel__preset-btn"
                      onClick={() => handleTimePreset(preset.key)}
                    >
                      {preset.label}
                    </button>
                  )}
                </For>
              </div>

              <div class="debug-panel__row">
                <label class="debug-panel__title">⏩ Time speed</label>
                <select
                  class="debug-panel__select"
                  value={debug.state().timeOverride.speed}
                  onChange={(e) => debug.setTimeOverride({ speed: Number(e.currentTarget.value) as any })}
                >
                  <option value="1">1x (Real-time)</option>
                  <option value="10">10x (1m = 6s)</option>
                  <option value="60">60x (1h = 1m)</option>
                  <option value="360">360x (1d = 4m)</option>
                </select>
              </div>
            </div>
          </Show>
        </section>

        {/* Location Override */}
        <div class="debug-panel__divider" />
        <section class="debug-panel__section">
          <h3 class="debug-panel__header">Location Override</h3>
          
          <div class="debug-panel__radio-group">
            <label class="debug-panel__radio-label">
              <input
                type="radio"
                name="loc-mode"
                class="debug-panel__radio-input"
                checked={!debug.state().locationOverride.active}
                onChange={() => debug.setLocationOverride({ active: false })}
              />
              Use detected location
            </label>
            <label class="debug-panel__radio-label">
              <input
                type="radio"
                name="loc-mode"
                class="debug-panel__radio-input"
                checked={debug.state().locationOverride.active}
                onChange={() => debug.setLocationOverride({ active: true })}
              />
              Manual location
            </label>
          </div>

          <Show when={debug.state().locationOverride.active}>
            <div class="debug-panel__controls">
              <div class="debug-panel__input-group">
                <input
                  type="number"
                  placeholder="Latitude"
                  step="0.0001"
                  class="debug-panel__input"
                  value={debug.state().locationOverride.lat}
                  onInput={(e) => debug.setLocationOverride({ lat: Number(e.currentTarget.value) })}
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  step="0.0001"
                  class="debug-panel__input"
                  value={debug.state().locationOverride.lon}
                  onInput={(e) => debug.setLocationOverride({ lon: Number(e.currentTarget.value) })}
                />
              </div>
              <input
                type="text"
                placeholder="Timezone"
                class="debug-panel__input"
                value={debug.state().locationOverride.timezone}
                onInput={(e) => debug.setLocationOverride({ timezone: e.currentTarget.value })}
              />

              <div class="debug-panel__presets">
                <For each={LOCATION_PRESETS}>
                  {(preset) => (
                    <button
                      type="button"
                      class="debug-panel__preset-btn"
                      onClick={() => handleLocationPreset(preset)}
                    >
                      {preset.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
          </section>
      </div>
    </Show>
  );
}
