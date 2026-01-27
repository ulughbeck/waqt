import { createEffect, onCleanup, JSX, Show } from "solid-js";
import X from "lucide-solid/icons/x";
import "./BottomSheet.css";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  footer?: JSX.Element;
  class?: string;
}

export function BottomSheet(props: BottomSheetProps) {
  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains("bottom-sheet__backdrop")) {
      props.onClose();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      props.onClose();
    }
  }

  createEffect(() => {
    if (props.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    }

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    });
  });

  return (
    <Show when={props.isOpen}>
      <div class="bottom-sheet__backdrop" onClick={handleBackdropClick}>
        <div 
          class={`bottom-sheet ${props.class || ""}`} 
          role="dialog" 
          aria-modal="true"
          aria-label={props.title || "Dialog"}
        >
          <Show when={props.title || props.onClose}>
            <header class="bottom-sheet__header">
              <Show when={props.title}>
                <h2 class="bottom-sheet__title">{props.title}</h2>
              </Show>
              <button
                type="button"
                class="bottom-sheet__close"
                onClick={props.onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>
          </Show>
          
          <div class="bottom-sheet__content">
            {props.children}
          </div>

          <Show when={props.footer}>
            <footer class="bottom-sheet__footer">
              {props.footer}
            </footer>
          </Show>
        </div>
      </div>
    </Show>
  );
}
