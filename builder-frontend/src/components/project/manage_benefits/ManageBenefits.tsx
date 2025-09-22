import { createSignal, onMount, Accessor } from "solid-js";
import { createStore } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType, Benefit } from "./types";
import ProjectBenefits from "./project_benefits/ProjectBenefits";
import ConfigureBenefit from "./configure_benefit/ConfigureBenefit";

const ManageBenefits = ({ projectId }: { projectId: string }) => {
  const [projectBenefits, setProjectBenefits] = createStore<ProjectBenefitsType>({ benefits: [] });

  const [benefitIndexToConfigure, setBenefitIndexToConfigure] = createSignal<null | number>(null);
  const benefitToConfigure: Accessor<Benefit> = () => {
    if (benefitIndexToConfigure() !== null) {
      return projectBenefits.benefits.at(benefitIndexToConfigure());
    }
    return null;
  };

  onMount(async () => {
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();
    addStubBenefit();

     // For dev purposes, open the first benefit for configuration
     // TODO: remove this when we have a more robust UI
    setBenefitIndexToConfigure(0);
  });

  const addStubBenefit = () => {
    const newBenefit = {
      id: crypto.randomUUID(),
      name: "Example Benefit",
      description: "Description of the new benefit",
      checks: [],
    };
    setProjectBenefits("benefits", (benefits) => [...benefits, newBenefit]);
  }

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
        <ConfigureBenefit
          benefitToConfigure={benefitToConfigure}
          benefitIndexToConfigure={benefitIndexToConfigure}
          setBenefitIndexToConfigure={setBenefitIndexToConfigure}
          setProjectBenefits={setProjectBenefits}
        />
      }
    </div>
  );
}
export default ManageBenefits;
