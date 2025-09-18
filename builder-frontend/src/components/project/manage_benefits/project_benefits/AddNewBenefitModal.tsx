import { createStore, SetStoreFunction } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType } from "../types";


type NewBenefitValues = {
  name: string;
  description: string;
}

const AddNewBenefitPopup = (
  { setProjectBenefits, setAddingNewBenefit }:
  { setProjectBenefits: SetStoreFunction<ProjectBenefitsType>; setAddingNewBenefit: (value: boolean) => void }
) => {
  const [newBenefit, setNewBenefit] = createStore<NewBenefitValues>({ name: "", description: "" });

  const addNewBenefit = () => {
    const benefitToAdd = {
      id: crypto.randomUUID(),
      name: newBenefit.name,
      description: newBenefit.description,
      checks: [],
    };
    setProjectBenefits("benefits", (benefits) => [...benefits, benefitToAdd]);
  }

  return (
    <div
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl mb-4">Add New Benefit</div>
        <div class="mb-4">
          <label class="block mb-2">Name:</label>
          <input
            type="text"
            class="w-full border border-gray-300 rounded px-3 py-2"
            value={newBenefit.name}
            onInput={(e) => setNewBenefit("name", e.currentTarget.value)}
            placeholder="Enter benefit name"
          />
        </div>
        <div class="mb-4">
          <label class="block mb-2">Description:</label>
          <textarea
            class="w-full border border-gray-300 rounded px-3 py-2"
            value={newBenefit.description}
            onInput={(e) => setNewBenefit("description", e.currentTarget.value)}
            placeholder="Enter benefit description"
            rows={4}
          />
        </div>
        <div class="flex justify-end space-x-4">
          <button
            class="px-4 py-2 bg-gray-300 hover:brightness-95 rounded"
            onClick={() => {
              setAddingNewBenefit(false);
            }}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white hover:brightness-95 rounded"
            disabled={newBenefit.name.trim() === "" || newBenefit.description.trim() === ""}
            onClick={() => {
              if (newBenefit.name.trim() === "" || newBenefit.description.trim() === "") {
                console.log("Please fill in all fields.");
                return;
              }
              addNewBenefit();
              setAddingNewBenefit(false);
            }}
          >
            Add Benefit
          </button>
        </div>
      </div>
    </div>
  );
}
export default AddNewBenefitPopup;
