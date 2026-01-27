import { createRoot, createSignal } from "solid-js";

export type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

type PwaUpdateStore = {
  needRefresh: () => boolean;
  offlineReady: () => boolean;
  setNeedRefresh: (value: boolean) => void;
  setOfflineReady: (value: boolean) => void;
  setUpdateServiceWorker: (fn: UpdateServiceWorker | null) => void;
  applyUpdate: () => Promise<void>;
  dismiss: () => void;
};

const pwaUpdateStore = createRoot<PwaUpdateStore>(() => {
  const [needRefresh, setNeedRefresh] = createSignal(false);
  const [offlineReady, setOfflineReady] = createSignal(false);
  let updateServiceWorker: UpdateServiceWorker | null = null;

  const setUpdateServiceWorker = (fn: UpdateServiceWorker | null) => {
    updateServiceWorker = fn;
  };

  const applyUpdate = async () => {
    if (updateServiceWorker) {
      await updateServiceWorker(true);
    }
  };

  const dismiss = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return {
    needRefresh,
    offlineReady,
    setNeedRefresh,
    setOfflineReady,
    setUpdateServiceWorker,
    applyUpdate,
    dismiss,
  };
});

export function registerPwaSW(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    void import("virtual:pwa-register")
      .then(({ registerSW }) => {
        const updateServiceWorker = registerSW({
          onNeedRefresh: () => {
            pwaUpdateStore.setNeedRefresh(true);
          },
          onOfflineReady: () => {
            pwaUpdateStore.setOfflineReady(true);
          },
          onRegisterError: (error) => {
            console.error("Service worker registration failed:", error);
          },
        });

        pwaUpdateStore.setUpdateServiceWorker(updateServiceWorker);
      })
      .catch((error) => {
        console.error("Service worker import failed:", error);
      });
  });
}

export function usePwaUpdate(): PwaUpdateStore {
  return pwaUpdateStore;
}

export function resetPwaUpdateState(): void {
  pwaUpdateStore.setNeedRefresh(false);
  pwaUpdateStore.setOfflineReady(false);
  pwaUpdateStore.setUpdateServiceWorker(null);
}

export function setPwaNeedRefresh(value: boolean): void {
  pwaUpdateStore.setNeedRefresh(value);
}

export function setPwaOfflineReady(value: boolean): void {
  pwaUpdateStore.setOfflineReady(value);
}

export function setPwaUpdateServiceWorker(
  fn: UpdateServiceWorker | null
): void {
  pwaUpdateStore.setUpdateServiceWorker(fn);
}
