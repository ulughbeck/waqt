export function useLongPress(
  onLongPress: () => void,
  onClick?: (e: any) => void,
  threshold = 500
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isLongPressTriggered = false;
  let suppressClick = false;
  let suppressClickTimer: ReturnType<typeof setTimeout> | undefined;
  let ignoreMouseUntil = 0;

  const start = (source: "mouse" | "touch") => {
    if (source === "mouse" && Date.now() < ignoreMouseUntil) return;
    // Reset state on new press
    isLongPressTriggered = false;
    suppressClick = false;
    clear();
    timer = setTimeout(() => {
      isLongPressTriggered = true;
      suppressClick = true;
      if (suppressClickTimer) clearTimeout(suppressClickTimer);
      suppressClickTimer = setTimeout(() => {
        suppressClick = false;
      }, 800);
      onLongPress();
    }, threshold);
  };

  const clear = (source?: "mouse" | "touch") => {
    if (source === "touch") {
      // Block synthetic mouse events that fire after touch interactions.
      ignoreMouseUntil = Date.now() + 700;
    }
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const handleClick = (e: any) => {
    if (isLongPressTriggered || suppressClick) {
      // Prevent the click from propagating or doing its default action if needed,
      // but mainly just don't call the passed onClick
      e.preventDefault?.();
      e.stopPropagation?.();
      suppressClick = false;
      return;
    }
    onClick?.(e);
  };

  return {
    onMouseDown: () => start("mouse"),
    onTouchStart: () => start("touch"),
    onMouseUp: () => clear("mouse"),
    onMouseLeave: () => clear("mouse"),
    onTouchEnd: () => clear("touch"),
    onTouchCancel: () => clear("touch"),
    onClick: handleClick,
  };
}
