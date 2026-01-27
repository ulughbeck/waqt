export type SkyCycle = "dawn" | "day" | "dusk" | "night";

export type GradientStop = {
  color: string;
  position: string;
};

const SKY_GRADIENT_STOPS: Record<SkyCycle, GradientStop[]> = {
  dawn: [
    { color: "#0C1020", position: "0%" },
    { color: "#1A1E32", position: "20%" },
    { color: "#333C5A", position: "40%" },
    { color: "#6E5A7D", position: "60%" },
    { color: "#C47E84", position: "80%" },
    { color: "#FFB088", position: "100%" },
  ],
  day: [
    { color: "#1A5FB4", position: "0%" },
    { color: "#3F85CD", position: "25%" },
    { color: "#6DAEE6", position: "50%" },
    { color: "#AAD7F5", position: "75%" },
    { color: "#E8F4F8", position: "100%" },
  ],
  dusk: [
    { color: "#15192F", position: "0%" },
    { color: "#282C47", position: "20%" },
    { color: "#4B4366", position: "40%" },
    { color: "#8E5E74", position: "60%" },
    { color: "#CC7A5C", position: "80%" },
    { color: "#FFB366", position: "100%" },
  ],
  night: [
    { color: "#050510", position: "0%" },
    { color: "#0D0F1E", position: "25%" },
    { color: "#14162C", position: "50%" },
    { color: "#1C1E38", position: "75%" },
    { color: "#252545", position: "100%" },
  ],
};

export function getSkyGradientStops(cycle: SkyCycle): GradientStop[] {
  return SKY_GRADIENT_STOPS[cycle];
}

export function getSkyGradientCss(cycle: SkyCycle): string {
  const stops = getSkyGradientStops(cycle)
    .map((stop) => `${stop.color} ${stop.position}`)
    .join(", ");
  return `linear-gradient(to bottom, ${stops})`;
}
