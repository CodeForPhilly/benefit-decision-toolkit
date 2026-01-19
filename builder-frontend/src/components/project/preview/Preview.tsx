import { Accessor, createSignal } from "solid-js";

import FormRenderer from "./FormRenderer";
import Results from "./Results";

import { evaluateScreener } from "../../../api/screener";
import { testScreener, getScreenerTestResult } from "@/api/screenerTest";

import { PreviewFormData, ScreenerResult } from "./types";


const Preview = ({ project, formSchema }) => {
  const [lastInputDataSent, setLastInputDataSent] = createSignal<PreviewFormData>({});
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
  }

  const handleSubmitForm = async (data: PreviewFormData) => {
    setLastInputDataSent(data);
    setResultsLoading(true);

    let apiResult: ScreenerResult = await evaluateScreener(project().id, data);
    setResults(apiResult);
    setResultsLoading(false);
  };

  const handleTest = async (screenerTestData) => {
    try {
      await testScreener(screenerTestData);
    } catch (e) {
      console.log("Error submitting test screener", e);
    }
  }

  const handleTestResult = async (screenerId) => {
    try{
      console.log("Clicked!");
      await getScreenerTestResult(screenerId);
    } catch (e) {
      console.log("Error getting test screener result", e);
    }
  }

  return (
    <div>
      <div class="m-4 p-4 border-2 border-gray-200 rounded">
        <div class="text-lg text-gray-800 text-md font-bold">Form</div>
        <FormRenderer schema={schema} submitForm={handleSubmitForm}/>
      </div>
      <div class="flex gap-4 m-4">
        <div class="flex-1 p-4 border-2 border-gray-200 rounded">
          <div class="text-lg text-gray-800 font-bold">Results</div>
          <div class="mb-4">
            <button
              onClick={handleTest} class="btn-default btn-blue"
            >
              Add as Test
            </button>
          </div>
          <Results inputData={lastInputDataSent} results={results} resultsLoading={resultsLoading}/>
        </div>
        <div class="flex-1 p-4 border-2 border-gray-200 rounded">
          <div>
            <button
              onClick={handleTestResult} class="btn-default btn-blue"
            >
              Run Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Preview;
