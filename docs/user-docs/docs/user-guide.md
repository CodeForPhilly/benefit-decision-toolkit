# User Guide

This section explains how to create, configure, test, and publish an eligibility screener using Benefit Decision Toolkit (BDT).

---

## 1. Screener Projects

After signing in, you will land on the **Screeners** view. This page displays all of your existing screener projects and serves as your starting point for creating and managing screeners.

From here, you can:

- View existing screeners
- Open and edit a screener
- Create a new screener project

To begin building a new screener, select **Create New Screener** and provide a descriptive name. The name should clearly reflect the benefit or set of benefits being screened.

![Benefit Decision Toolkit homepage featuring a welcome message and an option to create a new screener. The page includes a navigation bar with options for 'Screeners' and 'Eligibility checks'. There is also a card labeled 'Food & Heating Assistance' with a menu option indicated by three dots.](images/screeners-view.png)

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

![Manage Benefits page of the Benefit Decision Toolkit. The page allows users to define and organize benefits available in their screener, with each benefit having associated eligibility checks. There is a 'Create New Benefit' button at the top. Two benefits are listed: Food Assistance, described as 'Help with affording groceries,' and Heating Assistance, described as 'Discount on PGW bill.' Each benefit has 'Edit' and 'Remove' buttons for managing the entries. The navigation bar at the top includes links to Food & Heating Assistance, Manage Benefits, Form Editor, Preview, and Publish.](images/manage-benefits.png)

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

Selecting "edit" on a benefit opens the **Configure Benefit** page, where you define or modify its eligibility rules.

---

## 4. Configuring a Benefit

The **Configure Benefit** page is where you define the rules that determine whether a user qualifies for a specific benefit.

