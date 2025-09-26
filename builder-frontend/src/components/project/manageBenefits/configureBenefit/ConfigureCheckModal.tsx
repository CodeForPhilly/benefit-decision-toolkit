import { Accessor, For, useContext } from "solid-js";

import { BenefitConfigurationContext, CheckConfigurationContext } from "../contexts";
import { titleCase } from "../../../../utils/title_case";

import type { BooleanParameter, NumberParameter, Parameter, StringParameter } from "../types";


const ConfigureCheckModal = (
  { closeModal }: { closeModal: () => void }
) => {
  const { check } = useContext(CheckConfigurationContext);
  
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
                  return <ParameterInput parameter={parameter} parameterIndex={parameterIndex} />;
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
            Close
          </div>
        </div>
      </div>
    </div>
  );
}

const ParameterInput = (
  { parameter, parameterIndex }:
  { parameter: Parameter, parameterIndex: Accessor<number> }
) => {
  if (parameter.type === "number") {
    return <ParameterNumberInput parameter={parameter} parameterIndex={parameterIndex} />;
  } else if (parameter.type === "string") {
    return <ParameterStringInput parameter={parameter} parameterIndex={parameterIndex} />;
  } else if (parameter.type === "boolean") {
    return <ParameterBooleanInput parameter={parameter} parameterIndex={parameterIndex} />;
  }
  return <div>Unsupported parameter type: {parameter.type}</div>;
}

const ParameterNumberInput = (
  { parameter, parameterIndex }:
  { parameter: NumberParameter, parameterIndex: Accessor<number> }
) => {
  const {benefitIndex, setProjectBenefits} = useContext(BenefitConfigurationContext);
  const {checkIndex} = useContext(CheckConfigurationContext);

  const onParameterChange = (newValue: number) => {
    setProjectBenefits(
      "benefits", benefitIndex(),
      "checks", checkIndex(),
      "parameters", parameterIndex(),
      "value", newValue
    );
  }

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
  { parameter, parameterIndex }:
  { parameter: StringParameter, parameterIndex: Accessor<number> }
) => {
  const { benefitIndex, setProjectBenefits } = useContext(BenefitConfigurationContext);
  const { checkIndex } = useContext(CheckConfigurationContext);

  const onParameterChange = (newValue: string) => {
    setProjectBenefits(
      "benefits", benefitIndex(),
      "checks", checkIndex(),
      "parameters", parameterIndex(),
      "value", newValue
    );
  };

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
  { parameter, parameterIndex }:
  { parameter: BooleanParameter, parameterIndex: Accessor<number> }
) => {
  const { benefitIndex, setProjectBenefits } = useContext(BenefitConfigurationContext);
  const { checkIndex } = useContext(CheckConfigurationContext);

  const onParameterChange = (newValue: boolean) => {
    setProjectBenefits(
      "benefits", benefitIndex(),
      "checks", checkIndex(),
      "parameters", parameterIndex(),
      "value", newValue
    );
  };

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
            name={`param-${parameter.key}-${parameterIndex()}`}
            checked={parameter.value === true}
            onInput={() => onParameterChange(true)}
          />
          True
        </div>
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter.key}-${parameterIndex()}`}
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
