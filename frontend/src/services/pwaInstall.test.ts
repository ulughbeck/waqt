import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  initPwaInstall,
  usePwaInstall,
  resetPwaInstallState,
  showInstallBanner,
  setPwaInstallPromptEvent,
} from "./pwaInstall";

const buildPromptEvent = (outcome: "accepted" | "dismissed") => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const userChoice = Promise.resolve({ outcome, platform: "web" });
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  };

  event.prompt = prompt;
  event.userChoice = userChoice;

  return { event, prompt };
};

describe("pwaInstall", () => {
  beforeEach(() => {
    resetPwaInstallState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("shows the install banner after delay only when prompt is available", () => {
    const store = usePwaInstall();
    const cleanup = initPwaInstall({ delayMs: 50 });
    const { event } = buildPromptEvent("accepted");

    window.dispatchEvent(event);

    expect(store.isVisible()).toBe(false);

    vi.advanceTimersByTime(50);

    expect(store.isVisible()).toBe(true);
    expect(store.status()).toBe("ready");

    cleanup();
  });

  it("shows the banner only once per session", () => {
    const store = usePwaInstall();
    const { event } = buildPromptEvent("accepted");
    setPwaInstallPromptEvent(event as never);

    showInstallBanner();
    expect(store.isVisible()).toBe(true);

    store.dismiss();
    expect(store.isVisible()).toBe(false);

    showInstallBanner();
    expect(store.isVisible()).toBe(false);
  });

  it("does not show banner after delay when prompt is unavailable", () => {
    const store = usePwaInstall();
    const cleanup = initPwaInstall({ delayMs: 50 });

    vi.advanceTimersByTime(50);

    expect(store.isVisible()).toBe(false);
    expect(store.status()).toBe("hidden");

    cleanup();
  });

  it("shows banner when prompt arrives after delay", () => {
    const store = usePwaInstall();
    const cleanup = initPwaInstall({ delayMs: 50 });

    vi.advanceTimersByTime(50);
    expect(store.isVisible()).toBe(false);

    const { event } = buildPromptEvent("accepted");
    window.dispatchEvent(event);

    expect(store.isVisible()).toBe(true);
    expect(store.status()).toBe("ready");

    cleanup();
  });

  it("stores beforeinstallprompt and triggers prompt", async () => {
    const store = usePwaInstall();
    const cleanup = initPwaInstall({ delayMs: 0 });
    const { event, prompt } = buildPromptEvent("accepted");

    window.dispatchEvent(event);

    expect(store.canPrompt()).toBe(true);

    await store.triggerInstall();

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(store.status()).toBe("installed");
    expect(store.isVisible()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(store.isVisible()).toBe(false);

    cleanup();
  });

  it("marks declined when user dismisses prompt", async () => {
    const store = usePwaInstall();
    const { event } = buildPromptEvent("dismissed");

    setPwaInstallPromptEvent(event as never);
    await store.triggerInstall();

    expect(store.status()).toBe("declined");
    expect(store.isVisible()).toBe(true);
  });
});
