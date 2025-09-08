import { createSignal, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { submitForm } from "../../api/screener";
import FormRenderer from "./FormRenderer";
import Results from "./Results";
import ResultsEditor from "./ResultsEditor";

export default function Preview({ project, formSchema, dmnModel }) {
  const [results, setResults] = createSignal();
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

  const handleSubmitForm = async (data) => {
    let results = await submitForm(params.projectId, data);
    setResults(results);
  };

  return (
    <>
      <div>
        <FormRenderer
          schema={schema}
          submitForm={handleSubmitForm}
        ></FormRenderer>
        <button className="border-1 border-green-500 bg-green-100 font-medium text-green-900 px-3 py-1">
          Save Test
        </button>
        <div className="pt-4">
          <Results results={results}></Results>
        </div>
        <div>
          <ResultsEditor project={project} dmnModel={dmnModel}></ResultsEditor>
        </div>
      </div>
    </>
  );
}
