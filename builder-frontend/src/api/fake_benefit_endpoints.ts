import { Benefit } from "../components/project/manageBenefits/types";


export const getAllAvailableBenefits = async (): Promise<Benefit[]> => {
  // Simulate an API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return [
    {
      id: "benefit_1",
      name: "Housing Assistance",
      description: "Provides financial assistance for housing costs.",
      checks: [
        {
          id: "minimum_age_requirement",
          category: "demographic",
          description: "Checks if the user's age is greater than a specified value",
          inputs: [
            {
              key: "age",
              prompt: "Enter your age",
              type: "number",
              validation: {
                required: true,
                min: 0,
                max: 120,
              },
            },
          ],
          parameters: [
            {
              key: "minimum_target_age",
              type: "number",
              label: "Age the benefit targets (minimum)",
              value: 60,
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "benefit_2",
      name: "Veteran Support",
      description: "Offers specialized assistance and resources for veterans.",
      checks: [
        {
          id: "veteran_status",
          category: "demographic",
          description: "Checks if the user is a veteran",
          inputs: [
            {
              key: "veteran_status",
              prompt: "Are you a veteran?",
              type: "boolean",
            },
          ],
          parameters: [
            {
              key: "veteran_status",
              type: "boolean",
              label: "Does this check target veterans?",
              truthLabel: "Benefit targets veterans",
              falseLabel: "Benefit targets non-veterans",
              value: true,
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "benefit_3",
      name: "Philadelphia Veteran Support",
      description: "Offers specialized assistance and resources for veterans.",
      checks: [
        {
          id: "veteran_status",
          category: "demographic",
          description: "Checks if the user is a veteran",
          inputs: [
            {
              key: "veteran_status",
              prompt: "Are you a veteran?",
              type: "boolean",
            },
          ],
          parameters: [
            {
              key: "veteran_status",
              type: "boolean",
              label: "Does this check target veterans?",
              truthLabel: "Benefit targets veterans",
              falseLabel: "Benefit targets non-veterans",
              value: true,
              required: true,
            },
          ],
        },
        {
          id: "philadelphia_resident",
          category: "location",
          description: "Checks if the user lives in Philadelphia",
          inputs: [
            {
              key: "philadelphia_resident",
              prompt: "Are you currently a Philadelphia resident?",
              type: "boolean",
            },
          ],
          parameters: [
            {
              key: "philadelphia_resident",
              type: "boolean",
              label: "Does this check target Philadelphia residents?",
              truthLabel: "Benefit targets Philadelphia residents",
              falseLabel: "Benefit targets non-residents",
              value: true,
              required: true,
            },
          ],
        },
      ],
    }
  ];
}
