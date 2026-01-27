import { useTime } from "~/providers/useTime";
import { formatDate } from "../../services/format";
import "./SkyDate.css";

export function SkyDate() {
  const { time } = useTime();

  const formattedDate = () => formatDate(time());

  return (
    <div class="sky-date" role="status" aria-label="Current date">
      {formattedDate()}
    </div>
  );
}
