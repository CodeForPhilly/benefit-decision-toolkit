import { Accessor, createSignal, For, Match, Show, Switch } from "solid-js";
import { useParams } from "@solidjs/router";

import Header from "../../../Header";
import Loading from "../../../Loading";
import ParameterModal from "./modals/ParameterModal";
import KogitoDmnEditorView from "./KogitoDmnEditorView";

import eligibilityCheckDetailResource from "./eligibilityCheckDetailResource";

import type { EligibilityCheck, ParameterDefinition } from "@/types";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import EligibilityCheckTest from "./checkTesting/EligibilityCheckTest";
import PublishCheck from "./PublishCheck";


type CheckDetailScreenMode = "Parameter Configuration" |  "DMN Definition" | "Testing" | "Publish";

const EligibilityCheckDetail = () => {
  const { checkId } = useParams();

  const [tmpDmnModel, setTmpDmnModel] = createSignal<string>("");
  const [screenMode, setScreenMode] = createSignal<CheckDetailScreenMode>("Parameter Configuration");

  const { eligibilityCheck, actions, actionInProgress, initialLoadStatus } =
    eligibilityCheckDetailResource(() => checkId);

  return (
    <div class="h-screen flex flex-col">
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>
      <Header />
      <div class="flex border-b border-gray-200">
        {["Parameter Configuration", "DMN Definition", "Testing", "Publish"].map((tab: CheckDetailScreenMode) => (
          <button
            class={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
              screenMode() === tab
                ? "border-b border-gray-700 text-gray-700 hover:bg-gray-200"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setScreenMode(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Show when={ eligibilityCheck().id !== undefined && !initialLoadStatus.loading() }>
        <Switch>
          <Match when={screenMode() === "Parameter Configuration"}>
            <ParametersScreen
              eligibilityCheck={eligibilityCheck}
              addParameter={actions.addParameter}
              editParameter={actions.updateParameter}
              removeParameter={actions.removeParameter}
            />
          </Match>
          <Match when={screenMode() === "DMN Definition"}>
            <>
              <div class="flex space-x-4 p-4 border-b-2 border-gray-200">
                <div
                  class="btn-default btn-gray"
                  onClick={() => actions.saveDmnModel(tmpDmnModel())}
                >
                  Save DMN
                </div>
              </div>
              <KogitoDmnEditorView
                dmnModel={() => eligibilityCheck().dmnModel}
                setTmpDmnModel={setTmpDmnModel}
              />
            </>
          </Match>
          <Match when={screenMode() === "Testing"}>
            <EligibilityCheckTest
              eligibilityCheck={eligibilityCheck}
              testEligibility={actions.testEligibility}
            />
          </Match>
          <Match when={screenMode() === "Publish"}>
            <PublishCheck
              eligibilityCheck={eligibilityCheck}
              publishCheck={actions.publishCheck}
            />
          </Match>
        </Switch>
      </Show>
    </div>
  );
};

const ParametersScreen = ({
  eligibilityCheck,
  addParameter,
  editParameter,
  removeParameter,
}: {
  eligibilityCheck: Accessor<EligibilityCheck>;
  addParameter: (parameter: ParameterDefinition) => Promise<void>;
  editParameter: (
    parameterIndex: number,
    parameter: ParameterDefinition
  ) => Promise<void>;
  removeParameter: (parameterIndex: number) => Promise<void>;
}) => {
  const [addingParameter, setAddingParameter] = createSignal<boolean>(false);
  const [parameterIndexToEdit, setParameterIndexToEdit] = createSignal<
    null | number
  >(null);
  const [parameterIndexToRemove, setParameterIndexToRemove] = createSignal<
    null | number
  >(null);

  const handleProjectMenuClicked = (e, parameterIndex: number) => {
    e.stopPropagation();
    setParameterIndexToRemove(parameterIndex);
  };

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">
        {eligibilityCheck().name}
      </div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div class="p-2">
        <h2 class="text-xl font-semibold mb-2">Parameters</h2>
        <div
          class="btn-default btn-blue mb-3 mr-1"
          onClick={() => {
            setAddingParameter(true);
          }}
        >
          Create New Parameter
        </div>
        <Show
          when={eligibilityCheck().parameters.length > 0}
          fallback={<p>No parameters defined.</p>}
        >
          <div class="flex flex-wrap gap-4">
            <For each={eligibilityCheck().parameters}>
              {(param, parameterIndex) => (
                <div
                  class="relative border-2 border-gray-200 rounded p-4 w-80 hover:shadow-lg hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    console.log("here");
                    setParameterIndexToEdit(parameterIndex());
                  }}
                >
                  <div class="text-lg font-bold text-gray-800 mb-2">
                    {param.key}
                  </div>
                  <div>
                    <span class="font-bold">Type:</span> {param.type}
                  </div>
                  <div>
                    <span class="font-bold">Label:</span> {param.label}
                  </div>
                  <div>
                    <span class="font-bold">Required:</span>{" "}
                    {param.required.toString()}
                  </div>
                  <div
                    class="absolute px-2 top-2 right-2 hover:bg-gray-300 rounded-xl font-bold"
                    onClick={(e) =>
                      handleProjectMenuClicked(e, parameterIndex())
                    }
                  >
                    X
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      {addingParameter() && (
        <ParameterModal
          actionTitle="Add Parameter"
          closeModal={() => setAddingParameter(false)}
          modalAction={addParameter}
        />
      )}
      {parameterIndexToEdit() !== null && (
        <ParameterModal
          actionTitle="Edit Parameter"
          closeModal={() => setParameterIndexToEdit(null)}
          modalAction={async (parameter) => {
            editParameter(parameterIndexToEdit(), parameter);
          }}
          initialData={{
            key: eligibilityCheck().parameters[parameterIndexToEdit()].key,
            type: eligibilityCheck().parameters[parameterIndexToEdit()].type,
            label: eligibilityCheck().parameters[parameterIndexToEdit()].label,
            required:
              eligibilityCheck().parameters[parameterIndexToEdit()].required,
          }}
        />
      )}
      {parameterIndexToRemove() !== null && (
        <ConfirmationModal
          confirmationTitle="Remove Parameter"
          confirmationText="Are you sure you want to remove this parameter? This action cannot be undone."
          callback={() => removeParameter(parameterIndexToRemove())}
          closeModal={() => setParameterIndexToRemove(null)}
        />
      )}
    </div>
  );
};

export default EligibilityCheckDetail;
