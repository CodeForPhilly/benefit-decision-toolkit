import { For, onMount } from "solid-js";
import { createStore } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType } from "./types";

const ProjectBenefits = ({ projectId }: { projectId: string }) => {
  const [projectBenefits, setProjectBenefits] = createStore<ProjectBenefitsType>({ benefits: [] });

  onMount(async () => {
    addNewBenefit();
    addNewBenefit();
    addNewBenefit();
    addNewBenefit();
    addNewBenefit();
  });

  const addNewBenefit = () => {
    const newBenefit = {
      id: crypto.randomUUID(),
      name: "New Benefit",
      description: "Description of the new benefitfsafasdfasdfasdfasdfasdf asdasdfsafasdfasdfasfdas dfsadfasdfa sdfasdfasfasfdafdasfdasfd",
      checks: [],
    };
    setProjectBenefits("benefits", (benefits) => [...benefits, newBenefit]);
  }

  return (
    <div class="p-5">
      <div
        class="
          bg-gray-100 p-4 mb-2
          border-2 border-gray-300 rounded-lg
          grid gap-4 justify-items-center
          grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        <For each={projectBenefits.benefits}>
          {(benefit) => {
            const subChecksClass = benefit.checks.length > 0 ? "" : "text-red-900";

            return (
              <div class="w-full flex justify-center">
                <div class="max-w-lg bg-gray-300 hover:brightness-95 p-4 m-2 rounded-lg flex-1">
                  <div class="text-2xl mb-3">{benefit.name}</div>
                  <div>Id: {benefit.id}</div>
                  <div>Description: {benefit.description}</div>
                  <div class={subChecksClass}>Sub-Checks: {benefit.checks.length}</div>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <div
        class="
          inline-block px-3 py-2 bg-gray-200 hover:brightness-95 cursor-pointer select-none
          border-2 border-gray-300 rounded-lg hover:scale-[105%] active:scale-100"
        onClick={addNewBenefit}
      >
        Add new benefit
      </div>
    </div>
  );
}
export default ProjectBenefits;
