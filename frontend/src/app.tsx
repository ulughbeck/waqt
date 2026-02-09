import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount } from "solid-js";
import { PwaInstallBanner } from "./components/pwa/PwaInstallBanner";
import { PwaUpdateBanner } from "./components/pwa/PwaUpdateBanner";
import "./root.css";
import "./app.css";

export default function App() {
  onMount(() => {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.remove();
    }
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Waqt</Title>
          <Suspense>{props.children}</Suspense>
          <PwaInstallBanner />
          <PwaUpdateBanner />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
