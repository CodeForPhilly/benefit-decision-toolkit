import { Accessor, Show } from "solid-js";

import Results from "./Results";

import { evaluateScreener } from "../../../api/screener";

import Tooltip from "@/components/shared/Tooltip";
import HiddenQuestionsNotice from "@/components/shared/HiddenQuestionsNotice";
import ScreeningComplete from "@/components/shared/ScreeningComplete";
import { createScreeningSession } from "@/components/shared/screeningSession/screeningSession";

const Preview = ({ screener, formSchema }) => {
  let schema: Accessor<any> = () => {
    if (formSchema()) {
      return formSchema();
    }
    return {
      components: [],
      exporter: { name: "form-js (https://demo.bpmn.io)", version: "1.15.0" },
      id: "Form_1sgem74",
      schemaVersion: 18,
      type: "default",
    };
  };

  const session = createScreeningSession({
    schema,
    evaluate: (answers) => evaluateScreener(screener().id, answers),
    // Authors see results for an unanswered form as soon as Preview opens.
    evaluateOnLoad: true,
    screenerName: () => screener()?.screenerName ?? "",
  });

  return (
    <div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="text-lg text-gray-800 text-md font-bold">Form</div>
        <session.Form />
        <Show when={session.failed()}>
          <p role="alert" class="my-4 text-red-800">
            Could not evaluate the latest answers. Results below are from the
            last successful evaluation.
          </p>
        </Show>
        <Show when={!session.nextStepsShown()}>
          <ScreeningComplete
            results={session.results}
            pending={session.stale}
          />
        </Show>
        <HiddenQuestionsNotice
          unneededQuestionCount={session.unneededQuestionCount}
          showAllQuestions={session.showAllQuestions}
          onToggleShowAllQuestions={session.toggleShowAllQuestions}
        />
      </div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="flex flex-row gap-2 items-baseline">
          <div class="text-lg text-gray-800 text-md font-bold">Results</div>
          <Tooltip>
            <p>
              The Preview tab provides a live test environment where you can
              interact with your screener exactly as an end user would, and
              verify that the eligibility logic produces the correct results.
            </p>
            <p>
              <a
                href="https://bdt-docs.web.app/user/user-guide/#6-previewing-your-screener"
                target="_blank"
              >
                Read about previewing your screener in the docs
              </a>
            </p>
          </Tooltip>
        </div>
        <Results
          inputData={session.answersSent}
          results={session.results}
          // From an edit, not just once the answers are sent, so rows that no
          // longer match the answers are marked as outdated.
          resultsLoading={() => session.stale() && !session.failed()}
        />
      </div>
    </div>
  );
};
export default Preview;
