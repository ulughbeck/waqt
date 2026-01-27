import { Show, createMemo } from "solid-js";
import { usePwaUpdate } from "../../services/pwaUpdate";
import "./PwaUpdateBanner.css";

export function PwaUpdateBanner() {
  const { needRefresh, offlineReady, applyUpdate, dismiss } = usePwaUpdate();

  const isVisible = createMemo(() => needRefresh() || offlineReady());
  const title = createMemo(() =>
    needRefresh() ? "Update available" : "Offline ready"
  );
  const message = createMemo(() =>
    needRefresh()
      ? "A new version of Waqt is ready. Refresh to update."
      : "Waqt is ready to use offline."
  );

  return (
    <Show when={isVisible()}>
      <div class="pwa-update-banner" role="status" aria-live="polite">
        <div class="pwa-update-banner__content">
          <div class="pwa-update-banner__title">{title()}</div>
          <div class="pwa-update-banner__message">{message()}</div>
        </div>
        <div class="pwa-update-banner__actions">
          <Show when={needRefresh()}>
            <button
              class="pwa-update-banner__button pwa-update-banner__button--primary"
              onClick={() => void applyUpdate()}
            >
              Refresh
            </button>
          </Show>
          <button class="pwa-update-banner__button" onClick={dismiss}>
            {needRefresh() ? "Later" : "Dismiss"}
          </button>
        </div>
      </div>
    </Show>
  );
}
