# Philadelphia property tax benefits

All six benefits are exposed at `POST /api/v1/benefits/pa/phl/{slug}`.
Their OpenAPI operations publish `x-bdt-benefit.checks`, including check
operation IDs, aliases, fixed parameters, and primary-person bindings, so the
builder can import their compositions. Computed alternatives are encapsulated
in checks under `checks/internal/`.

| Benefit | Slug | Composed checks |
| --- | --- | --- |
| Homestead Exemption | `homestead-exemption` | Not already enrolled, owner-occupant, Philadelphia residence, no ten-year abatement |
| Owner-Occupied Payment Agreement | `owner-occupied-payment-agreement` | Not already enrolled, owner-occupant, Philadelphia residence, delinquent taxes |
| Senior Citizen Tax Freeze | `senior-citizen-tax-freeze` | Not already enrolled, owner-occupant, Philadelphia residence, existing applicant/spouse/late-spouse age requirement |
| Low-Income Tax Freeze | `low-income-tax-freeze` | Not already enrolled, owner-occupant, Philadelphia residence, single/married income limit |
| Longtime Owner Occupants Program (LOOP) | `loop` | Not already enrolled, owner-occupant, Philadelphia residence, ten years of ownership and occupancy, assessment increase, taxes current or payment plan, household income limit, no Homestead enrollment, no disqualifying abatement |
| Real Estate Tax Installment Plan (RETIP) | `retip` | Not already enrolled, owner-occupant, Philadelphia residence, applicant/live-in spouse age **or** household income limit |

## New inputs

Each model projects only the fields it uses from `BDT.tSituation`.

| Situation field | Meaning |
| --- | --- |
| `householdIncome` | Annual income in dollars, calculated under the applicable program's income rules; the freeze uses the applicant's gross income plus the spouse's when married, while LOOP/RETIP use household income |
| `householdSize` | Family size for LOOP/RETIP income tables; a positive integer |
| `yearsOwnerOccupied` | Completed duration of ownership and occupancy of the primary residence, in years |
| `propertyAssessment` | Current assessment before exemption reductions |
| `previousYearPropertyAssessment` | Prior year's assessment before exemption reductions |
| `lowestPropertyAssessmentLastFiveYears` | Lowest assessment in the preceding five years, before exemption reductions |
| `simpleChecks.isMarried` | Whether the applicant is married; selects the freeze income cap |
| `simpleChecks.spouseLivesInHousehold` | Whether the current spouse lives with the applicant; required for the RETIP spouse age pathway |
| `simpleChecks.propertyTaxPaymentPlan` | Whether property taxes are covered by an active OOPA or installment plan |
| `simpleChecks.disqualifyingTaxAbatement` | Whether the current owner received an abatement on this property, or a previous owner who received one is a close relative; includes expired abatements |

RETIP matches the spouse relationship to `primaryPersonId`; an unrelated senior
household member does not qualify the applicant. An empty `relationships` list
means no spouse, while an omitted list means unknown. RETIP checks age as of
today and does not use SCTF's late-spouse pathway.

Missing information returns `null`. An alternative that is known to pass can
pass even when the other path is unknown. A failed required check makes the
benefit ineligible. Unsupported family sizes, negative income, and invalid
assessment baselines return unknown rather than extrapolating a policy rule.
An empty enrollment list means the applicant is enrolled in none of the
listed benefits; an omitted or null list means unanswered.

## Policy sources and maintenance

The three added benefits implement new-applicant eligibility from the city
guidance linked in issues #387, #389, and #537, verified October 5, 2026:

- [Low-Income Tax Freeze](https://www.phila.gov/services/payments-assistance-taxes/taxes/property-and-real-estate-taxes/get-real-estate-tax-relief/tax-freeze/apply-for-the-low-income-real-estate-tax-freeze/): income at or below $33,500 single or $41,500 married, without an age restriction.
- [LOOP](https://www.phila.gov/services/payments-assistance-taxes/taxes/property-and-real-estate-taxes/get-real-estate-tax-relief/apply-for-the-longtime-owner-occupants-program-loop/): at least ten years of occupancy and a 50% one-year **or** 75% five-year assessment increase. New applicants use the 120% AMI table for family sizes 1–10, with income strictly below the cap. The 150% table for participants enrolled before 2023 is a renewal rule and is not used here. Homestead recipients must remove that exemption to enroll in LOOP. The historical owner/relative abatement rule differs from Homestead's current ten-year abatement check.
- [RETIP](https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/income-based-programs-for-residents/set-up-real-estate-tax-installment-plan/): applicant or live-in spouse at least 65, regardless of income, **or** household income strictly below the annual family-size cap for sizes 1–8. The [July 2026 application](https://www.phila.gov/media/20260710071917/Real-Estate-Tax-Installment-Plan-application-form-revised.pdf) also describes income as below the cap.

Income tables live in `checks/income/loop-income.dmn` and
`checks/income/retip-income.dmn`; the single/married caps live in
`checks/income/tax-freeze-income.dmn`. Update their boundary scenarios under
`test/bdt/checks/income/` when city limits change. Do not extrapolate larger
family sizes without a published rule.

These screeners evaluate eligibility conditions, not application deadlines,
document submission, bill amounts, or administrative approval. The three
previously implemented benefits retain their existing compositions.
