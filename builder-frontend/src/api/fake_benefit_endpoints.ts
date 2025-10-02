import { Benefit } from "../components/project/manageBenefits/types";

import {
  homeOwnershipStatusCheck,
  minimumAgeRequirementCheck,
  philadelphiaResidentCheck,
  centerCityCheck,
  veteranStatusCheck
} from "./fake_data";


export const getAllAvailableBenefits = async (): Promise<Benefit[]> => {
  // Simulate an API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return [
    {
      id: "benefit_1",
      name: "Housing Assistance",
      description: "Provides financial assistance for housing costs.",
      checks: [
        minimumAgeRequirementCheck(60),
        homeOwnershipStatusCheck(false),
      ],
    },
    {
      id: "benefit_2",
      name: "Veteran Support",
      description: "Offers specialized assistance and resources for veterans.",
      checks: [
        veteranStatusCheck(true)
      ],
    },
    {
      id: "benefit_3",
      name: "Philadelphia Veteran Support",
      description: "Offers specialized assistance and resources for veterans.",
      checks: [
        veteranStatusCheck(true),
        philadelphiaResidentCheck(true),
      ],
    }
  ];
}

export const getBenefit = async (): Promise<Benefit> => {
  // Simulate an API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    id: "benefit_1",
    name: "Housing Assistance",
    description: "Provides financial assistance for housing costs.",
    checks: [
      minimumAgeRequirementCheck(60),
      homeOwnershipStatusCheck(false),
    ],
  };
}

export const updateBenefit = async (newBenefit: Benefit): Promise<Benefit> => {
  // Simulate an API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Simulated backend update of benefit:", newBenefit);
  return newBenefit;
}