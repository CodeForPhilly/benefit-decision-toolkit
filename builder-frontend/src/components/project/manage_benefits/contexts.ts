import { createContext, Accessor, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import {
  ProjectBenefits as ProjectBenefitsType,
  Benefit,
  EligibilityCheck
} from "./types";


export const BenefitConfigurationContext = createContext<{
  benefit: Accessor<Benefit>;
  benefitIndex: Accessor<null | number>;
  setBenefitIndex: Setter<null | number>;
  setProjectBenefits: SetStoreFunction<ProjectBenefitsType>;
}>(null);

export const CheckConfigurationContext = createContext<{
  check: EligibilityCheck;
  checkIndex: Accessor<number>;
}>(null);
