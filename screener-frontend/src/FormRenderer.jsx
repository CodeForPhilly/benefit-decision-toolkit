import { onMount } from "solid-js";
import { Form } from "@bpmn-io/form-js-viewer";
import debounce from "lodash.debounce";
import "@bpmn-io/form-js/dist/assets/form-js.css";
import { useParams } from "@solidjs/router";

function FormRenderer({ schema, submitForm }) {
  let container;

  onMount(() => {
    const form = new Form({ container });

    const debouncedSubmit = debounce((data) => {
      submitForm(data);
    }, 1000);

    form
      .importSchema(schema)
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
