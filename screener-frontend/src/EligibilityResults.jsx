import { Switch, Match, For } from "solid-js";
import checkIcon from "./assets/images/checkIcon.svg";
import questionIcon from "./assets/images/questionIcon.svg";
import xIcon from "./assets/images/xIcon.svg";

export default function EligibilityResults({ results }) {
  console.log(results());
  return (
    <div class="my-2 mx-12">
      <h2 class="text-gray-600 font-bold">Eligibility Results</h2>
      <For each={results() ?? []}>
        {(benefit) => (
          <div class="border-gray-500 border p-5 my-4 rounded-lg shadow-md">
            <Switch>
              <Match when={benefit.result === true}>
                <p class="mb-3 bg-green-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                  Eligible
                </p>
              </Match>
              <Match when={benefit.result === null}>
                <p class="mb-3 bg-yellow-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                  Need more information
                </p>
              </Match>
              <Match when={benefit.result === false}>
                <p class="mb-3 bg-red-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800 text-sm">
                  Ineligible
                </p>
              </Match>
            </Switch>
            <h3 class="font-bold mb-2 text-lg">{benefit.displayName}</h3>
            <div class="my-2">
              <For each={benefit.checks ?? []}>
                {(check) => (
                  <p class="mb-1">
                    <Switch>
                      <Match when={check.result === true}>
                        <img src={checkIcon} alt="" class="inline w-4 mr-2" />
                      </Match>
                      <Match when={check.result === null}>
                        <img
                          src={questionIcon}
                          alt=""
                          class="inline w-4 mr-2"
                        />
                      </Match>
                      <Match when={check.result === false}>
                        <img src={xIcon} alt="" class="inline w-4 mr-2" />
                      </Match>
                    </Switch>
                    <span className="text-xs">{check.displayName}</span>
                  </p>
                )}
              </For>
            </div>
            {benefit.info && (
              <>
                <h4 class="font-bold mb-1 text-sm">Overview</h4>
                <p class="mb-4 text-xs">{benefit.info}</p>
              </>
            )}
            {benefit.appLink && (
              <a href={benefit.appLink} target="_blank">
                <p class="bg-green-600 px-5 py-2 rounded-lg font-bold text-white w-fit text-sm">
                  Apply Now
                </p>
              </a>
            )}
          </div>
        )}
      </For>
    </div>
  );
}
