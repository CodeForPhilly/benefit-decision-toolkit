import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import "./EditorNavigation.css";

export type Breadcrumb = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export default function Breadcrumbs(props: {
  items: Breadcrumb[];
  // A page-level trail is labelled "Breadcrumb" and marks the current page.
  // A trail inside part of a page needs its own label, and marks its last
  // item as the current item of that trail rather than the current page.
  label?: string;
  current?: "page" | "true";
}) {
  return (
    <nav aria-label={props.label ?? "Breadcrumb"} class="breadcrumbs">
      <ol class="breadcrumb-list">
        <For each={props.items}>
          {(item, index) => (
            <li class="breadcrumb-item">
              <Show when={index() > 0}>
                <span aria-hidden="true" class="breadcrumb-separator">
                  /
                </span>
              </Show>
              <Show
                when={index() < props.items.length - 1}
                fallback={
                  <span
                    aria-current={props.current ?? "page"}
                    class="breadcrumb-current"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                }
              >
                <Show
                  when={item.href}
                  fallback={
                    <button
                      type="button"
                      class="breadcrumb-parent"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  }
                >
                  <A href={item.href!} class="breadcrumb-parent">
                    {item.label}
                  </A>
                </Show>
              </Show>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}
