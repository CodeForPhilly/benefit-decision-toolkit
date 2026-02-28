# Introduction

## 1. What Is the Benefit Decision Toolkit?

**Benefit Decision Toolkit (BDT)** is a low-code platform for building and publishing custom benefit eligibility screeners to the web.

Using BDT, organizations can quickly create screeners that help individuals determine whether they may qualify for specific benefits. The platform is designed to be simple, flexible, and accessible, enabling teams to:

- Build eligibility screeners without extensive engineering support
- Configure eligibility logic using a guided interface
- Deploy screeners for public or internal use
- Provide users with clear, immediate eligibility results

BDT streamlines the process of translating policy rules into an interactive, user-friendly web experience.

---

## 2. What Is an Eligibility Screener?

An **eligibility screener** is a web-based form that:

1. Collects relevant information from a user
2. Evaluates that information against defined eligibility rules
3. Displays eligibility results based on the evaluation

Each screener consists of two primary components:

### User Interface (Frontend)

The user interface is the form that end users interact with. It:

- Collects required input data
- Guides users through the screening questions
- Displays eligibility results

![An eligibility form for assistance programs. The form asks if the user lives in Philly, their birthday, if they own their house, and which benefits they are enrolled in. The results show that the user is eligible for Food Assistance because they live in Philadelphia, are over 18, and are enrolled in Food Assistance. However, they are ineligible for Heating Assistance because although they are enrolled in Food Assistance and over 18, they do not own their house.](images/example-screener.png)

### Eligibility Logic (Backend)

The eligibility logic defines how user inputs are evaluated. It:

- Applies benefit eligibility rules
- Processes responses
- Determines the final eligibility outcome

Together, these components allow organizations to convert benefit requirements into a structured, automated decision experience.

## Next Steps

The [User Guide](user-guide.md) walks through how to create, configure, and publish a screener using BDT. It provides step-by-step instructions and practical guidance to help you begin building and deploying your own eligibility screeners.
