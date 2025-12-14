import { Accessor, createSignal } from "solid-js";

import FormRenderer from "./FormRenderer";
import Results from "./Results";

import { evaluateScreener } from "@/api/screener";

import { PreviewFormData, ScreenerResult } from "./types";

const Preview = ({ project, formSchema }) => {
  const [lastInputDataSent, setLastInputDataSent] =
    createSignal<PreviewFormData>({});
  const [results, setResults] = createSignal<ScreenerResult>();
  const [resultsLoading, setResultsLoading] = createSignal(false);

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
    setResultsLoading(false);
  };

  return (
    <div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="text-lg text-gray-800 text-md font-bold">Form</div>
        <FormRenderer schema={schema} submitForm={handleSubmitForm} />
      </div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="text-lg text-gray-800 text-md font-bold">Results</div>
        <Results
          inputData={lastInputDataSent}
          results={results}
          resultsLoading={resultsLoading}
        />
      </div>
    </div>
  );
};
export default Preview;
