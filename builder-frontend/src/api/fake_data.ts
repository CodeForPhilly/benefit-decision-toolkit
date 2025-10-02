import { EligibilityCheck } from "../components/project/manageBenefits/types";

export function minimumAgeRequirementCheck(
  minimum_target_age?: number
): EligibilityCheck {
  return {
    id: "minimum_age_requirement",
    name: "Minimum Age Requirement",
    module: "demographic",
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
    name: "Home Ownership Status",
    module: "housing",
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
    name: "Veteran Status",
    module: "demographic",
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
    name: "Philadelphia Residency",
    module: "location",
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
    id: "center_city_housing",
    name: "Center City Residency",
    module: "location",
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
        required: true,
        ...(center_city_resident !== undefined && {
          value: center_city_resident,
        }),
      },
    ],
  };
}
