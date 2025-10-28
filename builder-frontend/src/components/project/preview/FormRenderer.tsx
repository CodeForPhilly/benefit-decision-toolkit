import { Accessor, onMount } from "solid-js";
import debounce from "lodash.debounce";

import { Form } from "@bpmn-io/form-js-viewer";

import { PreviewFormData } from "./types";

import "@bpmn-io/form-js/dist/assets/form-js.css";

function FormRenderer({ schema, submitForm }: { schema: Accessor<any>; submitForm: (data: PreviewFormData) => void }) {
  let container: HTMLDivElement | undefined;

  onMount(() => {
    const form = new Form({ container });
    const debouncedSubmit = debounce(
      (data: PreviewFormData) => submitForm(data),
      500
    );

    form
      .importSchema(schema())
      .then(() => {
        form.on("changed", (event) => {
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
