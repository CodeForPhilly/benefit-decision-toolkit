import { createSignal } from "solid-js";
import { useParams } from "@solidjs/router";

import BenefitList from "./benefitList/BenefitList";
import ConfigureBenefit from "./configureBenefit/ConfigureBenefit";

const ManageBenefits = () => {
  const params = useParams();
  const [benefitIdToConfigure, setBenefitIdToConfigure] = createSignal<
    null | string
  >(null);

  return (
    <div>
      {benefitIdToConfigure() === null && (
        <BenefitList
          screenerId={() => params.screenerId}
          setBenefitIdToConfigure={setBenefitIdToConfigure}
        />
      )}
      {benefitIdToConfigure() !== null && (
        <ConfigureBenefit
          screenerId={() => params.screenerId}
          benefitId={benefitIdToConfigure}
          setBenefitId={setBenefitIdToConfigure}
        />
      )}
    </div>
  );
};
export default ManageBenefits;
