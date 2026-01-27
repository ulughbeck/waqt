import type { JSX } from "solid-js";
import "./WidgetCard.css";

interface WidgetCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element;
  highlighted?: boolean;
  muted?: boolean;
  loading?: boolean;
  interactive?: boolean;
  colSpan?: number;
  rowSpan?: number;
}

export function WidgetCard(props: WidgetCardProps) {
  const classes = () => {
    const result = ["widget-card"];
    if (props.highlighted) result.push("widget-card--highlighted");
    if (props.muted) result.push("widget-card--muted");
    if (props.loading) result.push("widget-card--loading");
    if (props.interactive) result.push("widget-card--interactive");
    if (props.colSpan) result.push(`col-span-${props.colSpan}`);
    if (props.rowSpan) result.push(`row-span-${props.rowSpan}`);
    if (props.class) result.push(props.class);
    return result.join(" ");
  };

  const {
    highlighted,
    muted,
    loading,
    interactive,
    colSpan,
    rowSpan,
    class: className,
    children,
    ...rest
  } = props;

  return (
    <div class={classes()} {...rest}>
      {children}
    </div>
  );
}
