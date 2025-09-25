import { createResource } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import { getAllAvailableBenefits } from "../../../../api/fake_benefit_endpoints";

import type { Benefit, ProjectBenefits as ProjectBenefitsType } from "../types";


const SelectExistingBenefitModal = (
  { setProjectBenefits, closeModal }:
  { setProjectBenefits: SetStoreFunction<ProjectBenefitsType>; closeModal: () => void }
) => {
  const [availableBenefits] = createResource<Benefit[]>(getAllAvailableBenefits);
  
  return (
    <div
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white px-8 py-6 rounded-xl max-w-140 w-1/2 min-w-80">
        <div class="text-2xl mb-4">Select Existing Benefit</div>
        <div class="mb-4">
          {availableBenefits.loading && (
            <div>Loading available benefits...</div>
          )}
          {availableBenefits.error && (
            <div class="text-red-600">Error loading benefits: {availableBenefits.error.message}</div>
          )}
          {availableBenefits() && availableBenefits().length === 0 && (
            <div>No available benefits found.</div>
          )}
          {availableBenefits() && availableBenefits().length > 0 && (
            <div class="space-y-4 max-h-96 overflow-y-auto border rounded-xl p-4">
              {availableBenefits().map((benefit) => (
                <div class="border p-4 rounded-lg">
                  <div class="mb-2">
                    <div class="font-bold text-lg">{benefit.name}</div>
                    <div>{benefit.description}</div>
                    <div class="text-sm text-gray-600">Sub-Checks: {benefit.checks.length}</div>
                  </div>
                  <div>
                    <div
                      class="btn-default btn-gray"
                      onClick={() => {
                        const benefitToAdd = structuredClone(benefit);
                        
                        // Ensure the new benefit has a unique ID
                        benefitToAdd.id = crypto.randomUUID();
                        setProjectBenefits("benefits", (benefits) => [...benefits, benefitToAdd]);
                        closeModal();
                      }}
                    >
                      Add copy of this benefit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div class="flex justify-end space-x-2">
          <div
            class="btn-default hover:bg-gray-200"
            onClick={() => {
              closeModal();
            }}
          >
            Close
          </div>
        </div>
      </div>
    </div>
  );
}
export default SelectExistingBenefitModal;
