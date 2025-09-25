import { createSignal, Accessor } from "solid-js";
import { createStore } from "solid-js/store"
import { useParams } from "@solidjs/router";

import ProjectBenefits from "./benefit_list/BenefitList";
import ConfigureBenefit from "./configure_benefit/ConfigureBenefit";

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
  handleScreenerApiUpdates(params.projectId, projectBenefits);

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
