import { Accessor, For, useContext } from "solid-js";

import { CheckConfigurationContext } from "../../contexts";
import { titleCase } from "../../../../../utils/title_case";

import type { BooleanParameter, EligibilityCheck, NumberParameter, ParameterDefinition, StringParameter } from "../../types";
import { createStore, SetStoreFunction } from "solid-js/store";


const ConfigureCheckModal = (
  { check, checkIndex, updateCheck, closeModal }:
  {
    check: EligibilityCheck;
    checkIndex: number
    updateCheck: (checkIndex: number, newCheckData: EligibilityCheck) => void;
    closeModal: () => void
  }
) => {
  const [tempCheck, setTempCheck] = createStore<EligibilityCheck>({ ...check, parameters: check.parameters.map(p => ({ ...p })) });

  const confirmAndClose = () => {
    updateCheck(checkIndex, { ...tempCheck });
    closeModal();
  }

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl mb-4">Configure Check: {titleCase(check.id)}</div>

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
                {(parameter, parameterIndex) => {
                  return (
                    <ParameterInput
                      setTempCheck={setTempCheck}
                      parameter={parameter}
                      parameterIndex={parameterIndex}
                    />
                  );
                }}
              </For>
            </div>
          </div>
        )}

        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={closeModal}
          >
            Cancel
          </div>
          <div
            class="btn-default hover:bg-gray-200"
            onClick={confirmAndClose}
          >
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
}

const ParameterInput = (
  { setTempCheck, parameter, parameterIndex }:
  { setTempCheck: SetStoreFunction<EligibilityCheck>, parameter: ParameterDefinition, parameterIndex: Accessor<number> }
) => {
  const onParameterChange = (newValue: number) => {
    setTempCheck(
      "parameters", parameterIndex(),
      "value", newValue
    );
  }

  if (parameter.type === "number") {
    return <ParameterNumberInput onParameterChange={onParameterChange} parameter={parameter} />;
  } else if (parameter.type === "string") {
    return <ParameterStringInput onParameterChange={onParameterChange} parameter={parameter} />;
  } else if (parameter.type === "boolean") {
    return <ParameterBooleanInput onParameterChange={onParameterChange} parameter={parameter} />;
  }
  return <div>Unsupported parameter type: {parameter.type}</div>;
}

const ParameterNumberInput = (
  { onParameterChange, parameter }:
  { onParameterChange: (value: any) => void, parameter: NumberParameter }
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
        value={parameter.value}
        type="number"
      />
    </div>
  );
}

const ParameterStringInput = (
  { onParameterChange, parameter }:
  { onParameterChange: (value: any) => void, parameter: StringParameter }
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
        value={parameter.value ?? ""}
      />
    </div>
  );
}

const ParameterBooleanInput = (
  { onParameterChange, parameter }:
  { onParameterChange: (value: any) => void, parameter: BooleanParameter }
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
            checked={parameter.value === true}
            onInput={() => onParameterChange(true)}
          />
          True
        </div>
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter.key}`}
            checked={parameter.value === false}
            onInput={() => onParameterChange(false)}
          />
          False
        </div>
        {
          parameter.value === undefined &&
          <span class="ml-2 text-gray-500">Not set</span>
        }
      </div>
    </div>
  );
}

export default ConfigureCheckModal;
