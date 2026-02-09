import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { PwaInstallBanner } from "./PwaInstallBanner";
import {
  resetPwaInstallState,
  setPwaInstallPromptEvent,
  setPwaInstallStatus,
  setPwaInstallVisible,
} from "../../services/pwaInstall";

const buildPromptEvent = () =>
  ({
    prompt: async () => undefined,
    userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
  }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  };

describe("PwaInstallBanner", () => {
  beforeEach(() => {
    resetPwaInstallState();
  });

  it("renders install guidance without native prompt", () => {
    setPwaInstallStatus("ready");
    setPwaInstallVisible(true);

    render(() => <PwaInstallBanner />);

    expect(screen.getByText("Install Waqt")).toBeTruthy();
    expect(
      screen.getByText(
        "Add Waqt to your home screen for quick access. Use Share > Add to Home Screen."
      )
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
  });

  it("shows install button when beforeinstallprompt is available", () => {
    setPwaInstallStatus("ready");
    setPwaInstallVisible(true);
    setPwaInstallPromptEvent(buildPromptEvent());

    render(() => <PwaInstallBanner />);

    expect(screen.getByRole("button", { name: "Install" })).toBeTruthy();
  });
});
