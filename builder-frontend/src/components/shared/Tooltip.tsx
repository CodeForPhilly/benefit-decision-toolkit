import {
  createEffect,
  createSignal,
  createUniqueId,
  JSX,
  onCleanup,
} from "solid-js";
import QuestionMarkIcon from "../icon/QuestionMarkIcon";

interface TooltipProps {
  /** Optional trigger label – defaults to the question-mark icon */
  label?: JSX.Element;
  /** Names the trigger for screen readers */
  ariaLabel?: string;
  /** Popover content (can include links, rich JSX, etc.) */
  children: JSX.Element;
}

export default function QuestionTooltip(props: TooltipProps) {
  const id = createUniqueId();
  const [focused, setFocused] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [dismissed, setDismissed] = createSignal(false);
  const [position, setPosition] = createSignal({
    top: 0,
    left: 0,
    arrowLeft: 0,
  });
  const isVisible = () => (focused() || hovered()) && !dismissed();

  let containerRef: HTMLDivElement | undefined;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  // Clean up any pending timeout when the component unmounts
  onCleanup(() => {
    if (hideTimeout) clearTimeout(hideTimeout);
  });

  const updatePosition = () => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const padding = 16; // 16px safety padding from screen edges
    const tooltipWidth = Math.min(256, window.innerWidth - padding * 2); // w-64 is 16rem = 256px

    // Center on the trigger, then keep the tooltip inside the viewport
    const center = rect.left + rect.width / 2;
    const left = Math.max(
      padding,
      Math.min(
        center - tooltipWidth / 2,
        window.innerWidth - padding - tooltipWidth,
      ),
    );
    setPosition({
      top: rect.bottom + 8,
      left,
      arrowLeft: center - left - 6,
    });
  };

  // Fixed so a scrolling ancestor can't clip it, which means it has to follow the trigger
  createEffect(() => {
    if (!isVisible()) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    onCleanup(() => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    });
  });

  return (
    <div
      ref={containerRef}
      class="inline-flex items-center justify-center"
      onMouseEnter={() => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = undefined;
        }
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => {
        // Small delay so the user can move their cursor into the popover
        hideTimeout = setTimeout(() => setHovered(false), 150);
      }}
      onFocusIn={() => {
        setFocused(true);
        setDismissed(false);
      }}
      onFocusOut={(e: FocusEvent) => {
        // Only hide if focus is leaving the entire tooltip container
        if (!containerRef?.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setDismissed(true);
          e.stopPropagation();
        }
      }}
    >
      <button
        type="button"
        aria-label={props.ariaLabel ?? "More information"}
        aria-describedby={id}
        class="inline-flex rounded cursor-help focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => setDismissed(false)}
      >
        {props.label ?? (
          <QuestionMarkIcon class="size-5 text-gray-500 hover:text-gray-700 transition-colors" />
        )}
      </button>

      <div
        id={id}
        role="tooltip"
        hidden={!isVisible()}
        style={{ top: `${position().top}px`, left: `${position().left}px` }}
        class="fixed z-50 w-64 max-w-[calc(100vw-2rem)] p-3 text-sm font-normal text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg fade-in"
      >
        {props.children}
        {/* Decorative arrow pointing up */}
        <div
          class="absolute w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45 -top-[7px]"
          style={{ left: `${position().arrowLeft}px` }}
        />
      </div>
    </div>
  );
}
