# Library API

## What is this?

What is now called `library-api` is what used to be at the top-level of this project. It contains a Quarkus application that still serves the [Philly Property Tax Relief Screener](https://phillypropertytaxrelief.org), the example [PACE Screener](https://phillypropertytaxrelief.org/pace), and the [Eligibility API](https://phillypropertytaxrelief.org/q/swagger-ui) that backs both of these screeners. The API is generated from the DMN models in `src/main/resources/`.

## What do we want this to be?

We're not exactly sure, but we see the DMN models here as the proof-of-concept for a "library" of benefits and eligibility rules. We are in the process of creating a tool that will streamline the creation of screeners (the prototype of which you'll find in the `builder-frontend/` and `builder-api` modules of this project) and we imagine know that we'll want users of the builder to have access to some sort of rules library.

So `library-api` will evolve as we figure out the new builder tools. And we'll likely remove the screener code here as the builder is able to replace it.

## Kicking the tires

If you want to play with the example screeners and/or API yourself, you can follow the Development Setup instructions in the root README, then run `bin/dev` from this directory to start the Quarkus development server. This will serve the API and any existing eligibility screeners from `https://localhost:8083` by default.

## Technologies overview

We use a combination of open-source tools ([Kogito](https://kogito.kie.org/) and [form-js](https://bpmn.io/toolkit/form-js/)) with some scaffolding to tie them together and make them easier to use.

Here are some high-level things to orient you...

### DMN Files

DMN files (`.dmn`) can be edited directly in VS Code via the [DMN Editor extension](https://marketplace.visualstudio.com/items?itemName=kie-group.dmn-vscode-extension). If you're using Firebase Studio as described above, then this extension is already installed for you. If you're using another dev environment, then you'll need to install the extension manually.

You may occasionally need to interact with the raw XML text of the DMN; this can be done via the "Reopen with Text Editor" feature of VS Code.

A good orientation on the basics of DMN can be found [here](https://learn-dmn-in-15-minutes.com/).

In this project, DMN (and its accompanying expression language FEEL) acts as the "source code" for a JSON web API. Kogito generates this API (with Java) when you run the Quarkus development server (automatic with Firebase Studio, or by running the `bin/dev` script).

### Form Files

Form files (`.form`) can be edited using [Camunda Modeler](https://camunda.com/download/modeler/). The modeler provides a UI for designing the form's layout and logic (which often incorporates FEEL expressions).

Behind the scenes,the form is saved in JSON format.

When it comes time to use the form in a screener, form-js interprets this JSON and uses it to display the form on a web page.

### Eligibility Screeners

To create the [Philadelphia Property Tax Relief Screener](https://phillypropertytaxrelief.org), we've written a [Qute template](https://quarkus.io/guides/qute) which displays the form, posts data as it is collected to the eligibility API (the one that is built from the DMN), and receives back eligibility results for display on the form.

For future screeners, we envision packaging up this functionality somehow, allowing the entire screening and results process to be included as part of other websites and tools, the content of which is outside the scope of this project.
