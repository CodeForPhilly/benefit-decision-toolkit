import { createSignal, onMount, Accessor } from "solid-js";
import { createStore } from "solid-js/store"

import { ProjectBenefits as ProjectBenefitsType, Benefit } from "./types";
import ProjectBenefits from "./project_benefits/ProjectBenefits";
import ConfigureBenefit from "./configure_benefit/ConfigureBenefit";

const ManageBenefits = ({ projectId }: { projectId: string }) => {
  const [projectBenefits, setProjectBenefits] = createStore<ProjectBenefitsType>({ benefits: [] });
  
  const [benefitIdToConfigure, setBenefitIdToConfigure] = createSignal<null | string>(null);
  const benefitToConfigure: Accessor<Benefit> = () => {
    if (benefitIdToConfigure() !== null) {
      return projectBenefits.benefits.find(b => b.id === benefitIdToConfigure());
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
  });

  const addStubBenefit = () => {
    const newBenefit = {
      id: crypto.randomUUID(),
      name: "New Benefit",
      description: "Description of the new benefitfsafasdfasdfasdfasdfasdf asdasdfsafasdfasdfasfdas dfsadfasdfa sdfasdfasfasfdafdasfdasfd",
      checks: [],
    };
    setProjectBenefits("benefits", (benefits) => [...benefits, newBenefit]);
  }

  return (
    <div class="px-5 py-2">
      {
        benefitIdToConfigure() === null && (
          <ProjectBenefits
            projectBenefits={projectBenefits}
            setProjectBenefits={setProjectBenefits}
            setBenefitIdToConfigure={setBenefitIdToConfigure}
          />
        )
      }
      {
        benefitIdToConfigure() !== null &&
        <ConfigureBenefit benefitToConfigure={benefitToConfigure} />
      }
    </div>
  );
}
export default ManageBenefits;
