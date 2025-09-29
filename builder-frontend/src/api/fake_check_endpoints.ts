import { EligibilityCheck } from "../components/project/manageBenefits/types";

import {
  homeOwnershipStatusCheck,
  minimumAgeRequirementCheck,
  philadelphiaResidentCheck,
  centerCityCheck,
  veteranStatusCheck
} from "./fake_data";


export const getPublicChecks = async (): Promise<EligibilityCheck[]> => {
  // Simulate an API call delay -- TODO: update to greater than 1ms delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    minimumAgeRequirementCheck(),
    homeOwnershipStatusCheck(),
    veteranStatusCheck(),
    philadelphiaResidentCheck(),
  ];
};



export const getUserDefinedChecks = async (): Promise<EligibilityCheck[]> => {
  // Simulate an API call delay -- TODO: update to greater than 1ms delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [centerCityCheck()];
};
