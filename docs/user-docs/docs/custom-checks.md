# Custom Eligibility Checks

## 1. What Are Custom Eligibility Checks?

The BDT platform provides a library of **public eligibility checks** — prebuilt rule components that cover common eligibility criteria such as age thresholds, residency requirements, and income limits. For most screeners, combining these public checks is sufficient to express the required eligibility logic.

However, if the public checks do not cover a requirement specific to your use case, BDT allows you to build your own reusable **custom eligibility checks**.

A custom eligibility check works exactly like a public check within your screener:

- It accepts one or more inputs from the screener form
- It evaluates a defined condition
- It returns an eligibility result (`True` or `False`)

The key difference is that you define the logic yourself using **DMN (Decision Model and Notation)**, a low-code standard for expressing decision rules.

Once created and published, your custom checks appear alongside public checks in the **Configure Benefit** page and can be reused across multiple screeners.

---

## 2. DMN and FEEL

Custom check logic is defined using **DMN** with expressions written in **FEEL**. Neither requires traditional programming experience, but understanding their core concepts will help you build effective checks.

### 2.1 What Is DMN?

**Decision Model and Notation (DMN)** is an open standard for modeling and executing decision logic. It provides a visual, structured way to express rules that a system can evaluate automatically.

In BDT, each custom check is backed by a DMN model that contains one or more **decision tables** organized into a decision tree.

DMN models have two main building blocks:

- **Input Data nodes** — represent values coming in from the form or from configured parameters
- **Decision nodes** — represent rules that evaluate those inputs and produce an output

### 2.2 What Is FEEL?

**FEEL (Friendly Enough Expression Language)** is the expression language used inside DMN to write rule conditions and computed values.

FEEL is designed to be readable and approachable. A few examples:

| FEEL Expression                   | Meaning                  |
| --------------------------------- | ------------------------ |
| `age >= 65`                       | Age is 65 or older       |
| `state = "California"`            | State equals California  |
| `income < 2000`                   | Income is less than 2000 |
| `date("2024-01-01")`              | A specific date literal  |
| `age >= minAge and age <= maxAge` | Age falls within a range |

FEEL supports arithmetic, comparisons, logical operators (`and`, `or`, `not`), date functions, string functions, and more.

### 2.3 Decision Tables

The most common way to express eligibility logic in DMN is a **decision table** — a structured grid where each row is a rule.

Each rule specifies:

- **Input conditions** — the values or ranges that must be true for this rule to apply
- **Output** — the result returned when the rule matches

BDT eligibility checks always return `true` (eligible), `false` (not eligible), or a value indicating insufficient information.

**Example — Minimum Age Check**:

| Age (Input) | Eligible (Output) |
| ----------- | ----------------- |
| `>= 65`     | `true`            |
| `< 65`      | `false`           |

**Example — Income and Household Size Check**:

| Household Size (Input) | Annual Income (Input) | Eligible (Output) |
| ---------------------- | --------------------- | ----------------- |
| `1`                    | `<= 20000`            | `true`            |
| `2`                    | `<= 27000`            | `true`            |
| `any`                  | `> 50000`             | `false`           |

**Identifying the result node**:

When you create a custom check in BDT, you give it a name (for example, "Household Income Limit"). Your DMN model must contain a decision node with that exact same name. BDT uses this naming convention to identify which decision node represents the final eligibility result for the check. All other decision nodes in the model are treated as intermediate steps that feed into it.

### 2.4 Further Reading

For a deeper understanding of DMN and FEEL, refer to the official documentation:

