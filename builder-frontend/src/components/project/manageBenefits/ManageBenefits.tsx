import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";

import BenefitList from "./benefitList/BenefitList";
import ConfigureBenefit from "./configureBenefit/ConfigureBenefit";


const ManageBenefits = () => {
  const params = useParams();


  const [benefitIdToConfigure, setBenefitIdToConfigure] = createSignal<null | string>(null);

  return (
    <div class="px-4">
      {
        benefitIdToConfigure() === null && (
          <BenefitList screenerId={params.projectId} setBenefitIdToConfigure={setBenefitIdToConfigure}/>
        )
      }
      {
        benefitIdToConfigure() !== null && (
          <ConfigureBenefit screenerId={params.projectId} benefitId={benefitIdToConfigure()} setBenefitId={setBenefitIdToConfigure}/>
        )
      }
    </div>
  );
}
export default ManageBenefits;
