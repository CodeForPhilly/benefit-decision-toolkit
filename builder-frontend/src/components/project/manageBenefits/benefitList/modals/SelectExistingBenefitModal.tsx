import { Accessor, createResource } from "solid-js";

import { getAllAvailableBenefits } from "../../../../../api/fake_benefit_endpoints";

import type { Benefit, BenefitDetail } from "../../types";


const SelectExistingBenefitModal = (
  { addNewBenefit, closeModal }:
  { addNewBenefit: (benefit: BenefitDetail) => void; closeModal: () => void }
) => {
  const [availableBenefits] = createResource<Benefit[]>(getAllAvailableBenefits);
  
  return (
    <div
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white px-8 py-6 rounded-xl max-w-180 w-1/2 min-w-80">
        <div class="text-2xl font-bold mb-4">Copy from Existing Benefit</div>
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
            <div
              class="
                max-h-96 space-y-5 py-3 bg-gray-50
                border-2 border-gray-200 rounded-sm
                overflow-y-auto no-scrollbar"
            >
              {availableBenefits().map((benefit) => (
                <div class="border-t-2 border-b-2 border-gray-200 p-4 bg-white">
                  <div class="mb-2">
                    <div class="font-bold text-lg">{benefit.name}</div>
                    <div>{benefit.description}</div>
                    <div class="text-sm text-gray-600">Eligibility Checks: {benefit.checks.length}</div>
                  </div>
                  <div>
                    <div
                      class="btn-default btn-gray"
                      onClick={() => {                        
                        // Ensure the new benefit has a unique ID
                        const benefitToAdd: BenefitDetail = {
                          name: benefit.name,
                          description: benefit.description,
                          id: crypto.randomUUID(),
                          isPublic: false
                        }
                        addNewBenefit(benefitToAdd);
                        closeModal();
                      }}
                    >
                      Copy this benefit
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
