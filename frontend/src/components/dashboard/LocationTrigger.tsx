import MapPin from "lucide-solid/icons/map-pin";
import Save from "lucide-solid/icons/save";
import { useLocation } from "~/providers/useLocation";
import { useLayout } from "~/providers/LayoutProvider";
import { useLongPress } from "~/hooks/useLongPress";
import "./LocationTrigger.css";

export interface LocationTriggerProps {
  onCityClick: () => void;
}

export function LocationTrigger(props: LocationTriggerProps) {
  const { location } = useLocation();
  const { isEditing, toggleEditMode, saveLayout } = useLayout();

  const handleTriggerClick = () => {
    if (isEditing()) {
      saveLayout();
    } else {
      props.onCityClick();
    }
  };

  const longPress = useLongPress(() => {
    if (!isEditing()) {
      toggleEditMode();
    }
  }, handleTriggerClick);

  return (
    <button
      class={`location-trigger ${isEditing() ? "location-trigger--save" : ""}`}
      {...longPress}
      aria-label={isEditing() ? "Save Layout" : "Change location"}
      type="button"
    >
      {isEditing() ? <Save size={18} /> : <MapPin size={18} />}
      <span>{isEditing() ? "Save Layout" : location()?.city || "Select City"}</span>
    </button>
  );
}
