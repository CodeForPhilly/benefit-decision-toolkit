# Scratch Check Ideas
These is just a space to collect ideas for various checks we could make and how we might document them. If something is here, then it does not mean a check is implemented or will be implemented!

# Template

## NameOfCheck
### "Example Display name of this check for this benefit's results"

- stringParam: "a string"
- numberParam: 1000
- booleanParam: true
- feelFunctionParam: a feel expression(situation)
- feelListParam: ["something", "something else"]
- feelDataParam: situation.somePath.toSome.data

# Notes
- FEEL expressions would have access to the "situation" and any BDT-wide custom functions (in addition to all the typical FEEL built-ins)


# Age Examples

## SpecificPersonAgeMinimum
### "Primary person is at least 60 years old"

- personId: situation.primaryPersonId
- asOfDate: today()
- minimumAge: 60

## SpecificPersonAgeMinimum
### "Spouse is at least 55 years old by end of 2024"

- personId: BDT.spouse of(situation.primaryPersonId).id[1]
- asOfDate: "2024-12-31"
- minimumAge: 55


## SomeoneAgeIsAtLeast (one of the people meets the age minimum)
### "Primary person or spouse is at least 65 years old"

- peopleIds: [situation.primaryPersonId, spouse of(situation.primaryPersonId).id]
- asOfDate: today()
- minimumAge: 65


## EveryoneAgeMinimum (all of the people meet the age minimum)
"All household members are at least 18 years old"

- asOfDate: today()
- minimumAge: 18


## NoneAgeMinimum (none of the people meet the age minimum)
### "No household members are at least 21 years old"

- asOfDate: today()
- minimumAge: 21


## SomeoneAgeBetween
### "A child in the household will be between 3 and 4 years old on September 1"

- peopleIds: situation.people.id
- asOfDate: "2026-09-01"
- minimumAge: 3
- maximumAge: 4


# Location Examples

## ResidentOfCity
### "Resident of Philadelphia"

- cityName: "Philadelphia"
- stateAbbreviation: "PA"


## NotAResidentOfCity (implemented as the "not" of ResidentOfCity)
### "Not a resident of Philadelphia"

- cityName: "Philadelphia"
- stateAbbreviation: "PA"


## ResidentOfState
### "Resident of Pennsylvania"

- stateAbbreviation: "PA"

## NotAResidentOfState (implemented as the "not" of ResidentOfState)
### "Not a resident of Pennsylvania"

- stateAbbreviation: "PA"


# Income Examples

## HouseholdGrossIncomeMinimum
### "Total SNAP-countable income is below $1000 per month"

- incomeTypes: BDT.earnedIncomeTypes()
- period: BDT.thisMonth()
- minIncome: 1000


# Enrollment Examples

## PersonEnrolledInBenefit
### "Primary person already receives Homestead Exemption"

- personId: situation.primaryPersonId
- benefit: "PhlHomesteadExemption"

## SomeoneEnrolledInBenefit
### "At least one child is already enrolled in Philly Pre-K"

- peopleIds: situation.people[BDT.age as of date(item.dateOfBirth, today()) < 18].id
- benefit: "PhlPreK"