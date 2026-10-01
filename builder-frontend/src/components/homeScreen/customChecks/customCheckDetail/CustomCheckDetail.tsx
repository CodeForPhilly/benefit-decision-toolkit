import EditorNavigation from "@/components/shared/EditorNavigation";
import { Accessor, createSignal, Match, Show, Switch } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";

import { clsx } from "clsx";
import toast from "solid-toast";

import Loading from "../../../Loading";
import KogitoDmnEditorView from "./KogitoDmnEditorView";
import EligibilityCheckTest from "./checkTesting/EligibilityCheckTest";
import PublishCheck from "./PublishCheck";

import { isDmnModelChanged } from "./dmnEditor";
import customCheckDetailResource from "./customCheckDetailResource";
import ParametersConfiguration from "./ParametersConfiguration";

import ErrorDisplayModal from "@/components/shared/ErrorModal";
import { NavbarProps } from "@/components/shared/BdtNavbar";

type CheckDetailScreenMode =
  | "paramConfig"
  | "dmnDefinition"
  | "testing"
  | "publish";

const CustomCheckDetail = () => {
  const { checkId } = useParams();
  const [searchParams] = useSearchParams();

  const [currentDmnModel, setCurrentDmnModel] = createSignal<string>("");
  const [screenMode, setScreenMode] = createSignal<CheckDetailScreenMode>(
    searchParams.tab === "publish" ? "publish" : "paramConfig",
  );

  const [validationErrors, setValidationErrors] = createSignal<string[]>([]);
  const [showingErrorModal, setShowingErrorModal] =
    createSignal<boolean>(false);

  const { eligibilityCheck, actions, actionInProgress, initialLoadStatus } =
    customCheckDetailResource(() => checkId);

  const hasDmnModelChanged = (): boolean => {
    return isDmnModelChanged(eligibilityCheck().dmnModel, currentDmnModel());
  };

  // The model is empty until the DMN editor has opened, and an unopened
  // editor has no edits to lose.
  const hasUnsavedDmnChanges = (): boolean =>
    currentDmnModel() !== "" && hasDmnModelChanged();

  const validateDmnModel = async (dmnString: string) => {
    const errors: string[] = await actions.validateDmnModel(dmnString);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setShowingErrorModal(true);
    } else {
      toast.success("No validation errors found in DMN model.");
    }
  };

  // The store keeps the loaded check during refetches, so show its name
  // whenever there is one and fall back only while nothing has loaded yet.
  const checkLabel = () => {
    if (eligibilityCheck().id !== undefined) return eligibilityCheck().name;
    return initialLoadStatus.error() ? "Check unavailable" : "Loading check…";
  };

  const navbarDefs: Accessor<NavbarProps> = () => {
    return {
      tabDefs: [
        {
          key: "paramConfig",
          label: "Parameter Configuration",
          onClick: () => setScreenMode("paramConfig"),
        },
        {
          key: "dmnDefinition",
          label: "DMN Definition",
          onClick: () => setScreenMode("dmnDefinition"),
        },
        {
          key: "testing",
          label: "Testing",
          onClick: () => setScreenMode("testing"),
        },
        {
          key: "publish",
          label: "Publish",
          onClick: () => setScreenMode("publish"),
        },
      ],
      activeTabKey: () => screenMode(),
    };
  };

  return (
    <div class="h-screen flex flex-col">
      <Show when={initialLoadStatus.loading() || actionInProgress()}>
        <Loading />
      </Show>

      <EditorNavigation
        navProps={navbarDefs}
        items={[
          { label: "Custom Checks", href: "/custom-checks" },
          { label: checkLabel() },
        ]}
      />
      <Show
        when={
          eligibilityCheck().id !== undefined && !initialLoadStatus.loading()
        }
      >
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
                  class={clsx(
                    "btn-default",
                    { "btn-blue": !hasDmnModelChanged() },
                    { "btn-yellow": hasDmnModelChanged() },
                  )}
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
              hasUnsavedDmnChanges={hasUnsavedDmnChanges}
              saveDmnChanges={() => actions.saveDmnModel(currentDmnModel())}
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

export default CustomCheckDetail;