![Configure Benefit: Food Assistance page of the Benefit Decision Toolkit. The page allows users to browse and select pre-built eligibility checks to add to the Food Assistance benefit. The interface includes tabs for 'Public checks' and 'Your checks.' The table lists several checks with columns for 'Add,' 'Check Name,' 'Description,' and 'Version.' The checks listed are 'Someone-min-age,' 'Person-min-age,' 'Person-max-age,' 'Owner-occupant,' and 'Person-enrolled-in-benefit,' all with version 0.6.0. There is a 'Back' button in the upper right corner, and the navigation bar at the top includes links to 'Food & Heating Assistance,' 'Manage Benefits,' 'Form Editor,' 'Preview,' and 'Publish.](images/configure-benefit-1.png)

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

Once added, the check appears in the benefit’s list of configured checks. Click on the check to edit its parameters.

![Configure Check: Person-min-age dialog box in the Benefit Decision Toolkit. The dialog box allows users to set parameters for the Person-min-age check. The parameters include PersonId set to 'applicant', AsOfDate set to '02/28/2026', and MinAge set to '18'. The dialog box has Cancel and Confirm buttons at the bottom. The background shows a list of eligibility checks with options to add more checks such as Person-not-enrolled-in-benefit, Lives-in-philadelphia, and Person-min-age with their respective parameters.](images/configure-check.png)

For information about creating reusable custom checks, see [Custom Checks](custom-checks.md).

## 6. Editing the Screener Form

The **Form Editor** tab is where you create and update the screener form that will be presented to the benefit seeker or benefit analyst.

You can drag and drop components from the **Components** panel on the left, into the form view in the center.

![Screenshot of the Benefit Decision Toolkit interface showing the Form Editor for a food assistance form. The image highlights the 'Checkbox group' component in the 'Selection' section, indicated by a red circle and an arrow pointing to the 'Checkbox group' option. The form includes fields such as 'Do you live in Philly?', 'Enter your birthday', 'Do you own your house?', and a checkbox for 'Select benefit you are enrolled in'. The interface includes tabs for 'Food & Heating Assistance', 'Manage Benefits', 'Form Editor', 'Preview', and 'Publish'. There is also a 'Save' button and an option to 'Validate Form Outputs'.](images/form-editor-components.png)

Click on a component in the form view to edit it. You can add a **label** for the user to read. The **key** represents the eligibility check paramter that the component references.

![Screenshot of the Benefit Decision Toolkit's Form Editor interface. The form includes a 'Yes/No' component asking 'Do you live in Philly?' with options for 'Yes' and 'No'. The component settings on the right side show the 'Key' field populated with 'simpleChecks.livesInPhiladelphia' and the 'Field label' field populated with 'Do you live in Philly?'. The form also includes fields for entering a birthday, a question about home ownership, and a checkbox for selecting a benefit. The interface includes various input, selection, and presentation components on the left side for building the form. There is a 'Save' button at the top right and a 'Validate Form Outputs' button at the bottom right.](images/form-editor-parameters.png)

Click the save button to save your work.

## 7. Preview the Screener

The **Preview** tab is where you test your screener form.

![Screenshot of the Benefit Decision Toolkit's form preview interface. The form includes several questions: 'Do you live in Philly?' with 'Yes' selected, a field to 'Enter your birthday' with the date '02 / 01 / 1990' filled in, 'Do you own your house?' with 'Yes' selected, and a checkbox to 'Select benefit you are enrolled in' with 'Food Assistance' selected. Below the form, the 'Results' section shows the 'Inputs' with the following data: simpleChecks: { "livesInPhiladelphiaPa": true, "ownerOccupant": true }.](images/preview-inputs.png)

The results sections updates when selections are made to show the user's eligibility for each benefit, and it shows if each eligibility check is passing, failing or unknown.

![Results section of a benefits eligibility tool. The Inputs section shows the following data: simpleChecks: { "livesInPhiladelphiaPa": true, "ownerOccupant": true }, people: { "applicant": { "dateOfBirth": "1990-02-01", "enrollments": [ "Food Assistance" ] } }. The Benefits section shows the following eligibility results: Food Assistance: Eligible, lives-in-philadelphia-pa (residence v0.6.0), person-in-phil-age (age v0.6.0), minAge=18, personId=applicant, asOfDate=2026-02-28. Heating Assistance: Eligible, person-enrolled-in-benefit (enrollment v0.6.0), personId=applicant, benefit=Food Assistance, person-min-age (age v0.6.0), minAge=18, personId=applicant, asOfDate=2026-02-28, owner-occupant (residence v0.6.0).](images/preview-results.png)

Once you are satisfied with the functionality of your screener, you can publish it.

## 8. Publish the Screener

The **Publish** tab is where you deploy your finished screener to its own web page, where it can be used by anyone who has access to the URL.

Use the **Deploy Screener** button to publish the screener in its current state.

![Benefit Decision Toolkit interface showing the Food & Heating Assistance section. The top navigation bar includes links to Food & Heating Assistance, Manage Benefits, Form Editor, Preview, and Publish, with Publish being the active tab. The top right corner has options to go back to the home page or log out. The main content area displays the Food & Heating Assistance screener URL (https://bdt-builder.web.app/screener/WhDnYoKF9VM5994CNZuO) and the last published date (Feb 28, 2026, 12:56 PM). There is a prominent 'Deploy Screener' button with the description 'Deploy current working version to your public screener.'](images/publish.png)

When you go the screener page at the link provided, you will be presented with the screener in a similar format to the preview, but without the screener builder interface surrounding it. The screener can now be utilized.

![The image shows a form and eligibility results for Food & Heating Assistance. The form asks if the user lives in Philly, with "Yes" selected, and prompts the user to enter their birthday, which is filled in as 2/18/1990. It also asks if the user owns their house, with "No" selected, and allows the user to select the benefit they are enrolled in, with "Food Assistance" chosen. The eligibility results section indicates that the user is eligible for Food Assistance, meeting criteria such as residence in Philadelphia and being at least 18 years old. However, the user is ineligible for Heating Assistance because, although they meet age and enrollment criteria, they do not meet the owner-occupant residence requirement.](images/published-screener.png)
