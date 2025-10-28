import { createResource } from "solid-js";

import { fetchPublicBenefits } from "@/api/benefit";

import type { Benefit } from "@/types";


const SelectExistingBenefitModal = (
  { copyPublicBenefit, closeModal }:
  { copyPublicBenefit: (benefitId: string) => Promise<void>; closeModal: () => void }
) => {
  const [availableBenefits] = createResource<Benefit[]>(fetchPublicBenefits);

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
            <div class="text-red-600">
              Error loading benefits: {availableBenefits.error.message}
            </div>
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
                      onClick={async () => {
                        await copyPublicBenefit(benefit.id);
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
