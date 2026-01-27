import type { Component } from "solid-js";

interface IconProps {
  size?: number | string;
  color?: string;
  class?: string;
}

const MockIcon: Component<IconProps> = (props) => (
  <svg
    data-testid="mock-icon"
    width={props.size || 24}
    height={props.size || 24}
    class={props.class}
  />
);

export default MockIcon;
