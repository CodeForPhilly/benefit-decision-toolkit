import { onMount } from "solid-js";

import debounce from "lodash.debounce";
import { Form } from "@bpmn-io/form-js-viewer";
import { State } from "@bpmn-io/form-js-viewer/dist/types/Form";

import "@bpmn-io/form-js/dist/assets/form-js.css";


function FormRenderer(
  { schema, submitForm }:
  { schema: { [key: string]: any; }, submitForm: (data: any) => void }
) {
  let container: Element | null = null;

  onMount(() => {
    const form: Form = new Form({ container });

    const debouncedSubmit = debounce((data) => {
      submitForm(data);
    }, 1000);

    form
      .importSchema(schema)
      .then(() => {
        form.on("changed", (event: State) => {
          debouncedSubmit(event.data);
        });
      })
      .catch(console.error);
  });

  return (
    <div>
      <div ref={(el) => (container = el)} />
    </div>
  );
}

export default FormRenderer;
