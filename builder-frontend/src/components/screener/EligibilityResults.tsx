import { Switch, Match, For, Accessor, Show } from "solid-js";

import type { ScreenerResult, BenefitResult } from "@/types";

import checkIcon from "@/assets/images/checkIcon.svg";
import questionIcon from "@/assets/images/questionIcon.svg";
import xIcon from "@/assets/images/xIcon.svg";

function formatParameters(params: Record<string, unknown>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

export default function EligibilityResults(
  { screenerResult }: { screenerResult: Accessor<ScreenerResult> }
) {
  console.log(screenerResult());
  return (
    <div class="my-2 mx-12">
      <h2 class="text-gray-600 font-bold">Eligibility Results</h2>
      <For each={Object.entries(screenerResult())}>
        {([benefitKey, benefitResult]) => <BenefitResult benefitResult={benefitResult}/>}
      </For>
    </div>
  );
}

function BenefitResult({ benefitResult }: { benefitResult: BenefitResult }) {
  return (
    <div class="border-gray-500 border p-5 my-4 rounded-lg shadow-md">
      <Switch>
        <Match when={benefitResult.result === "TRUE"}>
          <p class="mb-3 bg-green-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
            Eligible
          </p>
        </Match>
        <Match when={benefitResult.result === "UNABLE_TO_DETERMINE"}>
          <p class="mb-3 bg-yellow-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
            Need more information
          </p>
        </Match>
        <Match when={benefitResult.result === "FALSE"}>
          <p class="mb-3 bg-red-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
            Ineligible
          </p>
        </Match>
      </Switch>
      <div class="[&:has(+div)]:mb-2">
        <h3 class="font-bold text-lg">{benefitResult.name}</h3>
        <For each={Object.entries(benefitResult.check_results)}>
          {([checkKey, check]) => (
            <div class="flex items-center mb-1">
              <div class="flex-shrink-0 w-5 mr-2">
                <Switch>
                  <Match when={check.result === "TRUE"}>
                    <img src={checkIcon} alt="" class="w-4" />
                  </Match>
                  <Match when={check.result === "UNABLE_TO_DETERMINE"}>
                    <img src={questionIcon} alt="" class="w-4" />
                  </Match>
                  <Match when={check.result === "FALSE"}>
                    <img src={xIcon} alt="" class="w-4" />
                  </Match>
                </Switch>
              </div>
              <div class="flex flex-col text-xs">
                <Show when={check.aliasName} fallback={<div>{check.name}</div>}>
                  <div>{check.aliasName}</div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
