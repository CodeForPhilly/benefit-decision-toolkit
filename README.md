<img width="400" alt="bdt-logo-large-color-dark" src="https://github.com/user-attachments/assets/d26a8869-970a-43b2-89b0-b4266754ae21" />
<br>
<br>

**Use [DMN](https://www.omg.org/dmn/) and [FEEL](https://docs.camunda.io/docs/components/modeler/feel/what-is-feel/) to create APIs and Screeners for public benefit rules.**

## Motivation

Why hire a team of software engineers to codify rules that your benefit experts already know inside and out?

Why design a screening tool from scratch when your goal is simply to deploy a functionally accurate service as quickly as possible?

***Benefit Decision Toolkit simplifies the management of eligibility rules and screeners so motivated subject matter experts can create useful tools with less hand-holding from traditional software teams.***

## Links

Try out an [example elegibility screener](https://phillypropertytaxrelief.org/) that was built with BDT, and directly interact with the [API of the screener](https://phillypropertytaxrelief.org/q/swagger-ui/)

If you are interested in getting involved with the project, check out [our page on the Code For Philly website](https://codeforphilly.org/projects/dmn_benefit_toolbox-including_the_philly_property_tax_relief_screener)

## User-Facing Technologies

[Decision Model and Notation (DMN)](https://learn-dmn-in-15-minutes.com/) is used to define the logic of the screener forms.

[Form JS](https://bpmn.io/toolkit/form-js) is used to define the user interface of the screener forms.

## Developer-Facing Technologies

[Quarkus](https://quarkus.io/) is used to serve APIs.

[Solid JS](https://docs.solidjs.com/) is used to build the frontend of the web app.

## Navigating the Codebase

[builder-api](/builder-api) and [builder-frontend](/builder-frontend) comprise the web app used to build eligibility screeners.

[screener-api](/screener-api) and [screener-frontend](/screener-frontend) comprise the screener experience that the builder app deploys.

[library-api](/library-api) contains a system for building eleigibility APIs using a preconfigured IDE.

## Local Development Setup

```bash
git clone https://github.com/CodeForPhilly/benefit-decision-toolkit.git

cd benefit-decision-toolkit
```

You can find instructions to work on each app within the project in their respective directories, which are linked above.

Note that for the frontend apps, you will need an environment variable file from a teammate. Please do not commit this file to the repo.
