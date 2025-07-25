import { createSignal, Show, Index } from "solid-js";
import testData from "./testData.js";

export default function EligibilityResults() {
  const [testResults, setTestResults] = createSignal({});
  setTestResults(testData);
  return (
    <div class="my-2">
      <h2 class="text-gray-600 text-sm font-bold">Eligibility Results</h2>
      <Index each={Object.keys(testResults()["benefits"])}>
        {(benefitName, index) => (
          <>
            <h3 class="font-bold mt-4">
              <span>{benefitName()}</span>
              <span>
                {" "}
                -{" "}
                <Show
                  when={
                    testResults()["benefits"][benefitName()]["eligibility"][
                      "result"
                    ] !== null
                  }
                  fallback={"null"}
                >
                  {testResults()["benefits"][benefitName()]["eligibility"][
                    "result"
                  ].toString()}
                </Show>
              </span>
            </h3>
            <Index
              each={Object.keys(
                testResults()["benefits"][benefitName()]["eligibility"][
                  "checks"
                ]
              )}
            >
              {(checkName, index) => (
                <>
                  <p>
                    {checkName()} -{" "}
                    <Show
                      when={
                        testResults()["benefits"][benefitName()]["eligibility"][
                          "checks"
                        ][checkName()] !== null
                      }
                      fallback={"null"}
                    >
                      {testResults()["benefits"][benefitName()]["eligibility"][
                        "checks"
                      ][checkName()].toString()}
                    </Show>
                  </p>
                </>
              )}
            </Index>
          </>
        )}
      </Index>
    </div>
  );
}
