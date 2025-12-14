import { Accessor, createSignal, Match, Switch } from "solid-js";

import {
  CheckConfig,
  EligibilityCheck,
  OptionalBoolean,
  ParameterValues,
} from "@/types";
import SelectedEligibilityCheck from "@/components/Project/ProjectDetails/manageBenefits/configureBenefit/SelectedEligibilityCheck";
import CheckJsonEditor from "./CheckJsonEditor";
import { JSONContent } from "vanilla-jsoneditor";

interface TestRun {
  inputData: Record<string, any>;
  result: OptionalBoolean;
}

const EligibilityCheckTest = ({
  eligibilityCheck,
  testEligibility,
}: {
  eligibilityCheck: Accessor<EligibilityCheck>;
  testEligibility: (
    checkConfg: CheckConfig,
    inputData: Record<string, any>,
  ) => Promise<OptionalBoolean>;
}) => {
  const [checkConfig, setCheckConfig] = createSignal<CheckConfig>({
    checkId: eligibilityCheck().id,
    checkName: eligibilityCheck().name,
    checkVersion: eligibilityCheck().version,
    checkModule: eligibilityCheck().module,
    checkDescription: eligibilityCheck().description,
    parameterDefinitions: eligibilityCheck().parameterDefinitions,
    inputDefinition: eligibilityCheck().inputDefinition,
    evaluationUrl: eligibilityCheck().evaluationUrl,
    parameters: {},
  });
  const [lastTestResult, setLastTestResult] = createSignal<TestRun>(null);

  const [initialJsonContent, setInitialJsonContent] = createSignal<{
    json: Record<string, any>;
  }>({ json: { example: "data" } });
  const [currentJsonContent, setCurrentJsonContent] = createSignal<{
    json: Record<string, any>;
  }>({ json: { example: "data" } });

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">
        {eligibilityCheck().name}
      </div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div
        class="btn-default btn-blue mb-3 mr-1"
        onClick={async () => {
          const result = await testEligibility(
            checkConfig(),
            currentJsonContent().json,
          );
          if (!result) {
            return;
          }
          setLastTestResult({
            inputData: currentJsonContent().json,
            result: result,
          });
        }}
      >
        Run Test
      </div>
      {lastTestResult() !== null && (
        <>
          <div class="mb-3">
            <span class="font-bold">Latest Test Data:</span>{" "}
            <span class="p-2 font-mono bg-gray-200 rounded-md">
              {JSON.stringify(lastTestResult().inputData)}
            </span>
          </div>
          <div class="mb-4">
            <span class="font-bold">Latest Test Result: </span>
            <Switch>
              <Match when={lastTestResult().result === "TRUE"}>
                <span class="mb-3 bg-green-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                  Eligible
                </span>
              </Match>
              <Match when={lastTestResult().result === "FALSE"}>
                <span class="mb-3 bg-red-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                  Ineligible
                </span>
              </Match>
              <Match when={lastTestResult().result === "UNABLE_TO_DETERMINE"}>
                <span class="mb-3 bg-yellow-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                  Need more information
                </span>
              </Match>
            </Switch>
          </div>
        </>
      )}
      <div class="h-full flex flex-row gap-4">
        <div class="flex-2">
          <CheckJsonEditor
            jsonContent={initialJsonContent}
            onValidJsonChange={(content: JSONContent) => {
              setCurrentJsonContent(content);
            }}
          />
        </div>

        <div class="flex-1">
          <SelectedEligibilityCheck
            checkId={() => checkConfig().checkId}
            checkConfig={checkConfig}
            updateCheckConfigParams={(newCheckData: ParameterValues) => {
              setCheckConfig({ ...checkConfig(), parameters: newCheckData });
            }}
            onRemove={null}
          />
        </div>
      </div>
    </div>
  );
};
export default EligibilityCheckTest;
