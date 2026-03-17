import { Accessor, createSignal, createEffect, Show } from "solid-js";
import { createStore } from "solid-js/store";
import type { JSONSchema7 } from "json-schema";

import SituationSchemaSection from "./SituationSchemaSection";
import ParametersSchemaSection from "./ParametersSchemaSection";
import {
  getDefaultEditorState,
  parseJsonSchemaToEditorState,
  convertEditorStateToJsonSchema,
  validateEditorState,
} from "./schemaUtils";

import type { EligibilityCheck, InputSchemaEditorState, SituationSchemaConfig, ParameterSchemaProperty } from "@/types";
import Tooltip from "@/components/shared/Tooltip";

interface InputSchemaEditorProps {
  eligibilityCheck: Accessor<EligibilityCheck>;
  onSave: (schema: JSONSchema7) => Promise<void>;
}

const InputSchemaEditor = (props: InputSchemaEditorProps) => {
  const [editorState, setEditorState] = createStore<InputSchemaEditorState>(
    getDefaultEditorState()
  );
  const [validationErrors, setValidationErrors] = createSignal<string[]>([]);
  const [showPreview, setShowPreview] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [initialLoadComplete, setInitialLoadComplete] = createSignal(false);

  // Load initial state from existing inputDefinition (only once on initial load)
  createEffect(() => {
    const check = props.eligibilityCheck();
    if (check && check.id && !initialLoadComplete()) {
      if (check.inputDefinition) {
        const parsed = parseJsonSchemaToEditorState(check.inputDefinition);
        setEditorState(parsed);
      }
      setInitialLoadComplete(true);
    }
  });

  const handleSituationChange = (config: SituationSchemaConfig) => {
    setEditorState("situation", config);
    setValidationErrors([]);
  };

  const handleParametersChange = (parameters: ParameterSchemaProperty[]) => {
    setEditorState("parameters", parameters);
    setValidationErrors([]);
  };

  const handleSave = async () => {
    // Validate
    const validation = validateEditorState(editorState);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Convert to JSON Schema
    const schema = convertEditorStateToJsonSchema(editorState);

    // Save
    setIsSaving(true);
    try {
      await props.onSave(schema);
      setValidationErrors([]);
      // Allow the effect to reload fresh data from server after save
      setInitialLoadComplete(false);
    } catch (error) {
      console.error("Failed to save schema:", error);
      setValidationErrors(["Failed to save schema. Please try again."]);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewJson = () => {
    const schema = convertEditorStateToJsonSchema(editorState);
    return JSON.stringify(schema, null, 2);
  };

  return (
    <div class="p-6 max-w-4xl">
      <div class="flex flex-row gap-2 items-baseline mb-6">
        <h2 class="text-2xl font-bold">{props.eligibilityCheck().name}</h2>
        <Tooltip>
          <p>
            Define the input schema for your custom check. This specifies what
            data your DMN will receive in the <code>situation</code> and{" "}
            <code>parameters</code> inputs.
          </p>
          <p class="mt-2">
            <a
              href="https://bdt-docs.web.app/custom-checks/#input-schema"
              target="_blank"
              class="text-sky-600 hover:underline"
            >
              Learn more about input schemas
            </a>
          </p>
        </Tooltip>
      </div>

      <p class="text-gray-600 mb-6">{props.eligibilityCheck().description}</p>

      {/* Validation Errors */}
      <Show when={validationErrors().length > 0}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 class="font-medium text-red-800 mb-2">Validation Errors</h4>
          <ul class="list-disc list-inside text-red-700 text-sm">
            {validationErrors().map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </div>
      </Show>

      {/* Situation Schema Section */}
      <SituationSchemaSection
        config={editorState.situation}
        parameters={editorState.parameters}
        onChange={handleSituationChange}
      />

      {/* Parameters Schema Section */}
      <ParametersSchemaSection
        parameters={editorState.parameters}
        onChange={handleParametersChange}
      />

      {/* Actions */}
      <div class="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving()}
          class={`btn-default btn-blue ${isSaving() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSaving() ? "Saving..." : "Save Schema"}
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview())}
          class="btn-default hover:bg-gray-100"
        >
          {showPreview() ? "Hide Preview" : "Show JSON Preview"}
        </button>
      </div>

      {/* JSON Preview */}
      <Show when={showPreview()}>
        <div class="mt-6">
          <h4 class="font-medium mb-2">Generated JSON Schema</h4>
          <pre class="bg-gray-100 rounded-lg p-4 overflow-auto text-sm max-h-96">
            {getPreviewJson()}
          </pre>
        </div>
      </Show>
    </div>
  );
};

export default InputSchemaEditor;
