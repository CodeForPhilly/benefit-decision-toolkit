import { EligibilityCheck } from "../components/project/manageBenefits/types";

export function minimumAgeRequirementCheck(
  minimum_target_age?: number
): EligibilityCheck {
  return {
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
        ...(minimum_target_age !== undefined && {
          value: minimum_target_age,
        }),
      },
    ],
  };
}

export function homeOwnershipStatusCheck(
  home_ownership?: boolean
): EligibilityCheck {
  return {
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
        ...(home_ownership !== undefined && {
          value: home_ownership,
        }),
      },
    ],
  };
}

export function veteranStatusCheck(
  veteran_status?: boolean
): EligibilityCheck {
  return {
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
        ...(veteran_status !== undefined && {
          value: veteran_status,
        }),
      },
    ],
  };
}

export function philadelphiaResidentCheck(
  philadelphia_resident?: boolean
): EligibilityCheck {
  return {
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
        ...(philadelphia_resident !== undefined && {
          value: philadelphia_resident,
        }),
      },
    ],
  };
}

export function centerCityCheck(
  center_city_resident?: boolean
): EligibilityCheck {
  return {
    id: "Center City Housing",
    category: "location",
    description: "Checks if the user lives in Center City of Philadelphia",
    inputs: [
      {
        key: "center_city_resident",
        prompt: "Are you currently living in Center City?",
        type: "boolean",
      },
    ],
    parameters: [
      {
        key: "center_city_resident",
        type: "boolean",
        label: "Does this check target Center City residents?",
        truthLabel: "Benefit targets Center City residents",
        falseLabel: "Benefit targets people not living in Center City",
        required: true,
        ...(center_city_resident !== undefined && {
          value: center_city_resident,
        }),
      },
    ],
  };
}
