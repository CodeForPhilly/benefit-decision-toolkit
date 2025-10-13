import { Accessor, For, Match, Show, Switch } from "solid-js";

import { ScreenerResult } from "./types";

import checkIcon from "../../../assets/images/checkIcon.svg";
import questionIcon from "../../../assets/images/questionIcon.svg";
import xIcon from "../../../assets/images/xIcon.svg";


export default function Results({ results, resultsLoading }: { results: Accessor<ScreenerResult>, resultsLoading: Accessor<boolean> }) {
  return (
    <div class="my-4 mx-8 p-4 border border-gray-300 rounded shadow-sm">
      <Show when={resultsLoading()}>
        <div class="text-gray-600">Loading results...</div>
      </Show>
      <Show when={!resultsLoading()}>
        <div class="text-lg text-gray-800 text-md font-bold">Results</div>
        <div class="my-2">
          {/* {results() && results().inputs && (
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
          )} */}
          {results() && Object.keys(results()).length > 0 ? (
            <>
              <div class="text-md font-semibold text-gray-600">Benefits</div>
              <div class="p-2 ">
                <div class="flex flex-col space-y-2">
                  <For each={Object.entries(results())}>
                    {([benefitKey, benefit]) => (
                      <div class="border border-gray-200 rounded p-2">
                        <div class="text-sm font-medium text-gray-800">
                          {benefit.name} :{" "}
                          <Switch>
                            <Match when={benefit.result === "TRUE"}>
                              <span class="mb-3 bg-green-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                                Eligible
                              </span>
                            </Match>
                            <Match when={benefit.result === "FALSE"}>
                              <span class="mb-3 bg-red-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                                Ineligible
                              </span>
                            </Match>
                            <Match when={benefit.result === "UNABLE_TO_DETERMINE"}>
                              <span class="mb-3 bg-yellow-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                                Need more information
                              </span>
                            </Match>
                          </Switch>
                        </div>
                        <div class="mt-1 ml-2">
                          <div class="text-sm font-semibold text-gray-700">
                            Checks:
                          </div>
                          <div class="ml-4">
                            <For each={Object.entries(benefit.check_results)}>
                              {([checkKey, check]) => (
                                <div class="text-sm text-gray-700">
                                  {check.name} :{" "}
                                  <Switch>
                                    <Match when={check.result === "TRUE"}>
                                      <img src={checkIcon} alt="" class="inline w-4 mr-2" />
                                    </Match>
                                    <Match when={check.result === "UNABLE_TO_DETERMINE"}>
                                      <img
                                        src={questionIcon}
                                        alt=""
                                        class="inline w-4 mr-2"
                                      />
                                    </Match>
                                    <Match when={check.result === "FALSE"}>
                                      <img src={xIcon} alt="" class="inline w-4 mr-2" />
                                    </Match>
                                  </Switch>
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
            </>
          ) : (
            <div class="text-sm text-gray-600">No results to display</div>
          )}
          {/* Messages Section */}
          {/* {results() && results().messages && results().messages.length > 0 && (
            <div class="mt-4">
              <div class="text-md font-semibold text-gray-600">Messages</div>
              <ul class="list-disc ml-6 text-sm text-red-700">
                <For each={results().messages}>{(msg) => <li>{msg}</li>}</For>
              </ul>
            </div>
          )} */}
        </div>
      </Show>
    </div>
  );
}
