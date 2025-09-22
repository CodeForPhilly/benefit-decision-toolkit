import { createContext, Accessor, Setter } from "solid-js";
import { ProjectBenefits as ProjectBenefitsType, Benefit, EligibilityCheck } from "./types";
import { SetStoreFunction } from "solid-js/store"


export const BenefitConfigurationContext = createContext<{
  benefit: Accessor<Benefit>;
  benefitIndex: Accessor<null | number>;
  setBenefitIndex: Setter<null | number>;
  setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
}>(null);


export const CheckConfigurationContext = createContext<{
  check: EligibilityCheck;
  checkIndex: number;
}>(null);
