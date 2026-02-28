# Introduction

## 1. What Is the Benefit Decision Toolkit?

Organizations that connect people to public benefits spend a lot of time helping individuals determine whether they qualify for specific programs. Building custom tools to support this work typically requires software development resources that many program teams do not have. The **Benefit Decision Toolkit (BDT)** addresses this by providing a low-code platform where organizations can build and publish eligibility screeners without writing code.

BDT provides low-code editors for defining eligibility logic and building a user-facing form. It handles connecting the two and publishing the result to a public URL, giving applicants a way to quickly determine whether they may qualify for a benefit.

---

## 2. What Is an Eligibility Screener?

An **eligibility screener** is a web-based form that:

1. Collects relevant information from a user
2. Evaluates that information against defined eligibility rules
3. Displays eligibility results based on the evaluation

Each screener has two primary components that work together:

### 2.1 User Interface

The user interface is the form that end users interact with. It collects the information needed to evaluate eligibility and displays the results after the form is submitted.

### 2.2 Eligibility Logic

![An eligibility form for assistance programs. The form asks if the user lives in Philly, their birthday, if they own their house, and which benefits they are enrolled in. The results show that the user is eligible for Food Assistance because they live in Philadelphia, are over 18, and are enrolled in Food Assistance. However, they are ineligible for Heating Assistance because although they are enrolled in Food Assistance and over 18, they do not own their house.](images/example-screener.png)

### Eligibility Logic (Backend)

The eligibility logic defines how user inputs are evaluated. It applies the benefit eligibility rules and determines the final eligibility outcome for each benefit the screener covers.

BDT allows you to configure both the user interface form and back-end eligibility logic in low-code editors and then publishes them together as a single, accessible URL.

> TODO: Insert example screenshot of a published screener

---

## 3. Key Concepts

BDT organizes eligibility logic around three core building blocks. Understanding how they relate to each other will help you get oriented before working through the User Guide.

### 3.1 Screeners

A **Screener** is the top-level project in BDT. It represents the complete web experience — including the form and the eligibility logic — for one or more related benefits. When you publish a screener, it becomes available at a public URL.

### 3.2 Benefits

A **Benefit** is a named program that you want to screen applicants for (for example, "SNAP" or "Medicaid"). Each screener can contain one or more benefits, and each benefit is evaluated independently.

A user is eligible for a benefit only if all of its eligibility rules evaluate to `True`.

### 3.3 Eligibility Checks

An **Eligibility Check** is a reusable rule component that evaluates one aspect of eligibility — for example, whether an applicant meets a minimum age threshold or falls within an income limit. Each benefit is composed of one or more eligibility checks.

BDT provides a library of **public checks** covering common eligibility criteria. If the public checks do not meet your needs, you can also create **custom checks** using a built-in DMN decision editor.

---

## Next Steps

- The [User Guide](user-guide.md) walks through the full process of creating, configuring, and publishing a screener — from setting up benefits and eligibility logic to building the form and deploying to a public URL.

- The [Custom Checks](custom-checks.md) guide covers how to build reusable custom eligibility checks when the public check library does not cover your use case.
