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
                <div>
                  {check.name}
                  <Show when={check.module || check.version}>
                    <span class="text-gray-500 ml-1">
                      ({[check.module, check.version].filter(Boolean).join(" v")})
                    </span>
                  </Show>
                </div>
                <Show when={check.parameters && Object.keys(check.parameters).length > 0}>
                  <div class="text-gray-500">
                    {formatParameters(check.parameters)}
                  </div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
      {/* {benefit.info && (
        <div class="[&:has(+div)]:mb-4">
          <h4 class="font-bold mb-1 text-sm">Overview</h4>
          <p class="text-xs">{benefit.info}</p>
        </div>
      )}
      {benefit.appLink && (
        <div class="[&:has(+div)]:mb-4">
          <a href={benefit.appLink} target="_blank">
            <p
              class="
                px-5 py-2 rounded-lg select-none
                rounded-lg font-bold text-white w-fit text-sm
                bg-green-600 hover:bg-green-700 transition-colors"
            >
              Apply Now
            </p>
          </a>
        </div>
      )} */}
    </div>
  );
}
