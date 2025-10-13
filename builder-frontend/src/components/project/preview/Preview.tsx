import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";

import FormRenderer from "./FormRenderer";
import Results from "./Results";
import { evaluateScreener } from "../../../api/screener";
import { PreviewFormData, ScreenerResult } from "./types";


export default function Preview({ project, formSchema, dmnModel }) {
  const [results, setResults] = createSignal<ScreenerResult>();
  const [resultsLoading, setResultsLoading] = createSignal(false);

  const params = useParams();
  let schema = formSchema();
  if (!schema) {
    schema = {
      components: [],
      exporter: { name: "form-js (https://demo.bpmn.io)", version: "1.15.0" },
      id: "Form_1sgem74",
      schemaVersion: 18,
      type: "default",
    };
  }

  const handleSubmitForm = async (data: PreviewFormData) => {
    setResultsLoading(true);
    let apiResult: ScreenerResult = await evaluateScreener(params.projectId, data);
    setResultsLoading(false);
    setResults(apiResult);
  };

  return (
    <>
      <div>
        <div class="my-4 mx-8 py-4 border border-gray-300 rounded shadow-sm">
          <FormRenderer
            schema={schema}
            submitForm={handleSubmitForm}
          />
        </div>
        <div>
          <Results results={results} resultsLoading={resultsLoading}/>
        </div>
      </div>
    </>
  );
}
