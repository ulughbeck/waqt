import { useTime } from "~/providers/useTime";
import "./HorizonCurve.css";

export function HorizonCurve() {
  const { cycle } = useTime();

  return (
    <div class={`horizon-curve horizon-curve--${cycle()}`}>
      <svg
        class="horizon-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0,100 Q 50,0 100,100 V 102 H 0 Z" class="horizon-fill" />

      </svg>
    </div>
  );
}
