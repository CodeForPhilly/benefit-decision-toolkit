import { For, Index, Show } from "solid-js";
import type { SituationSchemaConfig, PeopleKeyDefinition, ParameterSchemaProperty } from "@/types";
import { createDefaultPeopleKey } from "./schemaUtils";

interface SituationSchemaSectionProps {
  config: SituationSchemaConfig;
  parameters: ParameterSchemaProperty[];
  onChange: (config: SituationSchemaConfig) => void;
}

const SituationSchemaSection = (props: SituationSchemaSectionProps) => {
  // Get string parameters that can be used as people key references
  const stringParameters = () =>
    props.parameters.filter((p) => p.type === "string").map((p) => p.key);

  const handlePeopleKeyChange = (index: number, updates: Partial<PeopleKeyDefinition>) => {
    const newKeys = [...props.config.people.keys];
    newKeys[index] = { ...newKeys[index], ...updates };
    props.onChange({
      ...props.config,
      people: {
        ...props.config.people,
        keys: newKeys,
      },
    });
  };

  const addPeopleKey = (isParameterReference: boolean) => {
    props.onChange({
      ...props.config,
      people: {
        ...props.config.people,
        keys: [...props.config.people.keys, createDefaultPeopleKey(isParameterReference)],
      },
    });
  };

  const removePeopleKey = (index: number) => {
    const newKeys = props.config.people.keys.filter((_, i) => i !== index);
    props.onChange({
      ...props.config,
      people: {
        ...props.config.people,
        keys: newKeys,
      },
    });
  };

  const handleSimpleCheckKeyChange = (index: number, value: string) => {
    const newKeys = [...props.config.simpleChecks];
    newKeys[index] = value;
    props.onChange({
      ...props.config,
      simpleChecks: newKeys,
    });
  };

  const addSimpleCheck = () => {
    props.onChange({
      ...props.config,
      simpleChecks: [...props.config.simpleChecks, ""],
    });
  };

  const removeSimpleCheck = (index: number) => {
    const newKeys = props.config.simpleChecks.filter((_, i) => i !== index);
    props.onChange({
      ...props.config,
      simpleChecks: newKeys,
    });
  };

  return (
    <div class="border border-gray-300 rounded-lg p-4 mb-6">
      <h3 class="text-lg font-semibold mb-4">Situation Schema</h3>
      <p class="text-sm text-gray-600 mb-4">
        Define which parts of the situation data your check needs access to.
      </p>

      {/* People Section */}
      <div class="mb-6">
        <h4 class="font-medium mb-2">People</h4>
        <p class="text-sm text-gray-500 mb-3">
          Define person keys under{" "}
          <code class="bg-gray-100 px-1 rounded">situation.people</code> and their properties.
        </p>

        {/* People Keys */}
        <div class="space-y-3 ml-4">
          <Index each={props.config.people.keys}>
            {(keyDef, index) => (
              <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div class="flex items-center gap-2 mb-2">
                  <Show
                    when={keyDef().isParameterReference}
                    fallback={
                      <input
                        type="text"
                        value={keyDef().value}
                        onInput={(e) =>
                          handlePeopleKeyChange(index, { value: e.currentTarget.value })
                        }
                        placeholder="e.g., client"
                        class="form-input border border-gray-300 rounded px-3 py-1.5 w-48"
                      />
                    }
                  >
                    <div class="flex items-center gap-1">
                      <span class="text-gray-500">{"{"}</span>
                      <select
                        value={keyDef().value}
                        onChange={(e) =>
                          handlePeopleKeyChange(index, { value: e.currentTarget.value })
                        }
                        class="form-select border border-gray-300 rounded px-3 py-1.5 w-40"
                      >
                        <option value="">Select parameter...</option>
                        <For each={stringParameters()}>
                          {(param) => <option value={param}>{param}</option>}
                        </For>
                      </select>
                      <span class="text-gray-500">{"}"}</span>
                    </div>
                  </Show>
                  <span class="text-xs text-gray-400">
                    {keyDef().isParameterReference ? "(parameter)" : "(static)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePeopleKey(index)}
                    class="ml-auto text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    title="Remove"
                  >
                    X
                  </button>
                </div>

                {/* Properties for this key */}
                <div class="ml-4 mt-2 space-y-1">
                  <span class="text-xs text-gray-500 block mb-1">Properties:</span>
                  <div class="flex flex-col gap-1">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyDef().includeDateOfBirth}
                        onChange={(e) =>
                          handlePeopleKeyChange(index, {
                            includeDateOfBirth: e.currentTarget.checked,
                          })
                        }
                        class="form-checkbox h-4 w-4 text-sky-600"
                      />
                      <span class="text-sm mx-2">dateOfBirth</span>
                      <span class="text-xs text-gray-400">date</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyDef().includeEnrollments}
                        onChange={(e) =>
                          handlePeopleKeyChange(index, {
                            includeEnrollments: e.currentTarget.checked,
                          })
                        }
                        class="form-checkbox h-4 w-4 text-sky-600"
                      />
                      <span class="text-sm mx-2">enrollments</span>
                      <span class="text-xs text-gray-400">string[]</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </Index>

          <div class="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => addPeopleKey(false)}
              class="btn-default text-sm text-sky-600 hover:text-sky-800 hover:bg-sky-50"
            >
              + Add Static Key
            </button>
            <button
              type="button"
              onClick={() => addPeopleKey(true)}
              disabled={stringParameters().length === 0}
              class={`btn-default text-sm ${
                stringParameters().length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-sky-600 hover:text-sky-800 hover:bg-sky-50"
              }`}
              title={
                stringParameters().length === 0
                  ? "Add a string parameter first to use as a reference"
                  : "Add a key that references a string parameter"
              }
            >
              + Add Parameter Reference
            </button>
          </div>
        </div>
      </div>

      {/* Simple Checks */}
      <div>
        <h4 class="font-medium mb-2">Simple Checks</h4>
        <p class="text-sm text-gray-500 mb-3">
          Define boolean flags your check needs from{" "}
          <code class="bg-gray-100 px-1 rounded">situation.simpleChecks</code>
        </p>
        <div class="space-y-2 ml-4">
          <Index each={props.config.simpleChecks}>
            {(key, index) => (
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value={key()}
                  onInput={(e) =>
                    handleSimpleCheckKeyChange(index, e.currentTarget.value)
                  }
                  placeholder="e.g., ownerOccupant"
                  class="form-input border border-gray-300 rounded px-3 py-1.5 w-64"
                />
                <span class="text-sm text-gray-500">: boolean</span>
                <button
                  type="button"
                  onClick={() => removeSimpleCheck(index)}
                  class="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                  title="Remove"
                >
                  X
                </button>
              </div>
            )}
          </Index>
          <button
            type="button"
            onClick={addSimpleCheck}
            class="btn-default text-sm text-sky-600 hover:text-sky-800 hover:bg-sky-50 mt-2"
          >
            + Add Simple Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default SituationSchemaSection;
