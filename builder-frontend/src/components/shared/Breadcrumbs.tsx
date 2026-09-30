import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import "./EditorNavigation.css";

export type Breadcrumb = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export default function Breadcrumbs(props: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" class="breadcrumbs">
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
                    aria-current="page"
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
