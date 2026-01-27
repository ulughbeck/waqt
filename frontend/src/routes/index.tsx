import { createSignal, Show } from "solid-js";
import { DebugProvider } from "../providers/DebugProvider";
import { LocationProvider, useLocation } from "../providers/LocationProvider";
import { TimeProvider } from "../providers/TimeProvider";
import { LayoutProvider } from "../providers/LayoutProvider";
import {
  LocationTrigger,
  DashboardShell,
  WidgetGrid,
} from "../components/dashboard";
import { SkyScene } from "../components/sky";
import { CityLocationModal } from "../components/location";

function AppContent() {
  const { location, timezone } = useLocation();
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  return (
    <TimeProvider location={location} timezone={timezone}>
      <SkyScene />
      <DashboardShell>
        <WidgetGrid />
      </DashboardShell>
      <LocationTrigger onCityClick={() => setIsModalOpen(true)} />
      <Show when={isModalOpen()}>
        <CityLocationModal onClose={() => setIsModalOpen(false)} />
      </Show>
    </TimeProvider>
  );
}

export default function Home() {
  return (
    <main>
      <DebugProvider>
        <LocationProvider>
          <LayoutProvider>
            <AppContent />
          </LayoutProvider>
        </LocationProvider>
      </DebugProvider>
    </main>
  );
}
