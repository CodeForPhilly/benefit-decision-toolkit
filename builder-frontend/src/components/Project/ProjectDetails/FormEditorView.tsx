import { onMount, onCleanup, createSignal, Switch, Match } from "solid-js";
import { useParams } from "@solidjs/router";

import { FormEditor } from "@bpmn-io/form-js-editor";

import FilterFormComponentsModule from "./formJsExtensions/FilterFormComponentsModule";
import CustomFormFieldsModule from "./formJsExtensions/customFormFields";

import { saveFormSchema } from "../../api/screener";

import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js-editor/dist/assets/form-js-editor.css";


function FormEditorView({ formSchema, setFormSchema }) {
  const [isUnsaved, setIsUnsaved] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const params = useParams();

  let timeoutId;
  let container;
  let formEditor: FormEditor;
  let emptySchema = {
    components: [],
    exporter: { name: "form-js (https://demo.bpmn.io)", version: "1.15.0" },
    id: "Form_1sgem74",
    schemaVersion: 18,
    type: "default",
  };

  onMount(() => {
    formEditor = new FormEditor({
      container,
      additionalModules: [
        FilterFormComponentsModule,
        CustomFormFieldsModule
      ],
    });

    if (formSchema()) {
      formEditor.importSchema(formSchema()).catch((err) => {
        console.error("Failed to load schema", err);
      });
    } else {
      formEditor.importSchema(emptySchema).catch((err) => {
        console.error("Failed to load schema", err);
      });
    }

    formEditor.on("changed", (e) => {
      setIsUnsaved(true);
      setFormSchema(e.schema);
    });

    onCleanup(() => {
      if (formEditor) {
        formEditor.destroy();
        formEditor = null;
        clearTimeout(timeoutId);
      }
    });
  });

  const handleSave = async () => {
    const projectId = params.projectId;
    const schema = formSchema();
    setIsUnsaved(false);
    setIsSaving(true);
    saveFormSchema(projectId, schema);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div class="flex flex-row">
      <div class="flex-8 overflow-auto">
        <div class="h-full" ref={(el) => (container = el)} />
      </div>
      <div class="flex-1 border-l-4 border-l-gray-200">
        <div class="flex flex-col p-10 gap-4">
          <Switch>
            <Match when={isUnsaved()}>
              <button
                onClick={handleSave}
                class="px-2 text-yellow-500 h-8 border-2 rounded hover:bg-yellow-100"
              >
                Save changes
              </button>
            </Match>
            <Match when={isSaving()}>
              <button
                onClick={handleSave}
                class="px-2 text-gray-300 h-8 border-2 rounded"
              >
                Saving...
              </button>
            </Match>
            <Match when={!isUnsaved() && !isSaving()}>
              <button
                onClick={handleSave}
                class="px-2 text-emerald-500 h-8 border-2 rounded hover:bg-emerald-100"
              >
                Save changes
              </button>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
}

export default FormEditorView;