- [DMN Documentation (Drools)](https://docs.drools.org/latest/drools-docs/drools/DMN/index.html)
- [FEEL Language Handbook](https://kiegroup.github.io/dmn-feel-handbook/#dmn-feel-handbook)
- [Learn DMN in 15 Minutes](https://learn-dmn-in-15-minutes.com/)

---

## 3. Managing Custom Checks

The **Eligibility Checks** view lists all of the custom checks you have created. You can access it from the BDT home screen by selecting the **Eligibility Checks** tab.

From this view, you can:

- View all of your custom checks
- Create a new custom check
- Open an existing check to edit or publish it

> TODO: Add image of Eligibility Checks list view

### Creating a New Check

To create a new custom check, select **Create New Check**. You will be prompted to provide:

- **Name** — a descriptive name for the check (e.g., "Household Income Limit")
- **Module** — the category or group that this check belongs to (e.g., `housing`)
- **Description** — a brief explanation of what the check evaluates

Once created, the check opens in the **Custom Check Editor**, where you define its logic, configure its parameters, test it, and publish it.

---

## 4. The Custom Check Editor

When you open a custom check, you are taken to the **Custom Check Editor**. This editor has four tabs that guide you through the process of building and publishing a check:

- **Parameters** — define configurable inputs for your check
- **DMN Definition** — build the decision logic using the visual DMN editor
- **Testing** — run the check against sample inputs to verify it behaves correctly
- **Publish** — publish a version of the check to make it available in your screeners

> TODO: Add image of Custom Check Editor navigation tabs

---

### 4.1 Parameters

The **Parameters** tab is where you define inputs that can be configured when adding your check to a benefit, rather than being supplied directly by the form.

**What is a parameter?**

Most eligibility checks involve a threshold or reference value — for example, a minimum age or an income limit. Rather than hardcoding that value in your DMN logic, you can expose it as a **parameter**. When you add the check to a benefit, you supply the specific value for that parameter. This makes the check reusable across multiple benefits with different thresholds.

**Example**: A custom income check might expose a `maximumIncome` parameter. When configuring the check on a benefit for Program A, you set `maximumIncome` to 20000. For Program B, you set it to 35000. The same check logic serves both without modification.

**Adding a parameter**:

Select **Create New Parameter** and fill in the following fields:

- **Key** — the internal identifier used in your DMN model to reference this parameter (e.g., `maximumIncome`)
- **Label** — the human-readable name displayed when configuring the check on a benefit
- **Type** — the data type: `string`, `number`, `boolean`, or `date`
- **Required** — whether the parameter must be provided when the check is added to a benefit

> TODO: Add image of Parameters tab and Parameter modal

---

### 4.2 DMN Definition

The **DMN Definition** tab contains the visual DMN editor where you define the decision logic for your check.

The editor provides a graphical canvas for building your DMN model. You can create and connect decision nodes, define input data sources, build decision tables, and organize decisions into a Decision Service.

**Saving your work**:

Select **Save Changes** to persist your DMN model. The save button turns yellow when there are unsaved changes, so you can tell at a glance whether your current edits have been saved.

**Validating your DMN**:

Select **Validate Current DMN** to check your model for structural or syntax errors. If validation issues are found, a summary of the errors is displayed. Resolve all validation errors before testing or publishing your check.

> TODO: Add image of DMN Definition tab

---

### 4.3 Testing

The **Testing** tab lets you run your check against sample input data to verify that it evaluates correctly before publishing.

The screen is split into two panels:

**Left panel — Test Inputs**:

Enter a JSON object representing the form inputs you want to test with. Each key in the JSON should correspond to an input defined in your DMN model.

Example:

```json
{
  "age": 72,
  "state": "California"
}
```

**Right panel — Check Summary**:

Displays information about the check being tested, including its configured parameters and their current values.

**Running a test**:

Select **Run Test** to evaluate the check against your input data. The result is displayed as:

- **Eligible** (green) — the check returned `true`
- **Ineligible** (red) — the check returned `false`
- **Need more information** (yellow) — the check could not determine eligibility from the provided inputs

Use the testing tab iteratively as you build your DMN logic to confirm each rule behaves as expected.

> TODO: Add image of Testing tab with a sample result

---

### 4.4 Publish

The **Publish** tab is where you publish your custom check to make it available in the **Configure Benefit** page of your screeners.

Eligibility checks use semantic versioning. Each time you publish, a new version is created. Previously published versions are preserved and remain available.

> Publishing creates a snapshot of your current DMN model. Subsequent changes to the DMN definition do not affect already-published versions. You must publish again to make new changes available.

**To publish a check**:

Select **Publish Check**. The new version will appear in the **Published Versions** list below, sorted from newest to oldest.

**Published version details**:

Each published version displays:

- **Name** — the check name
- **Version** — the semantic version number (e.g., `1.0.0`)
- **Module** — the module identifier

Once published, the check and its version will appear in the **Your Checks** section when adding eligibility checks to a benefit in any of your screeners.

> TODO: Add image of Publish tab with published versions list
