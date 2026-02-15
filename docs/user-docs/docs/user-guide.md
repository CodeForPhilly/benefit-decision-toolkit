# Building an Eligibility Screener

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

A single screener can evaluate eligibility for one or multiple benefits. The evaluation logic for each benefit is configured separately. This design a single BDT screener to screens users for multiple related programs, while keeping management of each benefit seperate.

> TODO: Add image of Manage Benefits tab

### 3.1 Benefits Overview

When you open the **Manage Benefits** tab, you will see a list of benefits associated with the screener.

From this page, you can:

- Create a new benefit
- Edit an existing benefit
- Remove a benefit

Selecting a benefit opens the **Configure Benefit** page.

> TODO: Add image of Configure Benefit page

---

## 4. Configuring a Benefit

The **Configure Benefit** page is where you define the rules that determine eligibility.

Eligibility logic in BDT is built using **Eligibility Checks**.

### What Is an Eligibility Check?

An **Eligibility Check** is a reusable rule component that:

- Accepts one or more user inputs
- Evaluates a defined condition
- Returns a boolean result (True or False)

For example, a rule might require applicants to be at least 65 years old. You could add a _Person Minimum Age_ check and configure the minimum age parameter to `65`.

By combining multiple checks, you define the full set of eligibility rules for a benefit.

Currently, a benefit evaluates as **eligible** only if _all_ of its eligibility checks return `True`.

---

## 5. Adding and Managing Eligibility Checks

On the Configure Benefit page, you will see a list of available eligibility checks.

Checks are organized into two categories:

- **Public Checks** – Prebuilt checks available to all BDT users
- **Your Checks** – Custom checks that you have created

To use a check:

1. Select the check from the list
2. Click **Add**
3. Configure its parameters

Once added, the check appears in the benefit’s list of configured checks.

> TODO: Add image of check list  
> TODO: Add image of check parameter configuration

For information about creating reusable custom checks, see **Creating Custom Checks**.
