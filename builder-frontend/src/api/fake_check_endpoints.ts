import { EligibilityCheck } from "../components/project/manage_benefits/types";


export const getAllAvailableChecks = async (): Promise<EligibilityCheck[]> => {
  // Simulate an API call delay -- TODO: update to greater than 1ms delay
  await new Promise((resolve) => setTimeout(resolve, 1));

  return [
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
          required: true,
        },
      ],
    },
    {
      id: "home_ownership_status",
      category: "housing",
      description: "Checks if the user owns a home",
      inputs: [
        {
          key: "home_ownership",
          prompt: "Do you own a home?",
          type: "boolean",
        },
      ],
      parameters: [
        {
          key: "home_ownership",
          type: "boolean",
          label: "Does this check target home owners?",
          truthLabel: "Benefit targets homeowners",
          falseLabel: "Benefit targets non-homeowners",
          required: true,
        },
      ],
    },
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
          required: true,
        },
      ],
    },
  ];
};
