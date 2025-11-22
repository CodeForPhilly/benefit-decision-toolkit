import { createSignal, Match, Show, Switch } from "solid-js";
import { useParams } from "@solidjs/router";

import { clsx } from "clsx";
import toast from "solid-toast";

import Header from "../../../Header";
import Loading from "../../../Loading";
import KogitoDmnEditorView from "./KogitoDmnEditorView";
import EligibilityCheckTest from "./checkTesting/EligibilityCheckTest";
import PublishCheck from "./PublishCheck";

import eligibilityCheckDetailResource from "./eligibilityCheckDetailResource";

import ErrorDisplayModal from "@/components/shared/ErrorModal";
import ParametersConfiguration from "./ParametersConfiguration";


type CheckDetailScreenMode = "Parameter Configuration" | "DMN Definition" | "Testing" | "Publish";

const EligibilityCheckDetail = () => {
  const { checkId } = useParams();

  const [currentDmnModel, setCurrentDmnModel] = createSignal<string>("");
  const [screenMode, setScreenMode] = createSignal<CheckDetailScreenMode>("Parameter Configuration");

  const [validationErrors, setValidationErrors] = createSignal<string[]>([]);
  const [showingErrorModal, setShowingErrorModal] = createSignal<boolean>(false);

  const { eligibilityCheck, actions, actionInProgress, initialLoadStatus } =
    eligibilityCheckDetailResource(() => checkId);

  const hasDmnModelChanged = (): boolean => {
    return eligibilityCheck().dmnModel !== currentDmnModel();
  };

  const validateDmnModel = async (dmnString: string) => {
    const errors: string[] = await actions.validateDmnModel(dmnString);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setShowingErrorModal(true);
    } else {
      toast.success("No validation errors found in DMN model.");
    }
  }

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
            <ParametersConfiguration
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
                  class="btn-default btn-blue"
                  onClick={() => validateDmnModel(currentDmnModel())}
                >
                  Validate Current DMN
                </div>
                <div
                  class={clsx("btn-default", { "btn-blue": !hasDmnModelChanged() }, { "btn-yellow": hasDmnModelChanged() })}
                  onClick={() => actions.saveDmnModel(currentDmnModel())}
                >
                  Save Changes
                </div>
              </div>
              <KogitoDmnEditorView
                dmnModelToLoad={() => eligibilityCheck().dmnModel}
                onDmnModelChange={setCurrentDmnModel}
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
      <Show when={showingErrorModal()}>
        <ErrorDisplayModal
          title={"DMN Validation Errors"}
          errors={validationErrors()}
          closeModal={() => setShowingErrorModal(false)}
        />
      </Show>
    </div>
  );
};

export default EligibilityCheckDetail;
