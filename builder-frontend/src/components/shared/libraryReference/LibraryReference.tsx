import { For, Show } from "solid-js";

import type { LibraryReference as Reference } from "@/types";

// ISO date (YYYY-MM-DD) -> "Nov 2, 2026", independent of the viewer's time zone.
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// "NotAlreadyEnrolled" -> "Not already enrolled"
const humanize = (name: string) => {
  const words = name
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const Heading = (props: { children: string }) => (
  <div class="font-bold mt-3 mb-1">{props.children}</div>
);

/*
  The summary of a library benefit or eligibility check, plus a collapsed "Reference" panel with the
  rest of its reference. Contributor-only implementation notes are left to the docs site.
  Renders nothing for custom benefits and checks, which have no reference.
*/
const LibraryReference = (props: {
  reference?: Reference | null;
  // Set when the summary is already on screen, e.g. as the description it was copied into
  hideSummary?: boolean;
}) => (
  <Show when={props.reference}>
    {(reference) => (
      <div class="library-reference">
        <Show when={!props.hideSummary}>
          <p class="mb-2">{reference().summary}</p>
        </Show>
        <details class="border border-gray-200 rounded px-3 py-2 text-sm">
          <summary class="cursor-pointer font-bold">Reference</summary>
          <p class="mt-2">{reference().explanation}</p>

          <Show when={reference().administeredBy}>
            {(agency) => (
              <>
                <Heading>Administered by</Heading>
                <a
                  href={agency().url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline"
                >
                  {agency().name}
                </a>
              </>
            )}
          </Show>

          <Show when={reference().programYear}>
            {(year) => (
              <>
                <Heading>Program year</Heading>
                <p>
                  {year().label}: {formatDate(year().startDate)} to{" "}
                  {formatDate(year().endDate)}
                </p>
              </>
            )}
          </Show>

          <Show when={reference().checks?.length}>
            <Heading>Checks</Heading>
            <ul class="list-disc pl-5">
              <For each={reference().checks}>
                {(check) => (
                  <li>
                    <span class="font-semibold">{humanize(check.alias)}</span>
                    <Show when={check.rationale}>: {check.rationale}</Show>
                  </li>
                )}
              </For>
            </ul>
          </Show>

          <Show when={reference().parameters?.length}>
            <Heading>Parameters</Heading>
            <ul class="list-disc pl-5">
              <For each={reference().parameters}>
                {(parameter) => (
                  <li>
                    <code>{parameter.name}</code>
                    <Show when={parameter.description}>
                      : {parameter.description}
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </Show>

          <Heading>Limitations</Heading>
          <ul class="list-disc pl-5">
            <For each={reference().limitations}>
              {(limitation) => <li>{limitation}</li>}
            </For>
          </ul>

          <Heading>Sources</Heading>
          <ul class="list-disc pl-5">
            <For each={reference().sources}>
              {(source) => (
                <li>
                  <Show when={source.url} fallback={source.title}>
                    <a
                      href={source.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="underline"
                    >
                      {source.title}
                    </a>
                  </Show>
                  <Show when={source.citation}>: {source.citation}</Show>{" "}
                  (checked {formatDate(source.checkedOn)})
                </li>
              )}
            </For>
          </ul>

          <p class="mt-3 text-gray-600">
            Last reviewed {formatDate(reference().lastReviewed)} ·{" "}
            <a
              href={reference().docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="underline"
            >
              Read the full reference in the docs
            </a>
          </p>
        </details>
      </div>
    )}
  </Show>
);

export default LibraryReference;
