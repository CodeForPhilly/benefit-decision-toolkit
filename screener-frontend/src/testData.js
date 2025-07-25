export default {
  benefits: {
    phlLoop: {
      eligibility: {
        result: false,
        checks: {
          tenOrMoreYearsOwnerOccupant: null,
          notEnrolledInPhlLoop: null,
          noTenYearTaxAbatement: null,
          loopTaxAssessmentEligible: null,
          phillyOwnerOccupantHomeowner: false,
          underPreviousAnnualGrossIncome: null,
          notTaxDelinquentOrIsEnrolledInOopaEligible: null,
        },
      },
    },
    phlSeniorCitizenTaxFreeze: {
      eligibility: {
        result: false,
        checks: {
          notEnrolledInPhlSeniorCitizenTaxFreeze: null,
          meetsPhlSeniorCitizenTaxFreezeAgeRequirements: null,
          phillyOwnerOccupantHomeowner: false,
          underMaritalStatusBasedCurrentMonthlyGrossIncome: null,
        },
      },
    },
    phlLowIncomeTaxFreeze: {
      eligibility: {
        result: false,
        checks: {
          phillyOwnerOccupantHomeowner: false,
          notEnrolledInPhlLowIncomeTaxFreeze: null,
          underMaritalStatusBasedCurrentMonthlyGrossIncome: null,
        },
      },
    },
    phlOopa: {
      eligibility: {
        result: false,
        checks: {
          taxDelinquent: null,
          phillyOwnerOccupantHomeowner: false,
          notEnrolledInPhlOopa: null,
        },
      },
    },
    phlHomesteadExemption: {
      eligibility: {
        result: false,
        checks: {
          noTenYearTaxAbatement: null,
          phillyOwnerOccupantHomeowner: false,
          notEnrolledInPhlHomesteadExemption: null,
        },
      },
    },
  },
};
