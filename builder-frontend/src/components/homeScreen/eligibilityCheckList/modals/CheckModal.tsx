import { createStore } from "solid-js/store";

import type { CreateCheckRequest } from "@/types";

type CheckValues = {
  name: string;
  module: string;
  description: string;
};
const EditCheckModal = ({
  modalAction,
  closeModal,
}: {
  modalAction: (check: CreateCheckRequest) => Promise<void>;
  closeModal: () => void;
}) => {
  const [newCheck, setNewCheck] = createStore<CheckValues>({
    name: "",
    module: "",
    description: "",
  });

  // Styling for the Add button based on whether fields are filled
  const isAddDisabled = () => {
    return (
      newCheck.name.trim() === "" ||
      newCheck.description.trim() === "" ||
      newCheck.module.trim() === ""
    );
  };
  const addButtonClasses = () => {
    return isAddDisabled()
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-sky-700";
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl font-bold mb-4">Create New Check</div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Name:</label>
          <input
            type="text"
            class="form-input w-full border border-gray-300 rounded px-3 py-2"
            value={newCheck.name}
            onInput={(e) => setNewCheck("name", e.currentTarget.value)}
            placeholder="Enter check name"
          />
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Module:</label>
          <input
            type="text"
            class="form-input w-full border border-gray-300 rounded px-3 py-2"
            value={newCheck.module}
            onInput={(e) => setNewCheck("module", e.currentTarget.value)}
            placeholder="Enter check module"
          />
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Description:</label>
          <textarea
            class="w-full border border-gray-300 rounded px-3 py-2"
            value={newCheck.description}
            onInput={(e) => setNewCheck("description", e.currentTarget.value)}
            placeholder="Enter check description"
            rows={4}
          />
        </div>
        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={() => {
              closeModal();
            }}
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
              const check: CreateCheckRequest = {
                name: newCheck.name,
                module: newCheck.module,
                description: newCheck.description,
                parameterDefinitions: [],
              };
              await modalAction(check);
              closeModal();
            }}
          >
            Add Check
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditCheckModal;
