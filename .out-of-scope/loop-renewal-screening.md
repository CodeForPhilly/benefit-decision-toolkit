# LOOP renewal screening

The library's Longtime Owner Occupants Program benefit (`PhlLoop`) screens
**new applicants only**. It doesn't screen households renewing an existing LOOP
enrollment. In particular, it doesn't apply the 150% of area median income
limit that only households enrolled in LOOP before 2023 can use.

## Why this is out of scope

The City's LOOP page sets two income limits. Everyone uses 120% of area
median income. Households enrolled before 2023 may use a 150% limit, "only to
stay in the program". So the 150% path only ever applies to someone who is
already enrolled.

`PhlLoop` deliberately screens people who might apply: it composes a
not-already-enrolled check, so an enrolled household doesn't come out as
eligible. Supporting the 150% path would mean changing what the benefit is
for, not just adding a threshold:

- a new screener question ("enrolled in LOOP before 2023"),
- a second, dated income table (the 150% figures), kept up to date along with
  the 120% one,
- changing how the benefit treats households that are already enrolled, so a
  renewal can pass instead of failing the not-already-enrolled check.

Screeners built with BDT help residents find benefits they don't have yet.
Renewal eligibility belongs to the program's own renewal process. The gap is
documented instead: the `PhlLoop` reference lists, as a limitation, that only
the 120% limit for new applicants is applied and the 150% path isn't checked.

If BDT later decides that library benefits should screen renewals generally,
revisit this decision for all programs together, not for LOOP alone.

## Prior requests

- #602: "LOOP: support the 150% income limit for households enrolled before 2023"
