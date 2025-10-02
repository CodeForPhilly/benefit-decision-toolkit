import { ScreenerBenefits } from "../components/project/manageBenefits/types";


export const getScreener = async (): Promise<ScreenerBenefits> => {
  // Simulate an API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    benefits: [
      {
        id: "benefit_1",
        name: "Housing Assistance",
        description: "Provides financial assistance for housing costs.",
      },
      {
        id: "benefit_2",
        name: "Veteran Support",
        description: "Offers specialized assistance and resources for veterans.",
      },
      {
        id: "benefit_3",
        name: "Philadelphia Veteran Support",
        description: "Offers specialized assistance and resources for veterans.",
      }
    ]
  };
}