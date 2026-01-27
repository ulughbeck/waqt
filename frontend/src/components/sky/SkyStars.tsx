import { createMemo, For } from "solid-js";
import { useTime } from "~/providers/useTime";
import "./SkyStars.css";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkle: boolean;
  twinkleDuration: number;
}

function generateStars(count = 50): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const y = Math.pow(Math.random(), 1.5) * 100;

    return {
      id: i,
      x: Math.random() * 100,
      y,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.5,
      twinkle: Math.random() < 0.25,
      twinkleDuration: 2 + Math.random() * 2,
    };
  });
}

function getStarOpacity(baseOpacity: number, yPercent: number): number {
  if (yPercent > 70) {
    return baseOpacity * (1 - (yPercent - 70) / 30);
  }
  return baseOpacity;
}

export function SkyStars() {
  const { cycle } = useTime();

  const stars = createMemo(() => generateStars());

  const containerOpacity = createMemo((): number => {
    switch (cycle()) {
      case "night":
        return 1;
      case "dusk":
        return 0.5;
      case "dawn":
        return 0.3;
      case "day":
        return 0;
    }
  });

  const isVisible = createMemo(() => containerOpacity() > 0);

  return (
    <div
      class="sky-stars"
      style={{ "--stars-opacity": containerOpacity() }}
      aria-hidden="true"
    >
      <For each={isVisible() ? stars() : []}>
        {(star) => {
          const finalOpacity = getStarOpacity(star.opacity, star.y);
          return (
            <div
              class="sky-stars__star"
              classList={{ "sky-stars__star--twinkle": star.twinkle }}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                "--star-opacity": finalOpacity,
                "--twinkle-duration": `${star.twinkleDuration}s`,
              }}
            />
          );
        }}
      </For>
    </div>
  );
}
