import { Accessor } from "solid-js";
import { useParams } from "@solidjs/router";

import BenefitList from "./benefitList/BenefitList";
import ConfigureBenefit from "./configureBenefit/ConfigureBenefit";

const ManageBenefits = ({
  benefitIdToConfigure,
  setBenefitIdToConfigure,
}: {
  benefitIdToConfigure: Accessor<string | null>;
  setBenefitIdToConfigure: (benefitId: string | null) => void;
}) => {
  const params = useParams();

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
