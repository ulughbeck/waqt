import type { Component } from "solid-js";

interface IconProps {
  size?: number | string;
  color?: string;
  class?: string;
}

function createMockIcon(name: string): Component<IconProps> {
  return (props: IconProps) => (
    <svg
      data-testid={`icon-${name}`}
      width={props.size || 24}
      height={props.size || 24}
      class={props.class}
    />
  );
}

export const Settings = createMockIcon("settings");
export const MapPin = createMockIcon("map-pin");
export const Info = createMockIcon("info");
export const X = createMockIcon("x");
export const LayoutDashboard = createMockIcon("layout-dashboard");
