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
    above: false,
    offset: 0,
    left: 0,
    arrowLeft: 0,
    maxHeight: 0,
    scrollable: false,
  });
  const isVisible = () => (focused() || hovered()) && !dismissed();

  let containerRef: HTMLDivElement | undefined;
  let triggerRef: HTMLButtonElement | undefined;
  let contentRef: HTMLDivElement | undefined;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;
  // A tap opens through emulated hover, so only a tap on an open tooltip should close it
  let closeOnTap = false;

  // Clean up any pending timeout when the component unmounts
  onCleanup(() => {
    if (hideTimeout) clearTimeout(hideTimeout);
  });

  const updatePosition = () => {
    if (!containerRef || !contentRef) return;
    const rect = containerRef.getBoundingClientRect();
    const padding = 16; // 16px safety padding from screen edges
    const gap = 8;
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

    // Open upward only when the content doesn't fit below and there's more room above
    const spaceBelow = window.innerHeight - rect.bottom - gap - padding;
    const spaceAbove = rect.top - gap - padding;
    const contentHeight = contentRef.scrollHeight;
    const above = contentHeight > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(0, above ? spaceAbove : spaceBelow);
    setPosition({
      above,
      offset: above ? window.innerHeight - rect.top + gap : rect.bottom + gap,
      left,
      arrowLeft: center - left - 6,
      maxHeight,
      scrollable: contentHeight > maxHeight,
    });
  };

  const dismiss = () => {
    // Hiding the content would otherwise drop keyboard focus
    if (contentRef?.contains(document.activeElement)) {
      triggerRef?.focus({ preventScroll: true });
    }
    setDismissed(true);
  };

  const triggerScrolledOutOfView = () => {
    if (!containerRef) return false;
    const trigger = containerRef.getBoundingClientRect();
    for (
      let ancestor = containerRef.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      if (!/auto|scroll/.test(getComputedStyle(ancestor).overflow)) continue;
      const bounds = ancestor.getBoundingClientRect();
      if (
        trigger.bottom <= bounds.top ||
        trigger.top >= bounds.bottom ||
        trigger.right <= bounds.left ||
        trigger.left >= bounds.right
      ) {
        return true;
      }
    }
    return false;
  };

  // Fixed so a scrolling ancestor can't clip it, which means it has to follow the trigger
  createEffect(() => {
    if (!isVisible()) return;
    updatePosition();
    let scrollFrame: number | undefined;
    const onScroll = (e: Event) => {
      // Scrolling the tooltip's own content leaves the trigger where it is
      if (scrollFrame !== undefined || contentRef?.contains(e.target as Node)) {
        return;
      }
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = undefined;
        if (triggerScrolledOutOfView()) dismiss();
        else updatePosition();
      });
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    onCleanup(() => {
      if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    });
  });

  // Hover and tap leave focus elsewhere, so dismissing can't rely on the trigger's own events
  createEffect(() => {
    if (!isVisible()) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        e.stopPropagation();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef?.contains(e.target as Node)) setDismissed(true);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
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
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={props.ariaLabel ?? "More information"}
        aria-describedby={id}
        class="inline-flex rounded cursor-help focus-visible:outline-2 focus-visible:outline-offset-2"
        onPointerDown={(e: PointerEvent) => {
          closeOnTap = e.pointerType !== "mouse" && isVisible();
        }}
        onClick={() => {
          setDismissed(closeOnTap);
          closeOnTap = false;
        }}
      >
        {props.label ?? (
          <QuestionMarkIcon class="size-5 text-gray-500 hover:text-gray-700 transition-colors" />
        )}
      </button>

      <div
        id={id}
        role="tooltip"
        hidden={!isVisible()}
        style={{
          [position().above ? "bottom" : "top"]: `${position().offset}px`,
          left: `${position().left}px`,
        }}
        class="fixed z-50 w-64 max-w-[calc(100vw-2rem)] text-sm font-normal text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg fade-in"
      >
        <div
          ref={contentRef}
          // Keyboard users can only scroll content they can focus
          tabIndex={position().scrollable ? 0 : undefined}
          style={{ "max-height": `${position().maxHeight}px` }}
          class="p-3 overflow-y-auto break-words rounded-lg"
        >
          {props.children}
        </div>
        {/* Decorative arrow pointing at the trigger */}
        <div
          class="absolute w-3 h-3 bg-white border-gray-200 rotate-45"
          classList={{
            "-top-[7px] border-t border-l": !position().above,
            "-bottom-[7px] border-b border-r": position().above,
          }}
          style={{ left: `${position().arrowLeft}px` }}
        />
      </div>
    </div>
  );
}
