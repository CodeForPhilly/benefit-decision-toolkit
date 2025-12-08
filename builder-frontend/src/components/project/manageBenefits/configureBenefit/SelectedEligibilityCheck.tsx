import { Accessor, createSignal, For, Show } from "solid-js";

import ConfigureCheckModal from "./modals/ConfigureCheckModal";

import { titleCase } from "@/utils/title_case";

import type {
  CheckConfig,
  ParameterDefinition,
  ParameterValues,
} from "@/types";

interface ParameterWithConfiguredValue {
  parameter: ParameterDefinition;
  value: string | number | boolean | string[] | undefined;
}

const SelectedEligibilityCheck = ({
  checkId,
  checkConfig,
  onRemove,
  updateCheckConfigParams,
}: {
  checkId: Accessor<string>;
  checkConfig: Accessor<CheckConfig>;
  updateCheckConfigParams: (newCheckData: ParameterValues) => void;
  onRemove: () => void | null;
}) => {
  const [configuringCheckModalOpen, setConfiguringCheckModalOpen] =
    createSignal(false);

  const unfilledRequiredParameters = () => {
    return [];
  };

  return (
    <>
      <div
        onClick={() => {
          setConfiguringCheckModalOpen(true);
        }}
        class="
            mb-4 p-4 cursor-pointer select-none relative
            border-2 border-gray-200 rounded-lg hover:bg-gray-200"
      >
        <Show when={onRemove !== null}>
          <div
            class="absolute px-2 top-2 right-2 hover:bg-gray-300 rounded-xl font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            X
          </div>
        </Show>
        <div class="text-xl font-bold mb-2">
          {titleCase(checkConfig().checkName)} - {checkConfig().checkVersion}
        </div>
        <div class="pl-2 [&:has(+div)]:mb-2">
          {checkConfig().checkDescription}
        </div>
        {
          // Place to display information about expected inputs for check
        }
        {checkConfig().parameterDefinitions &&
          checkConfig().parameterDefinitions.length > 0 && (
            <div class="[&:has(+div)]:mb-2">
              <div class="text-lg font-bold pl-2">Parameters</div>
              <For each={checkConfig().parameterDefinitions}>
                {(parameter: ParameterDefinition) => {
                  const getLabel = () => {
                    let value = checkConfig().parameters[parameter.key];
                    return value !== undefined ? (
                      value.toString()
                    ) : (
                      <span class="text-yellow-700">Not configured</span>
                    );
                  };
                  return (
                    <div class="flex gap-2 pl-4">
                      <div>{titleCase(parameter.key)}:</div>
                      <div>{getLabel()}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        {unfilledRequiredParameters().length > 0 && (
          <div class="mt-2 text-yellow-700 font-bold">
            Warning: This check has required parameter(s) that are not
            configured. Click here to edit.
          </div>
        )}
      </div>

      {configuringCheckModalOpen() && (
        <ConfigureCheckModal
          checkConfig={checkConfig}
          updateCheckConfigParams={updateCheckConfigParams}
          closeModal={() => {
            setConfiguringCheckModalOpen(false);
          }}
        />
      )}
    </>
  );
};
export default SelectedEligibilityCheck;
