import { Accessor, createSignal, Match, Show, Switch } from "solid-js";
import { useParams } from "@solidjs/router";

import { clsx } from "clsx";
import toast from "solid-toast";

import Header from "../../../Header";
import Loading from "../../../Loading";
import KogitoDmnEditorView from "./KogitoDmnEditorView";
import EligibilityCheckTest from "./checkTesting/EligibilityCheckTest";
import PublishCheck from "./PublishCheck";

import eligibilityCheckDetailResource from "./eligibilityCheckDetailResource";
import ParametersConfiguration from "./ParametersConfiguration";

import ErrorDisplayModal from "@/components/shared/ErrorModal";
import BdtNavbar, { NavbarProps } from "@/components/shared/BdtNavbar";


type CheckDetailScreenMode = "paramConfig" | "dmnDefinition" | "testing" | "publish";

const EligibilityCheckDetail = () => {
  const { checkId } = useParams();

  const [currentDmnModel, setCurrentDmnModel] = createSignal<string>("");
  const [screenMode, setScreenMode] = createSignal<CheckDetailScreenMode>("paramConfig");

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

  const navbarDefs: Accessor<NavbarProps> = () => {
    return {
      tabDefs: [
        { key: "paramConfig", label: "Parameter Configuration", onClick: () => setScreenMode("paramConfig") },
        { key: "dmnDefinition", label: "DMN Definition", onClick: () => setScreenMode("dmnDefinition") },
        { key: "testing", label: "Testing", onClick: () => setScreenMode("testing") },
        { key: "publish", label: "Publish", onClick: () => setScreenMode("publish") },
      ],
      activeTabKey: () => screenMode(),
      titleDef: { label: eligibilityCheck().name },
    };
  };

  return (
    <div class="h-screen flex flex-col">
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>
      <Header />

      <BdtNavbar navProps={navbarDefs} />
      <Show when={ eligibilityCheck().id !== undefined && !initialLoadStatus.loading() }>
        <Switch>
          <Match when={screenMode() === "paramConfig"}>
            <ParametersConfiguration
              eligibilityCheck={eligibilityCheck}
              addParameter={actions.addParameter}
              editParameter={actions.updateParameter}
              removeParameter={actions.removeParameter}
            />
          </Match>
          <Match when={screenMode() === "dmnDefinition"}>
            <>
              <div class="flex space-x-4 px-4 py-3 border-b-2 border-gray-200">
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
          <Match when={screenMode() === "testing"}>
            <EligibilityCheckTest
              eligibilityCheck={eligibilityCheck}
              testEligibility={actions.testEligibility}
            />
          </Match>
          <Match when={screenMode() === "publish"}>
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
