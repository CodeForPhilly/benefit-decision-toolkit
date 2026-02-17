import { createStore } from "solid-js/store"

import type { ParameterDefinition } from "@/types";


type ParamValues = {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "date";
}
const ParameterModal = (
  { actionTitle, modalAction, closeModal, initialData }:
  { actionTitle: string, modalAction: (parameter: ParameterDefinition) => Promise<void>; closeModal: () => void, initialData?: ParamValues }
) => {
  const [newParam, setNewParam] = createStore<ParamValues>(initialData || { key: "", type: "string", label: "", required: undefined });

  // Styling for the Add button based on whether fields are filled
  const isAddDisabled = () => {
    return (
      newParam.key.trim() === "" ||
      newParam.label.trim() === ""
    );
  }
  const addButtonClasses = () => {
    return isAddDisabled() ? "opacity-50 cursor-not-allowed" : "hover:bg-sky-700";
  }

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl font-bold mb-4">{actionTitle}</div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Key:</label>
          <input
            type="text"
            class="form-input w-full border border-gray-300 rounded px-3 py-2"
            value={newParam.key}
            onInput={(e) => setNewParam("key", e.currentTarget.value)}
            placeholder="Enter parameter key"
          />
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Label:</label>
          <input
            type="text"
            class="form-input w-full border border-gray-300 rounded px-3 py-2"
            value={newParam.label}
            onInput={(e) => setNewParam("label", e.currentTarget.value)}
            placeholder="Enter parameter label"
          />
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Type:</label>
          <select
            class="form-input w-full border border-gray-300 rounded px-3 py-2"
            value={newParam.type}
            onChange={(e) => setNewParam("type", e.currentTarget.value as "string" | "number" | "boolean" | "date")}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Required:</label>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <input
                type="radio"
                name={`param-required`}
                checked={newParam.required === true}
                onInput={() => setNewParam("required", true)}
                class="form-radio"
              />
              True
            </div>
            <div class="flex items-center gap-2">
              <input
                type="radio"
                name={`param-required`}
                checked={newParam.required === false}
                onInput={() => setNewParam("required", false)}
                class="form-radio"
              />
              False
            </div>
            {
              newParam.required === undefined &&
              <span class="ml-2 text-gray-500">Not set</span>
            }
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={() => { closeModal(); }}
          >
            Cancel
          </div>
          <div
            class={"btn-default bg-sky-600 text-white " + addButtonClasses()}
            onClick={async () => {
              if (isAddDisabled()) {
                console.log("Please fill in all fields.");
                return;
              }
              const parameter: ParameterDefinition = {
                key: newParam.key,
                label: newParam.label,
                type: newParam.type,
                required: newParam.required
              };
              await modalAction(parameter);
              closeModal();
            }}
          >
            {actionTitle}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ParameterModal;
