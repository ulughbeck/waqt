import { Show } from "solid-js";
import { usePwaUpdate } from "../../services/pwaUpdate";
import "./PwaUpdateBanner.css";

export function PwaUpdateBanner() {
  const { needRefresh, applyUpdate, dismiss } = usePwaUpdate();

  return (
    <Show when={needRefresh()}>
      <div class="pwa-update-banner" role="status" aria-live="polite">
        <div class="pwa-update-banner__content">
          <div class="pwa-update-banner__title">Update available</div>
          <div class="pwa-update-banner__message">
            A new version of Waqt is ready. Refresh to update.
          </div>
        </div>
        <div class="pwa-update-banner__actions">
          <button
            class="pwa-update-banner__button pwa-update-banner__button--primary"
            onClick={() => void applyUpdate()}
          >
            Refresh
          </button>
          <button class="pwa-update-banner__button" onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    </Show>
  );
}
