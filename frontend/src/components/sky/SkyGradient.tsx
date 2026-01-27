import { createMemo } from "solid-js";
import { useTime } from "~/providers/useTime";
import { getSkyGradientCss } from "../../services/skyGradients";
import "./SkyGradient.css";

export function SkyGradient() {
  const { helpers } = useTime();
  const gradientState = createMemo(() => helpers.gradientState());

  return (
    <div class="sky-gradient" aria-hidden="true">
      <div
        class="sky-gradient__layer"
        style={{
          opacity: 1 - gradientState().mix,
          background: getSkyGradientCss(gradientState().from),
        }}
      />
      <div
        class="sky-gradient__layer"
        style={{
          opacity: gradientState().mix,
          background: getSkyGradientCss(gradientState().to),
        }}
      />
    </div>
  );
}
