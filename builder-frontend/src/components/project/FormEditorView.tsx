import {
  onMount,
  onCleanup,
  createSignal,
  createResource,
  Switch,
  Match,
  For,
  Show,
} from "solid-js";
import { useParams } from "@solidjs/router";

import { FormEditor } from "@bpmn-io/form-js-editor";
import Drawer from "@corvu/drawer"; // 'corvu/drawer'

import FilterFormComponentsModule from "./formJsExtensions/FilterFormComponentsModule";
import CustomFormFieldsModule from "./formJsExtensions/customFormFields";

import { saveFormSchema } from "../../api/screener";
import { fetchScreenerBenefit } from "../../api/benefit";
import {
  extractFormPaths,
  extractJsonSchemaPaths,
} from "../../utils/formSchemaUtils";
import Loading from "../Loading";

import type { Benefit, BenefitDetail } from "../../types";

import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js-editor/dist/assets/form-js-editor.css";

function FormEditorView({ project, formSchema, setFormSchema }) {
  const [isUnsaved, setIsUnsaved] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const params = useParams();

  // Fetch all benefits with their checks
  const [benefits] = createResource(
    () => project()?.benefits,
    async (benefitDetails: BenefitDetail[]) => {
      if (!benefitDetails?.length) return [];
      const screenerId = params.projectId;
      return Promise.all(
        benefitDetails.map((b) => fetchScreenerBenefit(screenerId, b.id))
      );
    }
  );

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
        // FilterFormComponentsModule,
        CustomFormFieldsModule,
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
    <>
      <Show when={benefits.loading}>
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
        <FormValidationDrawer formSchema={formSchema} benefits={benefits} />
      </div>
    </>
  );
}

const FormValidationDrawer = ({ formSchema, benefits }) => {
  const formOutputs = () =>
    formSchema() ? extractFormPaths(formSchema()) : [];

  // Extract expected inputs from all benefits' checks
  const expectedInputs = () => {
    const allBenefits: Benefit[] = benefits() || [];
    const pathSet = new Set<string>();

    for (const benefit of allBenefits) {
      for (const check of benefit.checks || []) {
        const paths = extractJsonSchemaPaths(check.inputDefinition);
        paths.forEach((p) => pathSet.add(p));
      }
    }
    return Array.from(pathSet);
  };

  // Compute which expected inputs are satisfied vs missing
  const formOutputSet = () => new Set(formOutputs());

  const satisfiedInputs = () =>
    expectedInputs().filter((p) => formOutputSet().has(p));

  const missingInputs = () =>
    expectedInputs().filter((p) => !formOutputSet().has(p));

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
                  {(path) => (
                    <div class="py-2 px-3 mb-2 bg-red-50 rounded border border-red-300 font-mono text-sm text-red-800">
                      {path}
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
                  {(path) => (
                    <div class="py-2 px-3 mb-2 bg-green-50 rounded border border-green-300 font-mono text-sm text-green-800">
                      {path}
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
