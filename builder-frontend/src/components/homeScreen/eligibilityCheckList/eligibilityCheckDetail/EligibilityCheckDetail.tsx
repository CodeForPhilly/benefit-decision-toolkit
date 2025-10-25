import { Accessor, createSignal, For, Match, Show, Switch } from "solid-js";
import { useParams } from "@solidjs/router";

import Header from "../../../Header";
import Loading from "../../../Loading";
import ParameterModal from "./modals/ParameterModal";
import KogitoDmnEditorView from "./KogitoDmnEditorView";

import eligibilityCheckDetailResource from "./eligibilityCheckDetailResource";

import type { EligibilityCheck, ParameterDefinition } from "@/types";


const EligibilityCheckDetail = () => {
  const { checkId } = useParams();

  const [screenMode, setScreenMode] = createSignal<"inputs_params" | "dmn">("inputs_params");
  const [tmpDmnModel, setTmpDmnModel] = createSignal<string>("");

  const { eligibilityCheck, actions, actionInProgress, initialLoadStatus } = (
    eligibilityCheckDetailResource(() => checkId)
  );

  return (
    <div class="h-screen flex flex-col">
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
        <Show when={screenMode() === "dmn"}>
          <div
            class="btn-default btn-gray"
            onClick={() => actions.saveDmnModel(tmpDmnModel())}
          >
            Save DMN
          </div>
        </Show>
      </div>

      <Show when={eligibilityCheck().id !== undefined && !initialLoadStatus.loading()}>
        <Switch>
          <Match when={screenMode() === "inputs_params"}>
            <ParametersScreen eligibilityCheck={eligibilityCheck} addParameter={actions.addParameter}/>
          </Match>
          <Match when={screenMode() === "dmn"}>
            <KogitoDmnEditorView
              dmnModel={() => eligibilityCheck().dmnModel}
              setTmpDmnModel={setTmpDmnModel}
            />
          </Match>
        </Switch>
      </Show>
    </div>
  );
};

const ParametersScreen = (
  {eligibilityCheck, addParameter}:
  {eligibilityCheck: Accessor<EligibilityCheck>; addParameter: (parameter: ParameterDefinition) => Promise<void>}
) => {
  const [addingParameter, setAddingParameter] = createSignal<boolean>(false);

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">{eligibilityCheck().name}</div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div class="p-2">
        <h2 class="text-xl font-semibold mb-2">Parameters</h2>
        <div
          class="btn-default btn-blue mb-3 mr-1"
          onClick={() => {setAddingParameter(true)}}
        >
          Create New Parameter
        </div>
        <Show when={eligibilityCheck().parameters.length > 0} fallback={<p>No parameters defined.</p>}>
          <div class="flex flex-wrap gap-4">
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
          </div>
        </Show>
      </div>
      {
        addingParameter() &&
        <ParameterModal
          actionTitle="Add Parameter"
          closeModal={() => setAddingParameter(false)}
          modalAction={addParameter}
        />
      }
    </div>
  );
}

export default EligibilityCheckDetail;
