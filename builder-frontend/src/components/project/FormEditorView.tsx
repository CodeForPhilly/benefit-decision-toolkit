import { onMount, onCleanup, createSignal, Switch, Match, on } from "solid-js";
import { useParams } from "@solidjs/router";
import toast, { Toaster } from 'solid-toast';
import hotkeys from 'hotkeys-js';

import { FormEditor } from "@bpmn-io/form-js-editor";

import FilterFormComponentsModule from "./formJsExtensions/FilterFormComponentsModule";
import CustomFormFieldsModule from "./formJsExtensions/customFormFields";

import { saveFormSchema } from "../../api/screener";

import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js-editor/dist/assets/form-js-editor.css";
import { Modeling } from "@bpmn-io/form-js-editor/dist/types/features/modeling/Modeling";

function stringrand(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


function FormEditorView({ formSchema, setFormSchema }) {
  const [isUnsaved, setIsUnsaved] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);

  const [copiedSelection, setCopiedSelection] = createSignal(null);
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

  const onCopy = (event) => {
    if (!formEditor) {
      return;
    }
    const selection: any = formEditor.get('selection');
    if (!selection.get()) {
      return;
    }

    event.preventDefault();
    setCopiedSelection(selection.get());
    toast.success('Selection copied to clipboard');
  };

  const onPaste = (event) => {
    if (!formEditor) {
      return;
    }
    if (!copiedSelection()) {
      return;
    }
    event.preventDefault();

    const selectionToPaste = { ...copiedSelection() };
    delete selectionToPaste.id;
    delete selectionToPaste.layout;
    selectionToPaste.key = selectionToPaste.key + '_' + stringrand(5);

    const schema = formEditor.getSchema();
    const targetFormField = { ...schema, _path: "" };
    const modeling = formEditor.get("modeling") as Modeling;
    modeling.addFormField(selectionToPaste, targetFormField, schema.components.length);
    toast.success('Selection pasted');
  }

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

    hotkeys("ctrl+c", onCopy);
    hotkeys("ctrl+v", onPaste);

    onCleanup(() => {
      if (formEditor) {
        formEditor.destroy();
        formEditor = null;
        clearTimeout(timeoutId);
      }
      hotkeys.unbind("ctrl+c");
      hotkeys.unbind("ctrl+v");
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
      <Toaster/>
      <div class="flex-7 overflow-auto">
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
