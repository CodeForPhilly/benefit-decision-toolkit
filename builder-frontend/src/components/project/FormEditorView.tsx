import {
  onCleanup, onMount,
  createEffect, createSignal, createResource,
  For, Match, Show, Switch,
} from "solid-js";
import toast from "solid-toast";
import { useParams } from "@solidjs/router";

import { FormEditor } from "@bpmn-io/form-js-editor";
import Drawer from "@corvu/drawer"; // 'corvu/drawer'

import CustomFormFieldsModule from "./formJsExtensions/customFormFields";
import { customKeyModule } from './formJsExtensions/customKeyDropdown/customKeyDropdownProvider';
import PathOptionsService, { pathOptionsModule, type PathOption } from './formJsExtensions/customKeyDropdown/pathOptionsService';

import { saveFormSchema, fetchFormPaths, type FormPath } from "../../api/screener";
import { extractFormPaths } from "../../utils/formSchemaUtils";
import Loading from "../Loading";

import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js-editor/dist/assets/form-js-editor.css";

function FormEditorView({ formSchema, setFormSchema }) {
  const [isUnsaved, setIsUnsaved] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const params = useParams();

  // Fetch form paths from backend (replaces local transformation logic)
  const [formPaths] = createResource(
    () => params.projectId,
    async (screenerId: string) => {
      if (!screenerId) return [];
      const response = await fetchFormPaths(screenerId);
      return response.paths;
    }
  );

  let timeoutId;
  let container;
  let formEditor: FormEditor;
  let emptySchema = {
    components: [],
    exporter: { name: "form-js (https://demo.bpmn.io)", version: "1.15.0" },
    id: "BDT Form",
    schemaVersion: 18,
    type: "default",
  };

  onMount(() => {
    formEditor = new FormEditor({
      container,
      additionalModules: [
        // FilterFormComponentsModule,
        CustomFormFieldsModule,
        pathOptionsModule,
        customKeyModule
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

    // Set default key to field ID when a new form field is added
    const eventBus = formEditor.get("eventBus") as any;
    const modeling = formEditor.get("modeling") as any;
    eventBus.on("formField.add", (event: { formField: any }) => {
      const field = event.formField;
      
      console.log(field);
      // Only set key if the field supports keys and doesn't already have one set
      // Skip group components as they don't use keys
      if (field && field.id && field.type !== 'group' && field.type !== 'default') {
        console.log(field);
        // Use setTimeout to ensure the field is fully added before modifying
        setTimeout(() => {
          modeling.editFormField(field, 'key', field.id);
        }, 0);
      }
    });

    onCleanup(() => {
      if (formEditor) {
        formEditor.destroy();
        formEditor = null;
        clearTimeout(timeoutId);
      }
    });
  });

  // Update path options when form paths load from backend
  createEffect(() => {
    if (!formEditor || formPaths.loading) return;

    const formPathsData = formPaths() || [];
    const validPathSet = new Set(formPathsData.map(fp => fp.path));

    const pathOptionsService = formEditor.get("pathOptionsService") as PathOptionsService;
    const options: PathOption[] = formPathsData.map((fp) => ({
      value: fp.path,
      label: fp.path,
      type: fp.type
    }));
    pathOptionsService.setOptions(options);

    // Clean up any form fields with keys that are no longer valid options
    const formFieldRegistry = formEditor.get("formFieldRegistry") as any;
    const modeling = formEditor.get("modeling") as any;

    if (formFieldRegistry && modeling) {
      const allFields = formFieldRegistry.getAll();
      const invalidFields: string[] = [];

      for (const field of allFields) {
        // If field has a key that's not in valid paths (and not empty), reset it
        if (field.key && !validPathSet.has(field.key) && field.key !== field.id) {
          invalidFields.push(field.key);
          modeling.editFormField(field, 'key', field.id);
        }
      }

      // Notify user if we reset any fields
      if (invalidFields.length > 0) {
        setIsUnsaved(true);
        const fieldCount = invalidFields.length;
        const message = fieldCount === 1
          ? `1 field had an invalid key "${invalidFields[0]}" and was reset.`
          : `${fieldCount} fields had invalid keys and were reset: ${invalidFields.join(', ')}`;
        toast(message, { duration: 5000, icon: '⚠️' });
        handleSave();
      }
    }
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
    <>
      <Show when={formPaths.loading}>
        <Loading />
      </Show>
      <div class="flex flex-row">
        <div class="flex-8 overflow-auto">
          <div class="h-full" ref={(el) => (container = el)} />
        </div>
        <div class="flex-1 border-l-4 border-l-gray-200">
          <div class="flex flex-col p-10 gap-4 place-items-center">
            <Switch>
              <Match when={isUnsaved()}>
                <div onClick={handleSave} class="btn-default btn-yellow">
                  Save
                </div>
              </Match>
              <Match when={isSaving()}>
                <div
                  onClick={handleSave}
                  class="btn-default btn-gray cursor-not-allowed"
                >
                  Saving...
                </div>
              </Match>
              <Match when={!isUnsaved() && !isSaving()}>
                <div onClick={handleSave} class="btn-default btn-blue">
                  Save
                </div>
              </Match>
            </Switch>
          </div>
        </div>
        <FormValidationDrawer formSchema={formSchema} expectedInputPaths={formPaths} />
      </div>
    </>
  );
}

const FormValidationDrawer = ({ formSchema, expectedInputPaths }) => {
  const formOutputs = () =>
    formSchema() ? extractFormPaths(formSchema()) : [];

  // Expected inputs come directly from backend API as FormPath objects
  const expectedInputs = (): FormPath[] => expectedInputPaths() || [];

  // Compute which expected inputs are satisfied vs missing
  const formOutputSet = () => new Set(formOutputs());

  const satisfiedInputs = (): FormPath[] =>
    expectedInputs().filter((fp: FormPath) => formOutputSet().has(fp.path));

  const missingInputs = (): FormPath[] =>
    expectedInputs().filter((fp: FormPath) => !formOutputSet().has(fp.path));

  return (
    <Drawer side="right">
      {(props) => (
        <>
          <Drawer.Trigger
            class="
              fixed bottom-5 right-5
              my-auto rounded-lg
              text-lg font-medium transition-all duration-100 "
          >
            <div class="btn-default btn-gray shadow-[0_0_10px_rgba(0,0,0,0.4)]">
              Validate Form Outputs
            </div>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay
              class="
                fixed inset-0 z-50
                data-transitioning:transition-colors data-transitioning:duration-500
                data-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                "background-color": `rgb(0 0 0 / ${
                  0.5 * props.openPercentage
                })`,
              }}
            />
            <Drawer.Content
              class="
                fixed flex flex-col md:select-none
                -right-10 bottom-0 z-50 px-5 h-full max-w-[500px] min-w-[500px]
                bg-gray-100 border-l-4 border-gray-400 rounded-l-lg
                data-transitioning:transition-transform data-transitioning:duration-500
                data-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)] overflow-y-scroll"
            >
              <Drawer.Label class="pt-5 mr-10 text-center text-xl font-bold">
                Form Validation
              </Drawer.Label>

              {/* Form Outputs Section */}
              <div class="mt-4 mr-10 px-4 pb-10">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">
                  Form Outputs
                </h3>
                <For
                  each={formOutputs()}
                  fallback={
                    <p class="text-gray-500 italic text-sm">
                      No form fields defined yet.
                    </p>
                  }
                >
                  {(path) => (
                    <div class="py-2 px-3 mb-2 bg-white rounded border border-gray-300 font-mono text-sm">
                      {path}
                    </div>
                  )}
                </For>
              </div>

              {/* Missing Inputs Section */}
              <div class="mt-4 mr-10 px-4">
                <h3 class="text-lg font-semibold text-red-900 mb-2">
                  Missing Inputs
                </h3>
                <For
                  each={missingInputs()}
                  fallback={
                    <p class="text-gray-500 italic text-sm">
                      All required inputs are satisfied!
                    </p>
                  }
                >
                  {(formPath) => (
                    <div class="py-2 px-3 mb-2 bg-red-50 rounded border border-red-300 text-sm text-red-800">
                      <div class="font-mono">{formPath.path} ({formPath.type})</div>
                    </div>
                  )}
                </For>
              </div>

              {/* Satisfied Inputs Section */}
              <div class="mt-4 mr-10 px-4">
                <h3 class="text-lg font-semibold text-green-900 mb-2">
                  Satisfied Inputs
                </h3>
                <For
                  each={satisfiedInputs()}
                  fallback={
                    <p class="text-gray-500 italic text-sm">
                      No inputs satisfied yet.
                    </p>
                  }
                >
                  {(formPath) => (
                    <div class="py-2 px-3 mb-2 bg-green-50 rounded border border-green-300 text-sm text-green-800">
                      <div class="font-mono">{formPath.path} ({formPath.type})</div>
                    </div>
                  )}
                </For>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  );
};

export default FormEditorView;
