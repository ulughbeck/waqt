import type { JSX } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import { SkyGradient } from "./SkyGradient";
import { SkyStars } from "./SkyStars";
import { SkyOrbiter } from "./SkyOrbiter";
import { HorizonCurve } from "./HorizonCurve";
import { SkyClock } from "./SkyClock";
import { SkyDate } from "./SkyDate";
import { createSkyParallax } from "../../services/skyParallax";
import "./SkyScene.css";

interface SkySceneProps {
  children?: JSX.Element;
}

export function SkyScene(props: SkySceneProps) {
  let sceneRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!sceneRef) return;
    const cleanup = createSkyParallax(sceneRef);
    onCleanup(cleanup);
  });

  return (
    <div class="sky-scene" ref={sceneRef}>
      <SkyGradient />
      <SkyStars />
      <SkyOrbiter />
      <HorizonCurve />
      <SkyDate />
      <div class="sky-scene__clock-container">
        <SkyClock />
      </div>
      {props.children}
    </div>
  );
}
