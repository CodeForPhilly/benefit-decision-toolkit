import { Accessor, createSignal, For, Show } from "solid-js";

import ParameterModal from "./modals/ParameterModal";

import ConfirmationModal from "@/components/shared/ConfirmationModal";
import type { EligibilityCheck, ParameterDefinition } from "@/types";


const ParametersConfiguration = ({
  eligibilityCheck,
  addParameter,
  editParameter,
  removeParameter,
}: {
  eligibilityCheck: Accessor<EligibilityCheck>;
  addParameter: (parameter: ParameterDefinition) => Promise<void>;
  editParameter: (
    parameterIndex: number,
    parameter: ParameterDefinition
  ) => Promise<void>;
  removeParameter: (parameterIndex: number) => Promise<void>;
}) => {
  const [addingParameter, setAddingParameter] = createSignal<boolean>(false);
  const [parameterIndexToEdit, setParameterIndexToEdit] = createSignal<null | number>(null);
  const [parameterIndexToRemove, setParameterIndexToRemove] = createSignal<null | number>(null);

  const handleProjectMenuClicked = (e, parameterIndex: number) => {
    e.stopPropagation();
    setParameterIndexToRemove(parameterIndex);
  };

  return (
    <div class="p-12">
      <div class="text-3xl font-bold tracking-wide mb-2">
        {eligibilityCheck().name}
      </div>
      <p class="text-xl mb-4">{eligibilityCheck().description}</p>
      <div class="p-2">
        <h2 class="text-xl font-semibold mb-2">Parameters</h2>
        <div
          class="btn-default btn-blue mb-3 mr-1"
          onClick={() => {
            setAddingParameter(true);
          }}
        >
          Create New Parameter
        </div>
        <Show
          when={eligibilityCheck().parameters.length > 0}
          fallback={<p>No parameters defined.</p>}
        >
          <div class="flex flex-wrap gap-4">
            <For each={eligibilityCheck().parameters}>
              {(param, parameterIndex) => (
                <div
                  class="relative border-2 border-gray-200 rounded p-4 w-80 hover:shadow-lg hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    console.log("here");
                    setParameterIndexToEdit(parameterIndex());
                  }}
                >
                  <div class="text-lg font-bold text-gray-800 mb-2">
                    {param.key}
                  </div>
                  <div>
                    <span class="font-bold">Type:</span> {param.type}
                  </div>
                  <div>
                    <span class="font-bold">Label:</span> {param.label}
                  </div>
                  <div>
                    <span class="font-bold">Required:</span>{" "}
                    {param.required.toString()}
                  </div>
                  <div
                    class="absolute px-2 top-2 right-2 hover:bg-gray-300 rounded-xl font-bold"
                    onClick={(e) =>
                      handleProjectMenuClicked(e, parameterIndex())
                    }
                  >
                    X
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      {addingParameter() && (
        <ParameterModal
          actionTitle="Add Parameter"
          closeModal={() => setAddingParameter(false)}
          modalAction={addParameter}
        />
      )}
      {parameterIndexToEdit() !== null && (
        <ParameterModal
          actionTitle="Edit Parameter"
          closeModal={() => setParameterIndexToEdit(null)}
          modalAction={async (parameter) => {
            editParameter(parameterIndexToEdit(), parameter);
          }}
          initialData={{
            key: eligibilityCheck().parameters[parameterIndexToEdit()].key,
            type: eligibilityCheck().parameters[parameterIndexToEdit()].type,
            label: eligibilityCheck().parameters[parameterIndexToEdit()].label,
            required:
              eligibilityCheck().parameters[parameterIndexToEdit()].required,
          }}
        />
      )}
      {parameterIndexToRemove() !== null && (
        <ConfirmationModal
          confirmationTitle="Remove Parameter"
          confirmationText="Are you sure you want to remove this parameter? This action cannot be undone."
          callback={() => removeParameter(parameterIndexToRemove())}
          closeModal={() => setParameterIndexToRemove(null)}
        />
      )}
    </div>
  );
};

export default ParametersConfiguration;
