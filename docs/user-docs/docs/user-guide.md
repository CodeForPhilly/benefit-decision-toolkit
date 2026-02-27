# User Guide

This section explains how to create, configure, test, and publish an eligibility screener using the Benefit Decision Toolkit (BDT).

---

## 1. Screener Projects

After signing in, you will land on the **Screeners** view. This page displays all of your existing screener projects and serves as your starting point for creating and managing screeners.

From here, you can:

- View existing screeners
- Open and edit a screener
- Create a new screener project

To begin building a new screener, select **Create New Screener** and provide a descriptive name. The name should clearly reflect the benefit or set of benefits being screened.

> TODO: Add image of Screeners view

---

## 2. The Screener Dashboard

When you open a screener project, you are taken to the **Screener Dashboard**.

The Dashboard is the central workspace for your screener. From here, you can:

- Define eligibility logic
- Build and edit the frontend form
- Test the screener
- Publish the screener

At the top of the page, the navigation bar contains four primary workflow tabs:

- **Manage Benefits**
- **Form Editor**
- **Preview**
- **Publish**

These tabs represent the main stages of screener development.

> TODO: Add image of Screener Dashboard

---

## 3. Defining Eligibility Logic (Manage Benefits)

The **Manage Benefits** tab is where you define the eligibility logic used by your screener.

In the BDT platform, a **Benefit** is a configured set of eligibility rules that evaluates whether a user qualifies for a specific program.

When a user submits information through the screener form:

1. The screener collects the user’s inputs.
2. BDT passes those inputs to each configured Benefit.
3. Each Benefit evaluates its eligibility rules.
4. The Benefit returns an eligibility result.
5. The result is displayed to the user on the front-end form.

A single screener can evaluate eligibility for one or multiple benefits. Each benefit’s logic is configured independently within the **Manage Benefits** tab.

This allows a single screener to assess users for multiple related programs while keeping the eligibility rules for each benefit separate and manageable.

### 3.1 Manage Benefits Overview

The **Manage Benefits** tab displays all benefits configured for your screener.

From this page, you can:

- **Create** a new benefit
- **Edit** an existing benefit
- **Delete** a benefit

Selecting a benefit opens the **Configure Benefit** page, where you define or modify its eligibility rules.

> TODO: Add image of Configure Benefit page

---

## 4. Configuring a Benefit

The **Configure Benefit** page is where you define the rules that determine whether a user qualifies for a specific benefit.

Each benefit contains one or more **Eligibility Checks**.

> A user is considered **eligible for the benefit only if all eligibility checks evaluate to `True`.**

---

### What Is an Eligibility Check?

An **Eligibility Check** is a reusable rule component that:

- Accepts one or more user inputs (from your form)
- Evaluates a defined condition
- Returns a boolean result (`True` or `False`)

You configure each check by selecting a check type and setting its parameters.

#### Example

Suppose a benefit requires that applicants:

- Be at least 65 years old
- Live in the state of California

You could configure:

- A **Person Minimum Age** check with a minimum age of `65`
- A **State of Residence** check set to `California`

If **both** checks return `True`, the user is eligible.  
If **either** check returns `False`, the user is not eligible.

By combining multiple eligibility checks, you define the complete eligibility criteria for a benefit.

---

## 5. Adding and Managing Eligibility Checks

On the Configure Benefit page, you will see a list of available eligibility checks.

Checks are organized into two categories:

- **Public Checks** – Prebuilt checks available to all BDT users
- **Your Checks** – Custom checks that you have created

To use a check:

1. Select the check from the list
2. Click **Add**
3. Add values for each of its required configuration parameters

Once added, the check appears in the benefit’s list of configured checks.

> TODO: Add image of check list  
> TODO: Add image of check parameter configuration

For information about creating reusable custom checks, see [Custom Checks](custom-checks.md).
