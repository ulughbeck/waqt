import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@solidjs/testing-library";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("renders when open", () => {
    render(() => (
      <BottomSheet isOpen={true} onClose={() => {}} title="Test Sheet">
        <div>Content</div>
      </BottomSheet>
    ));
    expect(screen.getByText("Test Sheet")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(() => (
      <BottomSheet isOpen={false} onClose={() => {}} title="Test Sheet">
        <div>Content</div>
      </BottomSheet>
    ));
    expect(screen.queryByText("Test Sheet")).toBeNull();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(() => (
      <BottomSheet isOpen={true} onClose={onClose} title="Test Sheet">
        <div>Content</div>
      </BottomSheet>
    ));
    
    // BottomSheet renders backdrop with class 'bottom-sheet__backdrop'
    const backdrop = container.querySelector(".bottom-sheet__backdrop");
    expect(backdrop).toBeTruthy();
    
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });
  
  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(() => (
      <BottomSheet isOpen={true} onClose={onClose} title="Test Sheet">
        <div>Content</div>
      </BottomSheet>
    ));
    
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
