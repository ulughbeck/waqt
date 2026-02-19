import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { PwaUpdateBanner } from "./PwaUpdateBanner";
import {
  resetPwaUpdateState,
  setPwaNeedRefresh,
} from "../../services/pwaUpdate";

describe("PwaUpdateBanner", () => {
  beforeEach(() => {
    resetPwaUpdateState();
  });

  it("shows update message and refresh button when needRefresh", () => {
    setPwaNeedRefresh(true);

    render(() => <PwaUpdateBanner />);

    expect(screen.getByText("Update available")).toBeTruthy();
    expect(
      screen.getByText("A new version of Waqt is ready. Refresh to update.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Later" })).toBeTruthy();
  });

  it("dismisses banner when Later is clicked", () => {
    setPwaNeedRefresh(true);

    render(() => <PwaUpdateBanner />);

    const dismissButton = screen.getByRole("button", { name: "Later" });
    fireEvent.click(dismissButton);

    expect(screen.queryByText("Update available")).toBeNull();
  });
});
