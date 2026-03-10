import { createSignal, JSX, onCleanup, Show } from "solid-js";
import QuestionMarkIcon from "../icon/QuestionMarkIcon";

export enum TooltipAlignment {
  Center = "center",
  Left = "left",
  Right = "right",
}

interface TooltipProps {
  /** Optional trigger label – defaults to the question-mark icon */
  label?: JSX.Element;
  /** Popover content (can include links, rich JSX, etc.) */
  children: JSX.Element;
}

export default function QuestionTooltip(props: TooltipProps) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [position, setPosition] = createSignal<{
    x: number;
    align: TooltipAlignment;
    containerWidth: number;
  }>({ x: 0, align: TooltipAlignment.Center, containerWidth: 0 });

  let containerRef: HTMLDivElement | undefined;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  // Clean up any pending timeout when the component unmounts
  onCleanup(() => {
    if (hideTimeout) clearTimeout(hideTimeout);
  });

  const determineAlignment = (rect: DOMRect): TooltipAlignment => {
    const tooltipWidth = 256; // w-64 is 16rem = 256px

    // Calculate potential left and right bounds if centered
    const centerLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const centerRight = centerLeft + tooltipWidth;

    const viewportWidth = window.innerWidth;
    const padding = 16; // 16px safety padding from screen edges

    if (centerLeft < padding) {
      return TooltipAlignment.Left;
    } else if (centerRight > viewportWidth - padding) {
      return TooltipAlignment.Right;
    } else {
      return TooltipAlignment.Center;
    }
  };

  const show = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = undefined;
    }
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const align = determineAlignment(rect);
      setPosition({ x: 0, align, containerWidth: rect.width });
    }
    setIsVisible(true);
  };

  const hide = () => {
    // Small delay so the user can move their cursor into the popover
    hideTimeout = setTimeout(() => setIsVisible(false), 150);
  };

  return (
    <div
      ref={containerRef}
      class="relative inline-flex items-center justify-center cursor-help"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={(e: FocusEvent) => {
        // Only hide if focus is leaving the entire tooltip container
        if (!containerRef?.contains(e.relatedTarget as Node)) {
          hide();
        }
      }}
      tabIndex={0}
      aria-label="More information"
    >
      {props.label ?? (
        <QuestionMarkIcon class="size-5 text-gray-500 hover:text-gray-700 transition-colors" />
      )}

      <Show when={isVisible()}>
        <div
          class={`absolute z-50 w-64 p-3 mt-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg top-full fade-in ${
            position().align === TooltipAlignment.Center
              ? "left-1/2 -translate-x-1/2"
              : position().align === TooltipAlignment.Left
                ? "left-0"
                : "right-0"
          }`}
        >
          {props.children}
          {/* Decorative arrow pointing up */}
          <div
            class={`absolute w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45 -top-[7px] ${
              position().align === TooltipAlignment.Center
                ? "left-1/2 -translate-x-1/2"
                : ""
            }`}
            style={
              position().align === TooltipAlignment.Left
                ? { left: `${position().containerWidth / 2 - 6}px` }
                : position().align === TooltipAlignment.Right
                  ? { right: `${position().containerWidth / 2 - 6}px` }
                  : {}
            }
          />
        </div>
      </Show>
    </div>
  );
}