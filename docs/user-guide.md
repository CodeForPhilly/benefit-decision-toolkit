# User Guide: How To Build an Eligibility Screener on BDT

## 1. Introduction

The Benefit Decision Toolkit is a low-code cloud based platform where users can build eligibly screeners for public benefits.

an open-source, civic tech project that aims to provide an easy and affordable platform for building benefit eligibility screening tools.

### 1.1 Purpose of This Guide

### 1.2 What Is the Platform?

- An eligibility screener is a web accessible form where where users can

Overview of the low-code platform

- What is an eligibility screener?
- Typical use cases (public benefits, services, programs)

### 1.3 Key Concepts at a Glance

- Screener
- Eligibility Check (Reusable Rule)
- Parameters
- Variables
- Form
- Submission
- Results Logic
- Published vs Draft

---

# 2. Platform Overview

## 2.1 User Roles & Permissions

- Admin
- Screener Author
- Viewer
- Publisher
- What each role can/cannot do

## 2.2 Main Navigation Overview

- Dashboard
- Screeners
- Eligibility Checks Library
- Form Builder
- Submissions
- Settings

## 2.3 Typical User Flow

1. Create or open a screener
2. Configure eligibility logic
3. Build the form
4. Preview and test
5. Publish
6. Monitor submissions

---

# 3. Core Concepts Explained

## 3.1 What Is a Screener?

- Definition
- High-level architecture:
  - Frontend (Form)
  - Logic (Eligibility Checks)
  - Output (Results)

## 3.2 Eligibility Checks (Reusable Rules)

- What they are
- Why they are reusable
- Structure of a rule:
  - Inputs
  - Conditions
  - Outputs

- Examples:
  - Income threshold rule
  - Age requirement rule
  - Residency rule

## 3.3 Parameters

- What parameters are
- How parameters customize reusable checks
- Examples:
  - Income limit amount
  - Age minimum
  - Geographic region

## 3.4 Variables & Data Flow

- User inputs
- Derived variables
- How data flows from form → logic → result
- Naming conventions best practices

## 3.5 Decision Logic

- AND vs OR logic
- Nested conditions
- Short-circuit logic (if applicable)
- Fail-fast vs accumulate-failures models

---

# 4. Creating a New Screener

## 4.1 Creating a Screener

- Step-by-step instructions
- Naming conventions
- Description and metadata
- Saving draft

## 4.2 Screener Settings

- Title and branding
- Localization (if applicable)
- Accessibility settings
- Environment (Draft vs Production)

---

# 5. Building Eligibility Logic

## 5.1 Adding Eligibility Checks

- How to add from the reusable library
- Searching and filtering checks
- Attaching checks to a screener

## 5.2 Configuring Parameters

- Editing parameter values
- Setting thresholds
- Linking parameters to form fields
- Required vs optional parameters

## 5.3 Combining Checks

- Sequential logic
- Grouping checks
- Conditional logic (if X then evaluate Y)
- Organizing for readability

## 5.4 Managing Check Dependencies

- Order of execution
- Shared variables
- Avoiding circular logic

## 5.5 Testing Eligibility Logic

- Running test scenarios
- Using sample data
- Reviewing evaluation results
- Debugging failures

---

# 6. Building the Form (Frontend)

## 6.1 Overview of the Form Builder

- Drag-and-drop interface
- Layout panel
- Field settings panel
- Preview mode

## 6.2 Adding Fields

- Text fields
- Number fields
- Dropdowns
- Radio buttons
- Checkboxes
- Date fields
- File uploads (if applicable)

## 6.3 Configuring Field Properties

- Labels
- Help text
- Validation rules
- Required fields
- Default values

## 6.4 Conditional Form Logic

- Show/hide fields
- Dynamic sections
- Progressive disclosure
- Branching logic

## 6.5 Mapping Form Fields to Logic

- Linking fields to variables
- Connecting to eligibility check parameters
- Ensuring consistent naming
- Validating mappings

## 6.6 Form Layout & UX Best Practices

- Grouping related questions
- Minimizing cognitive load
- Accessibility guidelines
- Mobile responsiveness

---

# 7. Results & Output Configuration

## 7.1 Defining Eligibility Outcomes

- Eligible
- Conditionally eligible
- Not eligible
- Partial eligibility

## 7.2 Configuring Results Messaging

- Custom result text
- Conditional messaging
- Next steps instructions
- Referral links

## 7.3 Multi-Program Screeners (If Applicable)

- Program-specific outcomes
- Comparative results
- Tiered eligibility

---

# 8. Previewing and Testing

## 8.1 Using Preview Mode

- Simulating user journey
- Testing edge cases

## 8.2 Test Cases & Scenarios

- Creating test personas
- Documenting expected outcomes
- Regression testing after changes

## 8.3 Debugging Common Issues

- Missing parameter errors
- Unmapped variables
- Conflicting logic
- Validation failures

---

# 9. Publishing a Screener

## 9.1 Pre-Publish Checklist

- Logic validated
- Form validated
- Accessibility check
- Test cases passed
- Review completed

## 9.2 Publishing Process

- Moving from Draft to Published
- Versioning
- Rollback options

## 9.3 Embedding & Sharing

- Public link
- Embedded iframe
- API integration (if applicable)

---

# 10. Managing Screeners Post-Publication

## 10.1 Viewing Submissions

- Filtering submissions
- Exporting data
- Reviewing eligibility decisions

## 10.2 Updating a Live Screener

- Draft vs live version
- Safe editing practices
- Communicating changes

## 10.3 Version History

- Tracking changes
- Restoring prior versions
- Audit logs

---

# 11. Advanced Features (Optional Section)

## 11.1 Reusable Components

- Shared question sets
- Template screeners

## 11.2 Localization & Multi-language Support

## 11.3 Accessibility Compliance

- WCAG standards
- Screen reader support

## 11.4 Integrations

- Data export
- CRM integrations
- Case management systems

---

# 12. Governance & Best Practices

## 12.1 Naming Conventions

## 12.2 Documentation Standards

## 12.3 Testing Protocol

## 12.4 Change Management

## 12.5 Security & Data Privacy Considerations

---

# 13. Troubleshooting Guide

- Common configuration errors
- Performance issues
- Permission issues
- FAQ

---

# 14. Glossary

- Eligibility Check
- Parameter
- Variable
- Screener
- Submission
- Validation
- Conditional Logic

---

# 15. Appendix

## 15.1 Example Screener Walkthrough (End-to-End Example)

- Business scenario
- Logic configuration
- Form configuration
- Results configuration

## 15.2 Sample Logic Patterns

- Income threshold pattern
- Household size adjustment pattern
- Residency verification pattern

---

If you'd like, I can also:

- Convert this into a **docs-as-code style (e.g., for Docusaurus, MkDocs, or GitBook)**
- Tailor it for **non-technical policy users vs technical configuration users**
- Provide a **fully written sample chapter** (e.g., “Building Your First Screener”)
- Or create a **visual architecture diagram** section you can include in the guide\*\*
