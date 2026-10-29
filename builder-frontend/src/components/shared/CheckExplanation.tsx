import { createSignal, createUniqueId, onCleanup, Show } from "solid-js";
import CircleHelp from "lucide-solid/icons/circle-help";

/** Plain text, shared by published and preview results. */
export default function CheckExplanation(props: {
  explanation?: string | null;
  name: string;
}) {
  const id = createUniqueId();
  let anchor: HTMLSpanElement | undefined;
  const [left, setLeft] = createSignal(0);
  const position = () => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 32);
    // Keep the tooltip inside the viewport, including short check names on mobile.
    setLeft(
      Math.max(
        16 - rect.left,
        Math.min(0, window.innerWidth - 16 - width - rect.left),
      ),
    );
  };
  const [focused, setFocused] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [dismissed, setDismissed] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  const visible = () => (focused() || hovered()) && !dismissed();

  return (
    <Show when={props.explanation?.trim()}>
      {(explanation) => (
        <span
          ref={anchor}
          class="relative inline-flex ml-1 align-middle"
          onMouseEnter={() => {
            position();
            clearTimeout(timer);
            setHovered(true);
            setDismissed(false);
          }}
          onMouseLeave={() => {
            // Let the pointer cross the gap to the tooltip without closing it.
            timer = setTimeout(() => setHovered(false), 150);
          }}
        >
          <button
            type="button"
            aria-label={`About ${props.name}`}
            aria-describedby={id}
            class="rounded text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
            onFocus={() => {
              position();
              setFocused(true);
              setDismissed(false);
            }}
            onBlur={() => setFocused(false)}
            onClick={() => setDismissed(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDismissed(true);
                event.stopPropagation();
              }
            }}
          >
            <CircleHelp size={18} aria-hidden="true" />
          </button>
          <span
            id={id}
            role="tooltip"
            hidden={!visible()}
            style={{ left: `${left()}px` }}
            class="absolute top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-3 text-sm font-normal text-gray-800 shadow-lg"
          >
            {explanation()}
          </span>
        </span>
      )}
    </Show>
  );
}
