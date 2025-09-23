import { createSignal, Accessor } from "solid-js";
import { createStore } from "solid-js/store"

import ProjectBenefits from "./project_benefits/ProjectBenefits";
import ConfigureBenefit from "./configure_benefit/ConfigureBenefit";

import { BenefitConfigurationContext } from "./contexts";
import { handleScreenerApiUpdates } from "./handleScreenerApiUpdates";

import type { ProjectBenefits as ProjectBenefitsType, Benefit } from "./types";


const ManageBenefits = ({ screenerId }: { screenerId: string }) => {
  const [projectBenefits, setProjectBenefits] = createStore<ProjectBenefitsType>(
    {
      benefits: [{
        id: crypto.randomUUID(),
        name: "Example Benefit",
        description: "Description of the new benefit",
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
  handleScreenerApiUpdates(screenerId, projectBenefits);

  return (
    <div class="px-5 py-2">
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
