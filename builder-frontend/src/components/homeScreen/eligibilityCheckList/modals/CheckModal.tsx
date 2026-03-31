import { createStore } from "solid-js/store";

import type { CreateCheckRequest } from "@/types";
import { JSX } from "solid-js";

type CheckValues = {
  name: string;
  module: string;
  description: string;
};

interface Props {
  onAddCheck: (check: CreateCheckRequest) => Promise<void>;
  onClose: () => void;
}

const EditCheckModal = (props: Props) => {
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

  const handleAddCheck: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
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
    try {
      await props.onAddCheck(check);
      props.onClose();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <div class="text-2xl font-bold mb-4">Create New Check</div>
      <form onSubmit={handleAddCheck}>
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

        <button
          type="submit"
          class={"btn-default bg-sky-600 text-white " + addButtonClasses()}
        >
          Add Check
        </button>
      </form>
    </div>
  );
};
export default EditCheckModal;
