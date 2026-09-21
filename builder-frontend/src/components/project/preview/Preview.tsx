import { Accessor, createMemo, createSignal } from "solid-js";

import FormRenderer from "./FormRenderer";
import Results from "./Results";

import { evaluateScreener } from "../../../api/screener";

import { PreviewFormData, ScreenerResult } from "./types";
import Tooltip from "@/components/shared/Tooltip";
import {
  getHiddenQuestionPaths,
  haveSameQuestionPaths,
} from "@/utils/questionVotes";

const Preview = ({ project, formSchema }) => {
  const [lastInputDataSent, setLastInputDataSent] =
    createSignal<PreviewFormData>({});
  const [results, setResults] = createSignal<ScreenerResult>();
  const [resultsLoading, setResultsLoading] = createSignal(false);
  const [reviewedBenefits, setReviewedBenefits] = createSignal<string[]>([]);
  const hiddenQuestionPaths = createMemo(
    () => getHiddenQuestionPaths(results(), new Set(reviewedBenefits())),
    undefined,
    { equals: haveSameQuestionPaths },
  );

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

  const handleSubmitForm = async (data: PreviewFormData) => {
    setLastInputDataSent(data);
    setResultsLoading(true);

    let apiResult: ScreenerResult = await evaluateScreener(project().id, data);
    setResults(apiResult);
    setReviewedBenefits((current) => (current.length > 0 ? [] : current));
    setResultsLoading(false);
  };

  return (
    <div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="text-lg text-gray-800 text-md font-bold">Form</div>
        <FormRenderer
          schema={schema}
          formData={lastInputDataSent}
          hiddenQuestionPaths={hiddenQuestionPaths}
          submitForm={handleSubmitForm}
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
                href="https://bdt-docs.web.app/user-guide/#6-previewing-your-screener"
                target="_blank"
              >
                Read about previewing your screener in the docs
              </a>
            </p>
          </Tooltip>
        </div>
        <Results
          inputData={lastInputDataSent}
          results={results}
          resultsLoading={resultsLoading}
          reviewedBenefits={reviewedBenefits}
          onReviewBenefit={(benefitId) =>
            setReviewedBenefits((current) =>
              current.includes(benefitId) ? current : [...current, benefitId],
            )
          }
        />
      </div>
    </div>
  );
};
export default Preview;
