import { createContext, Accessor, Setter } from "solid-js";
import { SetStoreFunction } from "solid-js/store"

import { Benefit, EligibilityCheck } from "./types";

export const CheckConfigurationContext = createContext<{
  setBenefit: SetStoreFunction<Benefit>;
  check: EligibilityCheck;
  checkIndex: Accessor<number>;
}>(null);
