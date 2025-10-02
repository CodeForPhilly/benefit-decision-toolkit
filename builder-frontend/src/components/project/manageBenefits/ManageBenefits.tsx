import { createSignal } from "solid-js";

import BenefitList from "./benefitList/BenefitList";
import ConfigureBenefit from "./configureBenefit/ConfigureBenefit";


const ManageBenefits = () => {
  const [benefitIdToConfigure, setBenefitIdToConfigure] = createSignal<null | string>(null);

  return (
    <div class="px-4">
      {
        benefitIdToConfigure() === null && (
          <BenefitList setBenefitIdToConfigure={setBenefitIdToConfigure}/>
        )
      }
      {
        benefitIdToConfigure() !== null && (
          <ConfigureBenefit benefitId={benefitIdToConfigure()}/>
        )
      }
    </div>
  );
}
export default ManageBenefits;
