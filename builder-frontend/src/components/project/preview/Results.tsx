import { Accessor, For, Match, Show, Switch } from "solid-js";

import { PreviewFormData, ScreenerResult } from "./types";
import type { ParameterValues } from "@/types";

import checkIcon from "../../../assets/images/checkIcon.svg";
import questionIcon from "../../../assets/images/questionIcon.svg";
import xIcon from "../../../assets/images/xIcon.svg";

function formatParameters(params: ParameterValues): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

export default function Results({
  inputData,
  results,
  resultsLoading,
}: {
  inputData: Accessor<PreviewFormData>;
  results: Accessor<ScreenerResult>;
  resultsLoading: Accessor<boolean>;
}) {
  return (
    <div class="ml-3">
      <div class="mt-3">
        {inputData() && (
          <>
            <div class="text-md font-semibold text-gray-600">Inputs</div>
            <div class="p-2">
              <table class="bg-gray-200 p-3 rounded-md">
                <For each={Object.entries(inputData())}>
                  {([key, value]) => (
                    <tr class="text-md text-gray-700">
                      <td class="px-3 py-2 font-mono font-bold">{key}:</td>
                      <td class="px-3 py-2 font-mono">
                        {JSON.stringify(value, null, 2) || "--"}
                      </td>
                    </tr>
                  )}
                </For>
              </table>
            </div>
          </>
        )}
        <div class="mt-3">
          <Show when={resultsLoading()}>
            <div class="text-gray-600">Loading results...</div>
          </Show>
          <Show
            when={
              !resultsLoading() &&
              results() &&
              Object.keys(results()).length > 0
            }
          >
            <div class="text-md font-semibold text-gray-600">Benefits</div>
            <div class="p-2">
              <div class="flex flex-col space-y-2">
                <For each={Object.entries(results())}>
                  {([benefitKey, benefit]) => (
                    <div class="border-2 border-gray-200 rounded p-3">
                      <div class="text-md font-medium text-gray-800">
                        {benefit.name}:{" "}
                        <Switch>
                          <Match when={benefit.result === "TRUE"}>
                            <span class="mb-3 bg-green-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                              Eligible
                            </span>
                          </Match>
                          <Match when={benefit.result === "FALSE"}>
                            <span class="mb-3 bg-red-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                              Ineligible
                            </span>
                          </Match>
                          <Match
                            when={benefit.result === "UNABLE_TO_DETERMINE"}
                          >
                            <span class="mb-3 bg-yellow-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                              Need more information
                            </span>
                          </Match>
                        </Switch>
                      </div>
                      <div class="mt-1 ml-2">
                        <div class="ml-2">
                          <For each={Object.entries(benefit.check_results)}>
                            {([checkKey, check]) => (
                              <div class="flex items-center text-md text-gray-700 mb-1">
                                <div class="flex-shrink-0 w-5 mr-2">
                                  <Switch>
                                    <Match when={check.result === "TRUE"}>
                                      <img src={checkIcon} alt="" class="w-4" />
                                    </Match>
                                    <Match when={check.result === "FALSE"}>
                                      <img src={xIcon} alt="" class="w-4" />
                                    </Match>
                                    <Match when={check.result === "UNABLE_TO_DETERMINE"}>
                                      <img src={questionIcon} alt="" class="w-4" />
                                    </Match>
                                  </Switch>
                                </div>
                                <div class="flex flex-col">
                                  <div>
                                    {check.name}
                                    <Show when={check.module || check.version}>
                                      <span class="text-gray-500 ml-1">
                                        ({[check.module, check.version].filter(Boolean).join(" v")})
                                      </span>
                                    </Show>
                                  </div>
                                  <Show when={check.parameters && Object.keys(check.parameters).length > 0}>
                                    <div class="text-gray-500 text-sm">
                                      {formatParameters(check.parameters)}
                                    </div>
                                  </Show>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
