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
          key: "minimum_target_age",
          type: "number",
          label: "Age the benefit targets (minimum)",
          required: true,
        },
      ],
    },
    {
      id: "home_ownership_status",
      category: "housing",
      description: "Does the user own a home",
      inputs: [
        {
          key: "home_ownership",
          prompt: "Do you own a home?",
          type: "boolean",
        },
      ],
      parameters: [
        {
          key: "home_ownership_to_qualify",
          type: "boolean",
          label: "Does this check target home owners? (select 'false' to target non-owners)",
          required: true,
        },
      ],
    },
    {
      id: "country_of_residence",
      category: "location",
      description: "Check if the user resides in a specific country",
      inputs: [
        {
          key: "country",
          prompt: "Enter your country of residence",
          type: "string",
          validation: {
            required: true,
            min_length: 2,
            max_length: 56,
          },
        },
      ],
      parameters: [
        {
          key: "target_country",
          type: "string",
          label: "Country the benefit targets",
          required: true,
        },
      ],
    }
  ];
};
