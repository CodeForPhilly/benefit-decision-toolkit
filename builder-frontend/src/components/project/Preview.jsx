import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import { submitForm } from "../../api/screener";
import FormRenderer from "./FormRenderer";
import Results from "./Results";

export default function Preview({ formSchema }) {
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
        <div className="pt-4">
          <Results results={results}></Results>
        </div>
      </div>
    </>
  );
}
