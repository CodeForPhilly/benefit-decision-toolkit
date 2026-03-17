import { For, Index } from "solid-js";
import type { ParameterSchemaProperty, ParameterType } from "@/types";

interface ParametersSchemaSectionProps {
  parameters: ParameterSchemaProperty[];
  onChange: (parameters: ParameterSchemaProperty[]) => void;
}

const PARAMETER_TYPES: { value: ParameterType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "array", label: "String List" },
];

const ParametersSchemaSection = (props: ParametersSchemaSectionProps) => {
  const handleParameterChange = (
    index: number,
    field: keyof ParameterSchemaProperty,
    value: string | boolean
  ) => {
    const newParams = [...props.parameters];
    newParams[index] = {
      ...newParams[index],
      [field]: value,
    };
    props.onChange(newParams);
  };

  const addParameter = () => {
    props.onChange([
      ...props.parameters,
      { key: "", type: "string", required: true },
    ]);
  };

  const removeParameter = (index: number) => {
    const newParams = props.parameters.filter((_, i) => i !== index);
    props.onChange(newParams);
  };

  return (
    <div class="border border-gray-300 rounded-lg p-4 mb-6">
      <h3 class="text-lg font-semibold mb-4">Parameters Schema</h3>
      <p class="text-sm text-gray-600 mb-4">
        Define the parameters your check accepts. These are passed in the <code class="bg-gray-100 px-1 rounded">parameters</code> input.
      </p>

      {props.parameters.length > 0 && (
        <div class="mb-4">
          {/* Header row */}
          <div class="flex items-center gap-4 mb-2 text-sm font-medium text-gray-600">
            <div class="w-48">Key</div>
            <div class="w-32">Type</div>
            <div class="w-24">Required</div>
            <div class="w-8"></div>
          </div>

          {/* Parameter rows */}
          <div class="space-y-2">
            <Index each={props.parameters}>
              {(param, index) => (
                <div class="flex items-center gap-4">
                  <input
                    type="text"
                    value={param().key}
                    onInput={(e) =>
                      handleParameterChange(index, "key", e.currentTarget.value)
                    }
                    placeholder="parameterKey"
                    class="form-input border border-gray-300 rounded px-3 py-1.5 w-48"
                  />
                  <select
                    value={param().type}
                    onChange={(e) =>
                      handleParameterChange(index, "type", e.currentTarget.value as ParameterType)
                    }
                    class="form-select border border-gray-300 rounded px-3 py-1.5 w-32"
                  >
                    <For each={PARAMETER_TYPES}>
                      {(typeOption) => (
                        <option value={typeOption.value}>{typeOption.label}</option>
                      )}
                    </For>
                  </select>
                  <div class="w-24 flex items-center">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param().required}
                        onChange={(e) =>
                          handleParameterChange(index, "required", e.currentTarget.checked)
                        }
                        class="form-checkbox h-4 w-4 text-sky-600"
                      />
                      <span class="text-sm">Yes</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParameter(index)}
                    class="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 w-8"
                    title="Remove"
                  >
                    X
                  </button>
                </div>
              )}
            </Index>
          </div>
        </div>
      )}

      {props.parameters.length === 0 && (
        <p class="text-sm text-gray-500 mb-4 italic">No parameters defined yet.</p>
      )}

      <button
        type="button"
        onClick={addParameter}
        class="btn-default text-sm text-sky-600 hover:text-sky-800 hover:bg-sky-50"
      >
        + Add Parameter
      </button>
    </div>
  );
};

export default ParametersSchemaSection;
