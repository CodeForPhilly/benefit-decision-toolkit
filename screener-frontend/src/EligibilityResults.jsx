import { createSignal, Show, Index, Switch, Match } from "solid-js";
import testData from "./testData.js";
import checkIcon from "./assets/images/checkIcon.svg";
import questionIcon from "./assets/images/questionIcon.svg";
import xIcon from "./assets/images/xIcon.svg";

export default function EligibilityResults() {
  const [testResults, setTestResults] = createSignal({});
  setTestResults(testData);
  return (
    <div class="my-2">
      <h2 class="text-gray-600 font-bold">Eligibility Results</h2>
      <Index each={Object.keys(testResults()["benefits"])}>
        {(benefitName, index) => (
          <div class="border-gray-500 border p-5 my-4 rounded-lg">
            <Switch>
              <Match
                when={
                  testResults()["benefits"][benefitName()]["eligibility"][
                    "result"
                  ] === true
                }
              >
                <p class="mb-3 bg-green-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800">
                  Eligible
                </p>
              </Match>
              <Match
                when={
                  testResults()["benefits"][benefitName()]["eligibility"][
                    "result"
                  ] === null
                }
              >
                <p class="mb-3 bg-yellow-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800">
                  Need more information
                </p>
              </Match>
              <Match
                when={
                  testResults()["benefits"][benefitName()]["eligibility"][
                    "result"
                  ] === false
                }
              >
                <p class="mb-3 bg-red-200 w-fit py-1 px-6 rounded-full font-bold text-gray-800">
                  Ineligible
                </p>
              </Match>
            </Switch>
            <h3 class="font-bold mb-2 text-2xl">
              {testResults()["benefits"][benefitName()]["name"]}
            </h3>
            <div class="my-4">
              <Index
                each={Object.keys(
                  testResults()["benefits"][benefitName()]["eligibility"][
                    "checks"
                  ]
                )}
              >
                {(checkName, index) => (
                  <p class="mb-2">
                    <Switch>
                      <Match
                        when={
                          testResults()["benefits"][benefitName()][
                            "eligibility"
                          ]["checks"][checkName()]["result"] === true
                        }
                      >
                        <img src={checkIcon} alt="" class="inline w-5 mr-2" />
                      </Match>
                      <Match
                        when={
                          testResults()["benefits"][benefitName()][
                            "eligibility"
                          ]["checks"][checkName()]["result"] === null
                        }
                      >
                        <img
                          src={questionIcon}
                          alt=""
                          class="inline w-5 mr-2"
                        />
                      </Match>
                      <Match
                        when={
                          testResults()["benefits"][benefitName()][
                            "eligibility"
                          ]["checks"][checkName()]["result"] === false
                        }
                      >
                        <img src={xIcon} alt="" class="inline w-5 mr-2" />
                      </Match>
                    </Switch>
                    <span>
                      {
                        testResults()["benefits"][benefitName()]["eligibility"][
                          "checks"
                        ][checkName()]["name"]
                      }
                    </span>
                  </p>
                )}
              </Index>
            </div>
            <h4 class="font-bold mb-1">Overview</h4>
            <p class="mb-4">
              {testResults()["benefits"][benefitName()]["info"]}
            </p>
            <a
              href={testResults()["benefits"][benefitName()]["appLink"]}
              target="_blank"
            >
              <p class="bg-green-600 px-6 py-3 rounded-lg font-bold text-white w-fit">
                Apply Now
              </p>
            </a>
          </div>
        )}
      </Index>
    </div>
  );
}
