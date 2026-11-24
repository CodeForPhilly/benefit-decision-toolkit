---
title: About the library
description: Reference pages for the benefits and eligibility checks in the BDT library.
---

The library is the set of pre-built benefits and eligibility checks that every screener can use.
Each page in this section is the **reference** for one benefit or check: what it decides, the rules
it applies, the policy sources behind them, its limitations, and worked examples.

References are written next to the rules in each library DMN file and published through the
library API's OpenAPI document, so these pages, the screener builder, and the API documentation
always describe the same rules. A page's address mirrors the API endpoint it documents: for example,
`POST /api/v1/benefits/pa/liheap-cash` is documented at `/library/benefits/pa/liheap-cash/`.

A screener only sees what its questions provide. Read the limitations on each page before relying
on a result: they list the rules the library does not check.
