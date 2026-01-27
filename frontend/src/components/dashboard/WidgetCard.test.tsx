import { describe, it, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import { WidgetCard } from "./WidgetCard";

describe("WidgetCard", () => {
  describe("rendering", () => {
    it("renders children", () => {
      const { getByText } = render(() => (
        <WidgetCard>
          <span>Test Content</span>
        </WidgetCard>
      ));

      expect(getByText("Test Content")).toBeDefined();
    });

    it("has widget-card class", () => {
      const { container } = render(() => (
        <WidgetCard>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card");
      expect(card).not.toBeNull();
    });

    it("supports role prop", () => {
      const { container } = render(() => (
        <WidgetCard role="region">
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector('[role="region"]');
      expect(card).not.toBeNull();
    });
  });

  describe("state classes", () => {
    it("applies highlighted class when highlighted prop is true", () => {
      const { container } = render(() => (
        <WidgetCard highlighted>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card--highlighted");
      expect(card).not.toBeNull();
    });

    it("applies muted class when muted prop is true", () => {
      const { container } = render(() => (
        <WidgetCard muted>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card--muted");
      expect(card).not.toBeNull();
    });

    it("applies loading class when loading prop is true", () => {
      const { container } = render(() => (
        <WidgetCard loading>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card--loading");
      expect(card).not.toBeNull();
    });

    it("applies interactive class when interactive prop is true", () => {
      const { container } = render(() => (
        <WidgetCard interactive>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card--interactive");
      expect(card).not.toBeNull();
    });

    it("supports custom class prop", () => {
      const { container } = render(() => (
        <WidgetCard class="custom-class">
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".custom-class");
      expect(card).not.toBeNull();
    });

    it("combines multiple state classes", () => {
      const { container } = render(() => (
        <WidgetCard highlighted loading>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".widget-card");
      expect(card?.classList.contains("widget-card--highlighted")).toBe(true);
      expect(card?.classList.contains("widget-card--loading")).toBe(true);
    });
  });

  describe("grid props", () => {
    it("applies colSpan class", () => {
      const { container } = render(() => (
        <WidgetCard colSpan={4}>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".col-span-4");
      expect(card).not.toBeNull();
    });

    it("applies rowSpan class", () => {
      const { container } = render(() => (
        <WidgetCard rowSpan={2}>
          <span>Content</span>
        </WidgetCard>
      ));

      const card = container.querySelector(".row-span-2");
      expect(card).not.toBeNull();
    });
  });
});
