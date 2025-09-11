export default {
  benefits: {
    phlLoop: {
      name: "Longtime Owner Occupants Program (LOOP)",
      eligibility: {
        result: true,
        checks: {
          tenOrMoreYearsOwnerOccupant: {
            name: "Occupant for ten years or more",
            result: true,
          },
          notEnrolledInPhlLoop: {
            name: "Not enrolled in LOOP",
            result: true,
          },
          noTenYearTaxAbatement: {
            name: "No ten-year tax abatement",
            result: true,
          },
        },
      },
      info: "The Longtime Owner Occupants Program (LOOP) is a Real Estate Tax relief program for eligible homeowners whose property assessments increased by at least 50% from last year or increased by at least 75% in the last five years.",
      appLink:
        "https://www.phila.gov/documents/longtime-owner-occupants-program-loop-forms/",
    },
    phlSeniorCitizenTaxFreeze: {
      name: "Senior Citizen Tax Freeze",
      eligibility: {
        result: null,
        checks: {
          notEnrolledInPhlSeniorCitizenTaxFreeze: {
            name: "Not enrolled in senior citizen tax freeze",
            result: true,
          },
          meetsPhlSeniorCitizenTaxFreezeAgeRequirements: {
            name: "Meets senior citizen tax freeze requirements",
            result: null,
          },
          phillyOwnerOccupantHomeowner: {
            name: "Owns a home in Philadelphia",
            result: true,
          },
        },
      },
      info: "Quo qui minus nisi facilis dolorem ullam ex. Perspiciatis expedita doloremque ratione esse non iusto. Eos qui dolore quisquam ipsum vel. Dolores dignissimos quibusdam qui tempora et autem dolore. Accusantium saepe praesentium et dignissimos veniam perspiciatis magni quam.",
      appLink:
        "https://www.phila.gov/documents/longtime-owner-occupants-program-loop-forms/",
    },
    phlLowIncomeTaxFreeze: {
      name: "Low Income Tax Freeze",
      eligibility: {
        result: false,
        checks: {
          phillyOwnerOccupantHomeowner: {
            name: "Owns a home in Philadelphia",
            result: false,
          },
          notEnrolledInPhlLowIncomeTaxFreeze: {
            name: "Not enrolled in low income tax freeze",
            result: null,
          },
          underMaritalStatusBasedCurrentMonthlyGrossIncome: {
            name: "Under marital status-based monthly gross income",
            result: true,
          },
        },
      },
      info: "Quo qui minus nisi facilis dolorem ullam ex. Perspiciatis expedita doloremque ratione esse non iusto. Eos qui dolore quisquam ipsum vel. Dolores dignissimos quibusdam qui tempora et autem dolore. Accusantium saepe praesentium et dignissimos veniam perspiciatis magni quam.",
      appLink:
        "https://www.phila.gov/documents/longtime-owner-occupants-program-loop-forms/",
    },
  },
  branding: {
    orgName: "Organization Name",
    authorInfo: "Created by Org Name",
  },
};
