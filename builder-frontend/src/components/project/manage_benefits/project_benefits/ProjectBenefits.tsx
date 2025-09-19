import { createSignal, For, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

import { ProjectBenefits as ProjectBenefitsType } from "../types";
import AddNewBenefitModal from "./AddNewBenefitModal";


const ProjectBenefits = (
  { projectBenefits, setProjectBenefits, setBenefitIdToConfigure }:
  {
    projectBenefits: ProjectBenefitsType
    setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
    setBenefitIdToConfigure: Setter<null | string>;
  }
) => {
  const [addingNewBenefit, setAddingNewBenefit] = createSignal<boolean>(false);

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
        class="
          inline-block px-3 py-2 mb-3
          text-white bg-sky-600 hover:bg-sky-700
          cursor-pointer select-none rounded-lg"
        onClick={() => {setAddingNewBenefit(true)}}
      >
        + Add New Benefit
      </div>
      <div
        class="
          bg-gray-100
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
                    max-w-lg rounded-lg flex-1
                    border-2 border-gray-300"
                >
                  <div
                    class="p-4 border-bottom border-gray-300"
                  >
                    <div class="text-2xl mb-3 font-bold">{benefit.name}</div>
                    <div>Id: {benefit.id}</div>
                    <div>Description: {benefit.description}</div>
                    <div class={subChecksClass}>Sub-Checks: {benefit.checks.length}</div>
                  </div>
                  <div class="p-4 flex justify-end space-x-2">
                    <div
                      class="
                      inline-block px-3 py-2 hover:bg-gray-200
                      border-gray-300 border-2
                      cursor-pointer select-none rounded-lg"
                      onClick={() => { setBenefitIdToConfigure(benefit.id); } }
                    >
                      Edit
                    </div>
                    <div
                      class="
                      inline-block px-3 py-2 bg-red-700 hover:bg-red-800
                      text-white
                      border-gray-500 border-2
                      cursor-pointer select-none rounded-lg"
                      onClick={() => { removeBenefit(benefit.id); } }
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
    </div>
  )
};
export default ProjectBenefits;