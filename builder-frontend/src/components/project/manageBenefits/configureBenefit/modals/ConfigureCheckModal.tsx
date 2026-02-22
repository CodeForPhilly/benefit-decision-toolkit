import { Accessor, For, createSignal } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

import { titleCase } from "@/utils/title_case";

import type {
  CheckConfig,
  ParameterDefinition,
  ParameterValues,
  BooleanParameter,
} from "@/types";

const ConfigureCheckModal = ({
  checkConfig,
  updateCheckConfigParams,
  closeModal,
}: {
  checkConfig: Accessor<CheckConfig>;
  updateCheckConfigParams: (newCheckData: ParameterValues) => void;
  closeModal: () => void;
}) => {
  const [tempCheck, setTempCheck] = createStore<CheckConfig>({
    checkId: checkConfig().checkId,
    checkName: checkConfig().checkName,
    checkVersion: checkConfig().checkVersion,
    checkModule: checkConfig().checkModule,
    checkDescription: checkConfig().checkDescription,
    evaluationUrl: checkConfig().evaluationUrl,
    parameterDefinitions: checkConfig().parameterDefinitions,
    inputDefinition: checkConfig().inputDefinition,
    parameters: { ...checkConfig().parameters },
  });

  const confirmAndClose = () => {
    updateCheckConfigParams(tempCheck.parameters);
    closeModal();
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <div class="text-2xl mb-4">
          Configure Check: {titleCase(checkConfig().checkName)}
        </div>

        {checkConfig().parameterDefinitions.length === 0 && (
          <div class="mb-4">This check has no configurable parameters.</div>
        )}
        {checkConfig().parameterDefinitions.length > 0 && (
          <div class="mb-4">
            <div class="text-lg font-bold mb-2">Parameters</div>
            <div class="flex flex-col gap-4">
              <For each={checkConfig().parameterDefinitions}>
                {(parameter) => {
                  return (
                    <div class="pl-2">
                      <div class="mb-2 font-bold">
                        {titleCase(parameter.key)}{" "}
                        {parameter.required && <span class="text-red-600">*</span>}
                      </div>
                      <div class="pl-2">
                        <ParameterInput
                          tempCheck={() => tempCheck}
                          setTempCheck={setTempCheck}
                          parameter={() => parameter}
                        />
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}

        <div class="flex justify-end space-x-2">
          <div class="btn-default btn-gray" onClick={closeModal}>
            Cancel
          </div>
          <div class="btn-default btn-blue" onClick={confirmAndClose}>
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
};

const ParameterInput = ({
  tempCheck,
  setTempCheck,
  parameter,
}: {
  tempCheck: Accessor<CheckConfig>;
  setTempCheck: SetStoreFunction<CheckConfig>;
  parameter: Accessor<ParameterDefinition>;
}) => {
  const parameterKey = () => parameter().key;
  const parameterType = () => parameter().type;

  const onParameterChange = (newValue: any) => {
    setTempCheck("parameters", parameterKey(), newValue);
  };

  if (parameter().type === "number") {
    return (
      <ParameterNumberInput
        onParameterChange={onParameterChange}
        currentValue={() => tempCheck().parameters[parameterKey()]}
      />
    );
  } else if (parameterType() === "string") {
    return (
      <ParameterStringInput
        onParameterChange={onParameterChange}
        currentValue={() => tempCheck().parameters[parameterKey()]}
      />
    );
  } else if (parameterType() === "boolean") {
    return (
      <ParameterBooleanInput
        onParameterChange={onParameterChange}
        parameter={parameter as Accessor<BooleanParameter>}
        currentValue={() => tempCheck().parameters[parameterKey()]}
      />
    );
  } else if (parameterType() === "date") {
    return (
      <ParameterDateInput
        onParameterChange={onParameterChange}
        currentValue={() => tempCheck().parameters[parameterKey()]}
      />
    );
  } else if (parameterType() === "array") {
    /* TODO: Support arrays of other types besides String */
    return (
      <ParameterMultiStringInput
        onParameterChange={onParameterChange}
        currentValue={() => tempCheck().parameters[parameterKey()] as string[] | undefined}
      />
    );
  }
  return <div>Unsupported parameter type: {parameterType()}</div>;
};

const ParameterNumberInput = ({
  onParameterChange,
  currentValue,
}: {
  onParameterChange: (value: any) => void;
  currentValue: Accessor<any>;
}) => {
  return (
    <>
      <input
        onInput={(e) => {
          onParameterChange(Number(e.target.value));
        }}
        value={currentValue()}
        type="number"
        class="form-input-custom"
      />
    </>
  );
};

const ParameterStringInput = ({
  onParameterChange,
  currentValue,
}: {
  onParameterChange: (value: any) => void;
  currentValue: Accessor<any>;
}) => {
  return (
    <>
      <input
        onInput={(e) => {
          onParameterChange(e.target.value);
        }}
        type="text"
        value={currentValue() ?? ""}
        class="form-input-custom"
      />
    </>
  );
};

const ParameterBooleanInput = ({
  onParameterChange,
  parameter,
  currentValue,
}: {
  onParameterChange: (value: any) => void;
  parameter: Accessor<BooleanParameter>;
  currentValue: Accessor<any>;
}) => {
  return (
    <>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter().key}`}
            checked={currentValue() === true}
            onInput={() => onParameterChange(true)}
            class="form-radio"
          />
          True
        </div>
        <div class="flex items-center gap-2">
          <input
            type="radio"
            name={`param-${parameter().key}`}
            checked={currentValue() === false}
            onInput={() => onParameterChange(false)}
            class="form-radio"
          />
          False
        </div>
        {currentValue() === undefined && (
          <span class="ml-2 text-gray-500">Not set</span>
        )}
      </div>
    </>
  );
};

const ParameterDateInput = ({
  onParameterChange,
  currentValue,
}: {
  onParameterChange: (value: any) => void;
  currentValue: Accessor<any>;
}) => {
  return (
    <>
      <input
        onInput={(e) => {
          onParameterChange(e.target.value);
        }}
        type="date"
        value={currentValue() ?? ""}
        class="form-input-custom"
      />
    </>
  );
};

const ParameterMultiStringInput = ({
  onParameterChange,
  currentValue,
}: {
  onParameterChange: (value: string[]) => void;
  currentValue: Accessor<string[] | undefined>;
}) => {
  const [inputValue, setInputValue] = createSignal("");

  const values = () => currentValue() ?? [];

  const addValue = () => {
    const trimmed = inputValue().trim();
    if (trimmed && !values().includes(trimmed)) {
      onParameterChange([...values(), trimmed]);
      setInputValue("");
    }
  };

  const removeValue = (index: number) => {
    onParameterChange(values().filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <>
      {/* Chip display */}
      <div class="flex flex-wrap gap-2 mb-2">
        <For each={values()}>
          {(value, index) => (
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-sm">
              {value}
              <button
                type="button"
                onClick={() => removeValue(index())}
                class="hover:text-red-600 cursor-pointer"
              >
                &times;
              </button>
            </span>
          )}
        </For>
      </div>

      {/* Input for adding new values */}
      <div class="flex gap-2">
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter to add"
          class="form-input-custom flex-1"
        />
        <div onClick={addValue} class="btn-default btn-blue">
          Add
        </div>
      </div>
    </>
  );
};

export default ConfigureCheckModal;
