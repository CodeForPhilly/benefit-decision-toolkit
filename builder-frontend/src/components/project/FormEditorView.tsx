import {
  onCleanup, onMount,
  createEffect, createSignal, createResource,
  For, Match, Show, Switch,
  Accessor,
} from "solid-js";
import toast from "solid-toast";
import { useParams } from "@solidjs/router";

import { FormEditor } from "@bpmn-io/form-js-editor";

import CustomFormFieldsModule from "./formJsExtensions/customFormFields";
import { customKeyModule } from './formJsExtensions/customKeyDropdown/customKeyDropdownProvider';
import PathOptionsService, { compatibleComponentLabels, pathOptionsModule, TYPE_COMPATIBILITY } from './formJsExtensions/customKeyDropdown/pathOptionsService';

import { saveFormSchema, fetchFormPaths } from "../../api/screener";
import { extractFormPaths } from "../../utils/formSchemaUtils";
import Loading from "../Loading";

import "@bpmn-io/form-js/dist/assets/form-js.css";
import "@bpmn-io/form-js-editor/dist/assets/form-js-editor.css";
import { FormPath } from "@/types";

function FormEditorView({ formSchema, setFormSchema }) {
  const [isUnsaved, setIsUnsaved] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [highlightedTypes, setHighlightedTypes] = createSignal<string[]>([]);
  const params = useParams();

  // Fetch form paths from backend (replaces local transformation logic)
  const [formPaths] = createResource<FormPath[]>(
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

      // Only set key if the field supports keys and doesn't already have one set
      // Skip group components as they don't use keys
      if (field && field.id && field.type !== 'group' && field.type !== 'default') {
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

    const currentFormPaths: FormPath[] = formPaths() || [];
    const validPathSet = new Set(currentFormPaths.map((formPath: FormPath) => formPath.path));

    const pathOptionsService = formEditor.get("pathOptionsService") as PathOptionsService;
    pathOptionsService.setOptions(
      currentFormPaths.map(
        (formPath: FormPath) => ({ value: formPath.path, label: formPath.path, type: formPath.type })
      )
    );

    // Clean up any form fields with keys that are no longer valid options
    const formFieldRegistry = formEditor.get("formFieldRegistry") as any;
    const modeling = formEditor.get("modeling") as any;

    if (formFieldRegistry && modeling) {
      const allFields = formFieldRegistry.getAll();
      const invalidFields: string[] = [];

      for (const field of allFields) {
        // If field has a key that's not in valid paths (and not empty), reset it
        // Skip for expressions, which can have custom-defined keys
        if (
          field.key &&
          !validPathSet.has(field.key) &&
          field.key !== field.id &&
          field.type !== 'expression'
        ) {
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

  // Highlight compatible palette fields when an input pill is hovered/pinned
  const STYLE_ID = 'bdt-palette-highlight';
  onCleanup(() => document.getElementById(STYLE_ID)?.remove());
  createEffect(() => {
    const types = highlightedTypes();
    if (types.length === 0) {
      const el = document.getElementById(STYLE_ID);
      if (el) el.textContent = '';
      return;
    }

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    const compatibleSelectors = types
      .map((t) => `.fjs-palette-field[data-field-type='${t}']`)
      .join(', ');

    styleEl.textContent = `
      .fjs-palette-field {
        opacity: 0.2;
        transition: opacity 0.15s ease;
      }
      ${compatibleSelectors} {
        opacity: 1 !important;
        outline: 2px solid #0ea5e9;
        outline-offset: 1px;
        border-radius: 4px;
      }
    `;
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
      <div class="flex flex-col min-h-0 flex-1">
        <div class="flex items-start gap-4 px-4 py-3 border-b-4 border-gray-200 bg-gray-50">
          <InputsPanel formSchema={formSchema} expectedInputPaths={formPaths} setHighlightedTypes={setHighlightedTypes} />
          <div class="shrink-0 pt-1">
            <Switch>
              <Match when={isUnsaved()}>
                <div onClick={handleSave} class="btn-default btn-yellow">
                  Save
                </div>
              </Match>
              <Match when={isSaving()}>
                <div onClick={handleSave} class="btn-default btn-gray cursor-not-allowed">
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
        <div class="flex-1 overflow-auto min-h-0">
          <div class="h-full" ref={(el) => (container = el)} />
        </div>
      </div>
    </>
  );
}

const InputsPanel = ({
  formSchema,
  expectedInputPaths,
  setHighlightedTypes,
}: {
  formSchema: any;
  expectedInputPaths: Accessor<FormPath[]>;
  setHighlightedTypes: (types: string[]) => void;
}) => {
  const [hoveredPath, setHoveredPath] = createSignal<string | null>(null);
  const [pinnedPath, setPinnedPath] = createSignal<string | null>(null);

  const formOutputSet = () =>
    new Set(formSchema() ? extractFormPaths(formSchema()) : []);

  const expectedInputs = () => expectedInputPaths() || [];
  const missingInputs = () =>
    expectedInputs().filter((p) => !formOutputSet().has(p.path));
  const mappedInputs = () =>
    expectedInputs().filter((p) => formOutputSet().has(p.path));

  // Hover takes precedence over pin; pin persists after mouse leave
  createEffect(() => {
    const activePath = hoveredPath() ?? pinnedPath();
    if (!activePath) {
      setHighlightedTypes([]);
      return;
    }
    const formPath = expectedInputs().find((p) => p.path === activePath);
    setHighlightedTypes(formPath ? (TYPE_COMPATIBILITY[formPath.type] ?? []) : []);
  });

  const handleMouseEnter = (path: string) => setHoveredPath(path);
  const handleMouseLeave = () => setHoveredPath(null);
  const handleClick = (path: string) =>
    setPinnedPath((p) => (p === path ? null : path));

  return (
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <span class="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Form Inputs
      </span>

      <Show when={expectedInputs().length === 0}>
        <span class="text-gray-400 italic text-sm">
          No benefits configured. Add benefits to see required inputs.
        </span>
      </Show>

      <Show when={expectedInputs().length > 0}>
        <div class="flex items-center gap-2 overflow-x-auto flex-1 py-0.5 no-scrollbar">
          <For each={missingInputs()}>
            {(formPath) => (
              <div class="group relative shrink-0">
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={pinnedPath() === formPath.path}
                  aria-label={`${formPath.path}: not yet mapped. Needs ${compatibleComponentLabels(formPath.type).join(" or ")}.`}
                  class={`flex items-center gap-1.5 px-2 py-1 rounded-md border border-red-300 bg-red-50 text-red-800 text-xs font-mono cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500${pinnedPath() === formPath.path ? ' ring-2 ring-offset-1 ring-red-400' : ''}`}
                  onMouseEnter={() => handleMouseEnter(formPath.path)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => handleMouseEnter(formPath.path)}
                  onBlur={handleMouseLeave}
                  onClick={() => handleClick(formPath.path)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(formPath.path); } }}
                >
                  <span aria-hidden="true" class="text-red-400 font-sans">✗</span>
                  {formPath.path}
                  <span aria-hidden="true" class="text-red-300 font-sans text-[10px] leading-none">ⓘ</span>
                </div>
                <div
                  role="tooltip"
                  class="absolute bottom-full left-0 mb-2 px-2 py-1.5 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10"
                >
                  Use: {compatibleComponentLabels(formPath.type).join(", ")}
                </div>
              </div>
            )}
          </For>
          <For each={mappedInputs()}>
            {(formPath) => (
              <div class="group relative shrink-0">
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={pinnedPath() === formPath.path}
                  aria-label={`${formPath.path}: mapped. Compatible with ${compatibleComponentLabels(formPath.type).join(" or ")}.`}
                  class={`flex items-center gap-1.5 px-2 py-1 rounded-md border border-green-300 bg-green-50 text-green-800 text-xs font-mono cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500${pinnedPath() === formPath.path ? ' ring-2 ring-offset-1 ring-green-400' : ''}`}
                  onMouseEnter={() => handleMouseEnter(formPath.path)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => handleMouseEnter(formPath.path)}
                  onBlur={handleMouseLeave}
                  onClick={() => handleClick(formPath.path)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(formPath.path); } }}
                >
                  <span aria-hidden="true" class="text-green-600 font-sans">✓</span>
                  {formPath.path}
                  <span aria-hidden="true" class="text-green-400 font-sans text-[10px] leading-none">ⓘ</span>
                </div>
                <div
                  role="tooltip"
                  class="absolute bottom-full left-0 mb-2 px-2 py-1.5 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10"
                >
                  Use: {compatibleComponentLabels(formPath.type).join(", ")}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default FormEditorView;
