import { createSignal, For, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import AddNewBenefitModal from "./AddNewBenefitModal";
import ConfirmationModal from "../../ConfirmationModal";

import type { ProjectBenefits as ProjectBenefitsType } from "../types";


const ProjectBenefits = (
  { projectBenefits, setProjectBenefits, setBenefitIndexToConfigure }:
  {
    projectBenefits: ProjectBenefitsType
    setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
    setBenefitIndexToConfigure: Setter<null | number>;
  }
) => {
  const [addingNewBenefit, setAddingNewBenefit] = createSignal<boolean>(false);
  const [benefitIndexToRemove, setBenefitIndexToRemove] = createSignal<null | number>(null);

  const removeBenefit = (benefitIndex: number) => {
    setProjectBenefits(
      "benefits",
      (benefits) => {
        const updatedList = [ ...benefits ];
        updatedList.splice(benefitIndex, 1);
        return [ ...updatedList ]
      }
    );
  }

  return (
    <div class="p-5">
      <div class="text-3xl font-bold mb-2 tracking-wide">
        Manage Benefits
      </div>
      <div class="text-lg mb-3">
        Define and organize the benefits available in your screener.
        Each benefit can have associated sub-checks.
      </div>
      <div
        class="btn-default btn-blue mb-3"
        onClick={() => {setAddingNewBenefit(true)}}
      >
        + Add New Benefit
      </div>
      <div
        class="
          grid gap-4 justify-items-center
          grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        <For each={projectBenefits.benefits}>
          {(benefit, benefit_idx) => {
            const subChecksClass = benefit.checks.length > 0 ? "" : "text-red-900";

            return (
              <div class="w-full flex">
                <div
                  class="
                    max-w-lg flex-1 flex flex-col
                    border-1 border-gray-300 rounded-lg"
                >
                  <div
                    id={"benefit-card-details-" + benefit.id}
                    class="p-4 border-bottom border-gray-300 flex-1"
                  >
                    <div class="text-2xl mb-2 font-bold tracking-wide">
                      {benefit.name}
                    </div>
                    <div>
                      <span class="font-bold">Description:</span> {benefit.description}
                    </div>
                    <div class={subChecksClass}>
                      <span class="font-bold">Sub-Checks:</span> {benefit.checks.length}
                    </div>
                  </div>
                  <div
                    id={"benefit-card-actions-" + benefit.id}
                    class="p-4 flex justify-end space-x-2"
                  >
                    <div
                      class="btn-default btn-gray"
                      onClick={() => { setBenefitIndexToConfigure(benefit_idx); } }
                    >
                      Edit
                    </div>
                    <div
                      class="btn-default btn-red"
                      onClick={() => { setBenefitIndexToRemove(benefit_idx); } }
                    >
                      Remove
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      {
        addingNewBenefit() &&
        <AddNewBenefitModal setAddingNewBenefit={setAddingNewBenefit} setProjectBenefits={setProjectBenefits} />
      }
      {
        benefitIndexToRemove() !== null &&
        <ConfirmationModal
          confirmationTitle="Remove Benefit"
          confirmationText="Are you sure you want to remove this benefit? This action cannot be undone."
          callback={() => {
            console.log("Confirmed removal of benefit");
            removeBenefit(benefitIndexToRemove());
          }}
          closeModal={() => { setBenefitIndexToRemove(null); }}
        />
      }
    </div>
  )
};
export default ProjectBenefits;