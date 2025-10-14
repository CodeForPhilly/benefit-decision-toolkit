import { Accessor, createSignal, For, Match, Show, Switch } from "solid-js";
import { useParams } from "@solidjs/router";

import Header from "../Header";
import Loading from "../Loading";
import eligibilityCheckResource from "./eligibilityCheckResource";

import type { EligibilityCheck } from "../project/manageBenefits/types";


const EligibilityCheckDetail = () => {
  const { checkId } = useParams();

  const [screenMode, setScreenMode] = createSignal<"inputs_params" | "dmn">("inputs_params");

  const { eligibilityCheck, actions, actionInProgress, initialLoadStatus } = eligibilityCheckResource(() => checkId);

  return (
    <div>
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading/>
      </Show>
      <Header/>
      <div class="flex space-x-4 p-4 border-b-2 border-gray-200">
        <div
          class={`btn-default ${screenMode() === "inputs_params" ? "btn-blue" : "btn-gray"}`}
          onClick={() => setScreenMode("inputs_params")}
        >
          Inputs/Parameters
        </div>
        <div
          class={`btn-default ${screenMode() === "dmn" ? "btn-blue" : "btn-gray"}`}
          onClick={() => setScreenMode("dmn")}
        >
          DMN Definition
        </div>
      </div>

      <Show when={eligibilityCheck().id !== undefined && !initialLoadStatus.loading()}>
        <Switch>
          <Match when={screenMode() === "inputs_params"}>
            <InputsParams eligibilityCheck={eligibilityCheck}/>
          </Match>
          <Match when={screenMode() === "dmn"}>
            <div class="p-2">
              <h2 class="text-xl font-semibold mb-2">DMN</h2>
            </div>
          </Match>
        </Switch>
      </Show>
    </div>
  );
};

const InputsParams = ({eligibilityCheck}: {eligibilityCheck: Accessor<EligibilityCheck>}) => {
  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">{eligibilityCheck().name}</div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div class="p-2">
        <h2 class="text-xl font-semibold mb-2">Inputs</h2>
        <Show when={eligibilityCheck().inputs.length > 0} fallback={<p>No inputs defined.</p>}>
          <ul class="list-disc list-inside">
            <For each={eligibilityCheck().inputs}>
              {(input) => (
                <div
                  class="border-2 border-gray-200 rounded p-4 w-80 hover:shadow-lg hover:bg-gray-200 cursor-pointer"
                  onClick={() => {}}
                >
                  <div class="text-lg font-bold text-gray-800 mb-2">{input.key}</div>
                  <div><span class="font-bold">Type:</span> {input.type}</div>
                  <div><span class="font-bold">Prompt:</span> {input.prompt}</div>
                </div>
              )}
            </For>
          </ul>
        </Show>

        <h2 class="text-xl font-semibold mb-2">Parameters</h2>
        <Show when={eligibilityCheck().parameters.length > 0} fallback={<p>No parameters defined.</p>}>
          <ul class="list-disc list-inside">
            <For each={eligibilityCheck().parameters}>
              {(param) => (
                <div
                  class="border-2 border-gray-200 rounded p-4 w-80 hover:shadow-lg hover:bg-gray-200 cursor-pointer"
                  onClick={() => {}}
                >
                  <div class="text-lg font-bold text-gray-800 mb-2">{param.key}</div>
                  <div><span class="font-bold">Type:</span> {param.type}</div>
                  <div><span class="font-bold">Label:</span> {param.label}</div>
                  <div><span class="font-bold">Required:</span> {param.required.toString()}</div>                    
                </div>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}

export default EligibilityCheckDetail;
