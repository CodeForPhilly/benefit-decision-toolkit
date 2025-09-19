import { createSignal, For, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import { ProjectBenefits as ProjectBenefitsType } from "../types";
import AddNewBenefitModal from "./AddNewBenefitModal";
import ConfirmationModal from "../../ConfirmationModal";


const ProjectBenefits = (
  { projectBenefits, setProjectBenefits, setBenefitIdToConfigure }:
  {
    projectBenefits: ProjectBenefitsType
    setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
    setBenefitIdToConfigure: Setter<null | string>;
  }
) => {
  const [addingNewBenefit, setAddingNewBenefit] = createSignal<boolean>(false);
  const [benefitIdToRemove, setBenefitIdToRemove] = createSignal<null | string>(null);

  const removeBenefit = (benefitId: string) => {
    setProjectBenefits(
      "benefits",
      (benefits) => benefits.filter(benefit => benefit.id !== benefitId)
    );
  }

  return (
    <div class="p-5">
      <div class="text-3xl font-bold mb-2">
        Manage Benefits
      </div>
      <div class="text-lg mb-3">
        Define and organize the benefits available in your screener.
        Each benefit can have associated sub-checks.
      </div>
      <div
        class="btn-default bg-sky-600 hover:bg-sky-700 text-white mb-3"
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
          {(benefit) => {
            const subChecksClass = benefit.checks.length > 0 ? "" : "text-red-900";

            return (
              <div class="w-full flex">
                <div
                  class="
                    max-w-lg rounded-lg flex-1 flex flex-col
                    border-2 border-gray-300"
                >
                  <div class="p-4 border-bottom border-gray-300 flex-1">
                    <div class="text-2xl mb-3 font-bold">{benefit.name}</div>
                    <div>Id: {benefit.id}</div>
                    <div>Description: {benefit.description}</div>
                    <div class={subChecksClass}>Sub-Checks: {benefit.checks.length}</div>
                  </div>
                  <div class="p-4 flex justify-end space-x-2">
                    <div
                      class="btn-default hover:bg-gray-200"
                      onClick={() => { setBenefitIdToConfigure(benefit.id); } }
                    >
                      Edit
                    </div>
                    <div
                      class="btn-default bg-red-800 hover:bg-red-900 text-white"
                      onClick={() => { setBenefitIdToRemove(benefit.id); } }
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
        benefitIdToRemove() &&
        <ConfirmationModal
          confirmationTitle="Remove Benefit"
          confirmationText="Are you sure you want to remove this benefit? This action cannot be undone."
          callback={() => {
            console.log("Confirmed removal of benefit");
            removeBenefit(benefitIdToRemove());
          }}
          closeModal={() => { setBenefitIdToRemove(null); }}
        />
      }
    </div>
  )
};
export default ProjectBenefits;