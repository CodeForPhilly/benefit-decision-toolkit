import { Accessor, For } from "solid-js";

import { titleCase } from "../../../../../utils/title_case";

import type { BooleanParameter, CheckConfig, EligibilityCheck, NumberParameter, ParameterDefinition, ParameterValues, StringParameter } from "../../types";
import { createStore, SetStoreFunction } from "solid-js/store";


const ConfigureCheckModal = (
  { checkConfig, check, checkIndex, updateCheckConfigParams, closeModal }:
  {
    checkConfig: CheckConfig;
    check: EligibilityCheck;
    checkIndex: number
    updateCheckConfigParams: (checkIndex: number, newCheckData: ParameterValues) => void;
    closeModal: () => void
  }
) => {
  const [tempCheck, setTempCheck] = createStore<CheckConfig>(
    { checkId: checkConfig.checkId, parameters: checkConfig.parameters }
  );

  const confirmAndClose = () => {
    updateCheckConfigParams(checkIndex, tempCheck.parameters);
    closeModal();
  }

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl mb-4">Configure Check: {titleCase(checkConfig.checkId)}</div>

        {check.parameters.length === 0 && (
          <div class="mb-4">This check has no configurable parameters.</div>
        )}
        {check.parameters.length > 0 && (
          <div class="mb-4">
            <div class="text-lg font-bold mb-2">
              Parameters
            </div>
            <div class="flex flex-col gap-4">
              <For each={check.parameters}>
                {(parameter) => {
                  return (
                    <ParameterInput
                      tempCheck={tempCheck}
                      setTempCheck={setTempCheck}
                      parameter={parameter}
                    />
                  );
                }}
              </For>
            </div>
          </div>
        )}

        <div class="flex justify-end space-x-2">
          <div class="btn-default hover:bg-gray-200" onClick={closeModal}>
            Cancel
          </div>
          <div class="btn-default hover:bg-gray-200" onClick={confirmAndClose}>
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
}

const ParameterInput = (
  { tempCheck, setTempCheck, parameter }:
  { tempCheck: CheckConfig; setTempCheck: SetStoreFunction<CheckConfig>, parameter: ParameterDefinition }
) => {
  const onParameterChange = (newValue: any) => {
    setTempCheck(
      "parameters", parameter.key, newValue
    );
  }

  if (parameter.type === "number") {
    return <ParameterNumberInput onParameterChange={onParameterChange} parameter={parameter} currentValue={tempCheck.parameters[parameter.key]} />;
  } else if (parameter.type === "string") {
    return <ParameterStringInput onParameterChange={onParameterChange} parameter={parameter} currentValue={tempCheck.parameters[parameter.key]} />;
  } else if (parameter.type === "boolean") {
    return <ParameterBooleanInput onParameterChange={onParameterChange} parameter={parameter} currentValue={tempCheck.parameters[parameter.key]} />;
  }
  return <div>Unsupported parameter type: {parameter.type}</div>;
}

const ParameterNumberInput = (
  { onParameterChange, parameter, currentValue }:
  { onParameterChange: (value: any) => void, parameter: NumberParameter, currentValue: any }
) => {
  return (
    <div class="pl-2">
      <div class="mb-2 font-bold">
        {titleCase(parameter.key)} {parameter.required && <span class="text-red-600">*</span>}
      </div>
      <div class="mb-2">
        {parameter.label}
      </div>
      <input
        onInput={(e) => {onParameterChange(Number(e.target.value))}}
        value={currentValue}
        type="number"
      />
    </div>
  );
}

const ParameterStringInput = (
  { onParameterChange, parameter, currentValue }:
  { onParameterChange: (value: any) => void, parameter: StringParameter, currentValue: any }
) => {
  return (
    <div class="pl-2">
      <div class="mb-2 font-bold">
        {titleCase(parameter.key)} {parameter.required && <span class="text-red-600">*</span>}
      </div>
      <div class="mb-2">
        {parameter.label}
      </div>
      <input
        onInput={(e) => { onParameterChange(e.target.value); }}
        type="text"
        value={currentValue ?? ""}
      />
    </div>
  );
}

const ParameterBooleanInput = (
  { onParameterChange, parameter, currentValue }:
  { onParameterChange: (value: any) => void, parameter: BooleanParameter, currentValue: any }
) => {
  return (
    <div class="pl-2">
      <div class="mb-2 font-bold">
        {titleCase(parameter.key)} {parameter.required && <span class="text-red-600">*</span>}
      </div>
      <div class="mb-2">
        {parameter.label}
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter.key}`}
            checked={currentValue === true}
            onInput={() => onParameterChange(true)}
          />
          True
        </div>
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter.key}`}
            checked={currentValue === false}
            onInput={() => onParameterChange(false)}
          />
          False
        </div>
        {
          currentValue === undefined &&
          <span class="ml-2 text-gray-500">Not set</span>
        }
      </div>
    </div>
  );
}

export default ConfigureCheckModal;
