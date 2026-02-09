import { Show, createMemo } from "solid-js";
import { usePwaInstall } from "../../services/pwaInstall";
import "./PwaInstallBanner.css";

// Custom install banner. See specs/02-pwa.md (Install Prompt section).
export function PwaInstallBanner() {
  const { isVisible, status, canPrompt, triggerInstall, dismiss } =
    usePwaInstall();

  const title = createMemo(() => {
    switch (status()) {
      case "installed":
        return "Waqt installed";
      case "declined":
        return "Install dismissed";
      default:
        return "Install Waqt";
    }
  });

  const message = createMemo(() => {
    switch (status()) {
      case "installed":
        return "Waqt is ready on your home screen.";
      case "declined":
        return "You can install later from Share > Add to Home Screen.";
      default:
        return "Add Waqt to your home screen for quick access. Use Share > Add to Home Screen.";
    }
  });

  const showInstallButton = createMemo(() =>
    status() === "ready" && canPrompt()
  );
  const showActions = createMemo(() => status() !== "installed");

  return (
    <Show when={isVisible()}>
      <div class="pwa-install-banner" role="status" aria-live="polite">
        <div class="pwa-install-banner__content">
          <div class="pwa-install-banner__title">{title()}</div>
          <div class="pwa-install-banner__message">{message()}</div>
        </div>
        <Show when={showActions()}>
          <div class="pwa-install-banner__actions">
            <Show when={showInstallButton()}>
              <button
                class="pwa-install-banner__button pwa-install-banner__button--primary"
                onClick={() => void triggerInstall()}
              >
                Install
              </button>
            </Show>
            <button class="pwa-install-banner__button" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </Show>
      </div>
    </Show>
  );
}
