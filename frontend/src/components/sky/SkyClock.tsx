import { useTime } from "~/providers/useTime";
import { formatClockTime } from "../../services/format";
import "./SkyClock.css";

export function SkyClock() {
  const { time } = useTime();

  const formattedTime = () => formatClockTime(time());

  return (
    <div class="sky-clock" role="timer" aria-label="Current time">
      <div class="sky-clock__time">{formattedTime()}</div>
    </div>
  );
}
