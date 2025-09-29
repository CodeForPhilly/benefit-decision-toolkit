import { createSignal, Accessor } from "solid-js";
import { createStore } from "solid-js/store"
import { useParams } from "@solidjs/router";

import ProjectBenefits from "./benefitList/BenefitList";
import ConfigureBenefit from "./configureBenefit/ConfigureBenefit";

import { BenefitConfigurationContext } from "./contexts";
import { handleScreenerApiUpdates } from "./handleScreenerApiUpdates";

import type { ProjectBenefits as ProjectBenefitsType, Benefit } from "./types";


const ManageBenefits = () => {
  const params = useParams();

  const [projectBenefits, setProjectBenefits] = createStore<ProjectBenefitsType>(
    {
      benefits: [{
        id: crypto.randomUUID(),
        name: "Non-Profit Benefit",
        description: "Awesome benefit that a Non-Profit wants to configure.",
        checks: [],
      }]
    }
  );

  const [benefitIndexToConfigure, setBenefitIndexToConfigure] = createSignal<null | number>(null);
  const benefitToConfigure: Accessor<Benefit> = () => {
    if (benefitIndexToConfigure() !== null) {
      return projectBenefits.benefits.at(benefitIndexToConfigure());
    }
    return null;
  };

  // Handle API updates whenever projectBenefits changes
  const lastSavedTime = handleScreenerApiUpdates(params.projectId, projectBenefits);

  // TODO: update to stop "Last Saved" from breaking container bounds
  return (
    <div class="px-4">
      <div class="fixed z-50 top-21 right-4 flex ml-auto mr-8 gap-2 justify-center">
        <span class="text-sm flex items-center text-gray-500">
          Last saved: {lastSavedTime() ? new Date(lastSavedTime()).toLocaleTimeString() : "--"}
        </span>
      </div>
      {
        benefitIndexToConfigure() === null && (
          <ProjectBenefits
            projectBenefits={projectBenefits}
            setProjectBenefits={setProjectBenefits}
            setBenefitIndexToConfigure={setBenefitIndexToConfigure}
          />
        )
      }
      {
        benefitIndexToConfigure() !== null &&
        <BenefitConfigurationContext.Provider
          value={{
            benefit: benefitToConfigure,
            benefitIndex: benefitIndexToConfigure,
            setBenefitIndex: setBenefitIndexToConfigure,
            setProjectBenefits: setProjectBenefits,
          }}
        >
          <ConfigureBenefit/>
        </BenefitConfigurationContext.Provider>
      }
    </div>
  );
}
export default ManageBenefits;
