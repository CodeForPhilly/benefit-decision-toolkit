import { createStore } from "solid-js/store"

import type { BenefitDetail } from "@/types";


type NewBenefitValues = {
  name: string;
  description: string;
}
const AddNewBenefitModal = (
  { addNewBenefit, closeModal }:
  { addNewBenefit: (benefit: BenefitDetail) => Promise<void>; closeModal: () => void }
) => {
  const [newBenefit, setNewBenefit] = createStore<NewBenefitValues>({ name: "", description: "" });

  // Styling for the Add button based on whether fields are filled
  const isAddDisabled = () => {
    return newBenefit.name.trim() === "" || newBenefit.description.trim() === "";
  }
  const addButtonClasses = () => {
    return isAddDisabled() ? "opacity-50 cursor-not-allowed" : "hover:bg-sky-700";
  }

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl font-bold mb-4">Create New Benefit</div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Name:</label>
          <input
            type="text"
            class="w-full border border-gray-300 rounded px-3 py-2"
            value={newBenefit.name}
            onInput={(e) => setNewBenefit("name", e.currentTarget.value)}
            placeholder="Enter benefit name"
          />
        </div>
        <div class="mb-4">
          <label class="block font-bold mb-2">Description:</label>
          <textarea
            class="w-full border border-gray-300 rounded px-3 py-2"
            value={newBenefit.description}
            onInput={(e) => setNewBenefit("description", e.currentTarget.value)}
            placeholder="Enter benefit description"
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
              const benefitToAdd = {
                id: crypto.randomUUID(),
                name: newBenefit.name,
                description: newBenefit.description,
                isPublic: false,
              };
              await addNewBenefit(benefitToAdd);
              closeModal();
            }}
          >
            Add Benefit
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddNewBenefitModal;
