import { Accessor, createSignal, For } from "solid-js";

import ConfigureCheckModal from "./modals/ConfigureCheckModal";

import { titleCase } from "@/utils/title_case";

import type {
  CheckConfig,
  EligibilityCheck,
  ParameterDefinition,
  ParameterValues,
} from "@/types";

interface ParameterWithConfiguredValue {
  parameter: ParameterDefinition;
  value: string | number | boolean | string[] | undefined;
}

const SelectedEligibilityCheck = (
  { check, checkConfig, onRemove, updateCheckConfigParams }:
  {
    check: EligibilityCheck;
    checkConfig: Accessor<CheckConfig>;
    onRemove: () => void;
    updateCheckConfigParams: (newCheckData: ParameterValues) => void
  }
) => {
  const [configuringCheckModalOpen, setConfiguringCheckModalOpen] = createSignal(false);

  const checkParameters: Accessor<ParameterWithConfiguredValue[]> = () => check.parameters.map((param) => {
    return { parameter: param, value: checkConfig().parameters[param.key]! };
  });

  const unfilledRequiredParameters = () => {
    return [];
  };
  // const unfilledRequiredParameters = () => {return check.parameters.filter(
  //   (param) => param.required && param.value === undefined
  // )};

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
        <div
          class="absolute px-2 top-2 right-2 hover:bg-gray-300 rounded-xl font-bold"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          X
        </div>
        <div class="text-xl font-bold mb-2">{titleCase(check.name)}</div>
        <div class="pl-2 [&:has(+div)]:mb-2">{check.description}</div>

        {check.inputs.length > 0 && (
          <div class="[&:has(+div)]:mb-2">
            <div class="text-lg font-bold pl-2">Inputs</div>
            <For each={check.inputs}>
              {(input) => (
                <div class="flex gap-2 pl-4">
                  <div>{titleCase(input.key)}:</div>
                  <div>"{input.prompt}"</div>
                </div>
              )}
            </For>
          </div>
        )}
        {checkParameters().length > 0 && (
          <div class="[&:has(+div)]:mb-2">
            <div class="text-lg font-bold pl-2">Parameters</div>
            <For each={checkParameters()}>
              {({ parameter, value }: ParameterWithConfiguredValue) => {
                const getLabel = () => {
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
          check={check}
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
