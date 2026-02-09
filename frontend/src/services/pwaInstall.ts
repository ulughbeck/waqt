import { createRoot, createSignal } from "solid-js";

// Custom install prompt flow. See specs/02-pwa.md (Install Prompt section).
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallStatus = "hidden" | "ready" | "declined" | "installed";

type PwaInstallStore = {
  isVisible: () => boolean;
  status: () => InstallStatus;
  canPrompt: () => boolean;
  triggerInstall: () => Promise<void>;
  dismiss: () => void;
  showBanner: () => void;
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setInstalledState: (value: boolean) => void;
  announceInstalled: () => void;
  setIsVisible: (value: boolean) => void;
  setStatus: (value: InstallStatus) => void;
  setHasShown: (value: boolean) => void;
};

const INSTALL_PROMPT_DELAY_MS = 40_000;
const INSTALL_CONFIRMATION_MS = 2_000;

const pwaInstallStore = createRoot<PwaInstallStore>(() => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [status, setStatus] = createSignal<InstallStatus>("hidden");
  const [hasShown, setHasShown] = createSignal(false);
  const [isInstalled, setIsInstalled] = createSignal(false);
  const [deferredPrompt, setDeferredPrompt] =
    createSignal<BeforeInstallPromptEvent | null>(null);

  const canPrompt = () => deferredPrompt() !== null;

  const showBanner = () => {
    if (hasShown() || isInstalled() || !canPrompt()) {
      return;
    }

    setHasShown(true);
    setStatus("ready");
    setIsVisible(true);
  };

  const dismiss = () => {
    setIsVisible(false);
    if (status() !== "installed") {
      setStatus("hidden");
    }
  };

  const setInstalledState = (value: boolean) => {
    setIsInstalled(value);
    if (value) {
      setStatus("installed");
      setIsVisible(false);
    } else if (status() === "installed") {
      setStatus("hidden");
    }
  };

  const announceInstalled = () => {
    setIsInstalled(true);
    setStatus("installed");
    setIsVisible(true);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setIsVisible(false);
      }, INSTALL_CONFIRMATION_MS);
    }
  };

  const handleUserChoice = (outcome: "accepted" | "dismissed") => {
    if (outcome === "accepted") {
      announceInstalled();
    } else {
      setStatus("declined");
      setIsVisible(true);
    }
  };

  const triggerInstall = async () => {
    const promptEvent = deferredPrompt();
    if (!promptEvent) {
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      handleUserChoice(choice.outcome);
    } catch (error) {
      console.error("PWA install prompt failed:", error);
      setStatus("declined");
      setIsVisible(true);
    } finally {
      setDeferredPrompt(null);
    }
  };

  return {
    isVisible,
    status,
    canPrompt,
    triggerInstall,
    dismiss,
    showBanner,
    setDeferredPrompt,
    setInstalledState,
    announceInstalled,
    setIsVisible,
    setStatus,
    setHasShown,
  };
});

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const displayMode = window.matchMedia?.("(display-mode: standalone)");
  const isStandalone = displayMode?.matches ?? false;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone || iosStandalone;
}

export function initPwaInstall(options?: { delayMs?: number }): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (isStandaloneDisplay()) {
    pwaInstallStore.setInstalledState(true);
    return () => undefined;
  }

  let delayElapsed = false;

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    pwaInstallStore.setDeferredPrompt(event as BeforeInstallPromptEvent);
    if (delayElapsed) {
      pwaInstallStore.showBanner();
    }
  };

  const handleAppInstalled = () => {
    pwaInstallStore.announceInstalled();
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  const delayMs = options?.delayMs ?? INSTALL_PROMPT_DELAY_MS;
  const timerId = window.setTimeout(() => {
    delayElapsed = true;
    pwaInstallStore.showBanner();
  }, delayMs);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
    window.clearTimeout(timerId);
  };
}

export function usePwaInstall(): PwaInstallStore {
  return pwaInstallStore;
}

export function showInstallBanner(): void {
  pwaInstallStore.showBanner();
}

export function setPwaInstallPromptEvent(
  event: BeforeInstallPromptEvent | null
): void {
  pwaInstallStore.setDeferredPrompt(event);
}

export function setPwaInstalled(value: boolean): void {
  pwaInstallStore.setInstalledState(value);
}

export function announcePwaInstalled(): void {
  pwaInstallStore.announceInstalled();
}

export function resetPwaInstallState(): void {
  pwaInstallStore.setInstalledState(false);
  pwaInstallStore.setDeferredPrompt(null);
  pwaInstallStore.setIsVisible(false);
  pwaInstallStore.setStatus("hidden");
  pwaInstallStore.setHasShown(false);
}

export function setPwaInstallStatus(status: InstallStatus): void {
  pwaInstallStore.setStatus(status);
}

export function setPwaInstallVisible(value: boolean): void {
  pwaInstallStore.setIsVisible(value);
}
