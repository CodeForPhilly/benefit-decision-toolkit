import { result } from "lodash";
import { For, onMount } from "solid-js";

export default function Results({ results }) {
  return (
    <div class="my-4 mx-8 p-4 border border-gray-300 rounded shadow-sm">
      <div class="text-lg text-gray-800 text-md font-bold">Results</div>
      <div class="my-2">
        {results() && results().inputs && (
          <>
            <div class="text-md font-semibold text-gray-600">Inputs</div>

            <div class="p-2 ">
              <div class="flex flex-col">
                <For each={Object.entries(results().inputs)}>
                  {([key, value]) => (
                    <div class="flex text-sm text-gray-700">
                      <span class="font-medium capitalize">{key}:</span>
                      <span>{value?.toString()}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </>
        )}
        {results() && results().decisions && (
          <>
            <div class="text-md font-semibold text-gray-600">Decisions</div>

            <For each={results().decisions}>
              {(item) =>
                item && (
                  <div class="border-2 border-gray-300 p-2 ">
                    <div class="flex flex-col">
                      <For each={Object.entries(item)}>
                        {([key, value]) => (
                          <div class="flex text-sm text-gray-700">
                            <span class="font-medium capitalize">{key}:</span>
                            <span>{value?.toString()}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                )
              }
            </For>
          </>
        )}
        {/* Messages Section */}
        {results() && results().messages && results().messages.length > 0 && (
          <div class="mt-4">
            <div class="text-md font-semibold text-gray-600">Messages</div>
            <ul class="list-disc ml-6 text-sm text-red-700">
              <For each={results().messages}>{(msg) => <li>{msg}</li>}</For>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
