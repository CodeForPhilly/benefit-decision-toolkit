import { For, Index } from "solid-js";
import type { ParameterDefinition, ParameterType } from "@/types";

interface ParametersSchemaSectionProps {
  parameters: ParameterDefinition[];
  onChange: (parameters: ParameterDefinition[]) => void;
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
    field: keyof ParameterDefinition,
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
      { key: "", label: "", type: "string", required: true },
    ]);
  };

  const removeParameter = (index: number) => {
    const newParams = props.parameters.filter((_, i) => i !== index);
    props.onChange(newParams);
  };

  return (
    <div class="border border-gray-300 rounded-lg p-4 mb-6 flex-1">
      <h3 class="text-lg font-semibold mb-4">Parameters Schema</h3>
      <p class="text-sm text-gray-600 mb-4">
        Define the parameters your check accepts. These are passed in the <code class="bg-gray-100 px-1 rounded">parameters</code> input.
      </p>

      {props.parameters.length > 0 && (
        <div class="mb-4">
          {/* Header row */}


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
                    class="form-input border border-gray-300 rounded flex-2"
                  />
                  <select
                    value={param().type}
                    onChange={(e) =>
                      handleParameterChange(index, "type", e.currentTarget.value as ParameterType)
                    }
                    class="form-select border border-gray-300 rounded flex-2"
                  >
                    <For each={PARAMETER_TYPES}>
                      {(typeOption) => (
                        <option value={typeOption.value}>{typeOption.label}</option>
                      )}
                    </For>
                  </select>
                  <div class="w-24 flex items-center flex-1">
                    <label class="items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param().required}
                        onChange={(e) =>
                          handleParameterChange(index, "required", e.currentTarget.checked)
                        }
                        class="form-checkbox h-4 w-4 text-sky-600"
                      />
                      <span class="text-sm ml-2">Required</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParameter(index)}
                    class="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 w-8 flex-1"
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
