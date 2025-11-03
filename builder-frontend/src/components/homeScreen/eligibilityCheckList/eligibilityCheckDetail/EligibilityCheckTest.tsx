import { Accessor, createSignal, Match, Switch } from "solid-js";

import { CheckConfig, EligibilityCheck, OptionalBoolean, ParameterValues } from "@/types";
import SelectedEligibilityCheck from "@/components/project/manageBenefits/configureBenefit/SelectedEligibilityCheck";

const EligibilityCheckTest = (
  { eligibilityCheck, testEligibility }:
  {
    eligibilityCheck: Accessor<EligibilityCheck>,
    testEligibility: (checkConfg: CheckConfig, inputData: Record<string, any>) => Promise<OptionalBoolean>;
  }
) => {
  const [checkConfig, setCheckConfig] = createSignal<CheckConfig>({ checkId: eligibilityCheck().id, parameters: {} });
  const [lastTestResult, setLastTestResult] = createSignal<OptionalBoolean>(null);

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">{eligibilityCheck().name}</div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div
        class="btn-default btn-blue mb-3 mr-1"
        onClick={async () => {
          const result = await testEligibility(checkConfig(), JSON.parse((document.getElementById("inputData") as HTMLTextAreaElement).value))
          setLastTestResult(result);
        }}
      >
        Test Check
      </div>
      {lastTestResult() !== null && (
        <div class="mb-4">
          <span class="font-bold">Last Test Result: </span>
          <Switch>
            <Match when={lastTestResult() === "TRUE"}>
              <span class="mb-3 bg-green-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                Eligible
              </span>
            </Match>
            <Match when={lastTestResult() === "FALSE"}>
              <span class="mb-3 bg-red-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                Ineligible
              </span>
            </Match>
            <Match when={lastTestResult() === "UNABLE_TO_DETERMINE"}>
              <span class="mb-3 bg-yellow-200 w-fit py-1 px-4 rounded-full font-bold text-gray-800">
                Need more information
              </span>
            </Match>
          </Switch>
        </div>
      )}
      <div class="h-full flex flex-row gap-4">
        <div>
          <textarea
            id="inputData"
            class="w-96 h-96 p-2 border border-gray-300 rounded"
            placeholder='Enter input data as JSON, e.g. {"age": 30, "income": 50000}'
          ></textarea>
        </div>

        <SelectedEligibilityCheck
          check={eligibilityCheck()}
          checkConfig={checkConfig}
          updateCheckConfigParams={(newCheckData: ParameterValues) => {
            console.log("newCheckData", newCheckData);
            setCheckConfig({ ...checkConfig(), parameters: newCheckData });
          }}
        />
      </div>
    </div>
  )
};
export default EligibilityCheckTest;