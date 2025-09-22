import { EligibilityCheck } from "../types";


export const getAllAvailableChecks = async (): Promise<EligibilityCheck[]> => {
  // Simulate an API call delay -- TODO: update to greater than 1ms delay
  await new Promise((resolve) => setTimeout(resolve, 1));

  return [
    {
      id: "age_greater_than_value",
      category: "demographic",
      description: "Check if the user's age is greater than a specified value",
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
          key: "min_target_age",
          type: "number",
          label: "Age the benefit targets (minimum)",
          required: true,
        },
      ],
    },
  ];
};
