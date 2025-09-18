import { Accessor } from "solid-js";

import { Benefit } from "../types";

const ConfigureBenefit = ({ benefitToConfigure }: { benefitToConfigure: Accessor<Benefit> }) => {
  return (
    <div>
      CONFIGURE_BENEFIT {benefitToConfigure() ? benefitToConfigure().name : "No Benefit Found"}
    </div>
  );
}
export default ConfigureBenefit;
