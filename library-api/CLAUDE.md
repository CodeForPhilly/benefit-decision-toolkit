# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Quarkus application that generates REST APIs from DMN (Decision Model and Notation) files using Kogito. The application serves eligibility screeners for benefits programs (e.g., Philadelphia Property Tax Relief) and provides an automatically generated API based on DMN decision models.

The core concept: **DMN files act as "source code" for a JSON web API.** When you run the Quarkus dev server, Kogito automatically generates Java REST endpoints from the DMN models in `src/main/resources/`.

## Common Commands

### Development
```bash
# Start the Quarkus dev server (serves API and screeners at https://localhost:8083)
bin/dev

# Build the application
mvn clean package

# Run API tests
cd test/bdt && bru run

# Clean and rebuild (useful when DMN files are modified)
mvn clean compile
```

### Testing with Bruno
Tests are located in `test/bdt/` and use Bruno (API testing tool):
- Test configuration: `test/bdt/collection.bru` (defines host: http://localhost:8083)
- Tests are organized by decision model (Age, Enrollment, Benefits)
- Example: `test/bdt/Benefits/PhlHomesteadExemption/Homestead.bru`

## Code Architecture

### DMN Decision Models (src/main/resources/)

The project uses a modular DMN structure:

1. **BDT.dmn** - "Base Decision Toolkit"
   - Root model that defines shared data types (tSituation, tPerson, tPersonList, tPeriod, etc.)
   - Provides common business knowledge models (BKMs) like "age as of date"
   - Imports reusable models (Age, Enrollment)
   - Acts as a shared context for all benefit eligibility checks

2. **Modular DMN Files**:
   - `age/` - Age-related checks (PersonMinAge, SomeoneMinAge, Age.dmn)
   - `enrollment/` - Enrollment checks (PersonEnrolledInBenefit, PersonNotEnrolledInBenefit, Enrollment.dmn)
   - `benefits/` - Specific benefit rules (PhlHomesteadExemption.dmn, Benefits.dmn)

3. **DMN Import Hierarchy**:
   - Benefit DMN files import BDT.dmn and other needed models
   - BDT.dmn imports shared modules (Age, Enrollment)
   - This allows composition of complex eligibility logic from reusable components

4. **Decision Services**:
   - Each benefit DMN typically defines a Decision Service (e.g., "PhlHomesteadExemption")
   - Kogito generates REST endpoints from Decision Services
   - Endpoints accept a "situation" (tSituation type) and return eligibility results

### Code Generation

**IMPORTANT**: When the Quarkus dev server runs, Kogito generates Java code in `target/generated-sources/kogito/`:
- REST Resources (e.g., `BenefitsResource.java`, `AgeResource.java`)
- Application configuration classes
- These files are regenerated on each build - DO NOT edit them directly

To modify API behavior, edit the DMN files, not the generated Java code.

### Java Source Code

Custom Java code is minimal:
- `src/main/java/org/codeforphilly/bdt/functions/LocationService.java` - Database service for location lookups
  - Uses SQLite database (`src/main/resources/data/locations.db`)
  - Provides static `lookup()` method callable from FEEL expressions in DMN

### Configuration

`src/main/resources/application.properties`:
- Enables Swagger UI at `/q/swagger-ui`
- Configures SQLite datasource (embedded in resources)
- Disables dev services and continuous testing

### FEEL Expressions

DMN uses FEEL (Friendly Enough Expression Language):
- FEEL expressions in DMN can reference `situation` context and BDT functions
- Can invoke custom Java functions (e.g., `LocationService.lookup()`)
- Can call other decision services and BKMs from imported models
- Examples in `src/main/resources/checks-examples.md` and `src/main/resources/exampleInputs.jsonc`

## Working with DMN Files

### Editing DMN
- Use the [DMN Editor VS Code extension](https://marketplace.visualstudio.com/items?itemName=kie-group.dmn-vscode-extension)
- Learn DMN basics at https://learn-dmn-in-15-minutes.com/
- Access raw XML via "Reopen with Text Editor" when needed

### API Generation Flow
1. Edit DMN file (e.g., add new decision or modify logic)
2. Save the file
3. Quarkus dev mode (via `bin/dev`) auto-detects the change
4. Kogito regenerates Java REST endpoints
5. New/updated API is immediately available
6. Check `/q/swagger-ui` to see generated endpoints

### Testing DMN Changes
1. Start dev server: `bin/dev`
2. Use Bruno tests in `test/bdt/` to test generated endpoints
3. Or use Swagger UI at http://localhost:8083/q/swagger-ui

## Data Model Conventions

### tSituation Type
The standard input type for benefit checks:
```
tSituation {
  primaryPersonId: string
  people: tPersonList  // array of {id: string, dateOfBirth: date}
  enrollments: tEnrollmentList  // array of {personId: string, benefit: string}
}
```

### Benefit Decision Services
- Input: situation (tSituation)
- Output: typically boolean or context with eligibility details
- Often includes a "checks" decision that breaks down individual eligibility criteria

## Dynamic Decision Service Invocation

**DecisionServiceInvoker** (`src/main/java/org/codeforphilly/bdt/functions/DecisionServiceInvoker.java`) provides a programmatic way to dynamically invoke decision services at runtime without requiring static DMN imports.

### Usage in Java Code

The invoker can be used in two ways:

**1. Via CDI Injection (Recommended)**:
```java
@Inject
DecisionServiceInvoker invoker;

public void someMethod() {
    Map<String, Object> situation = createSituation();
    Map<String, Object> parameters = createParameters();

    Object result = invoker.invokeInternal(
        "benefits",              // Model name (from DMN file's name attribute)
        "PhlHomesteadExemption", // Decision service name
        situation,
        parameters
    );
}
```

**2. Via Static Method**:
```java
Object result = DecisionServiceInvoker.invoke(
    "benefits",
    "PhlHomesteadExemption",
    situation,
    parameters
);
```

### Model Registry

The invoker maintains a registry of known models and their namespaces. To add a new model, update the `getKnownModels()` method in `DecisionServiceInvoker.java`:

```java
known.put("modelName", "https://kie.apache.org/dmn/YOUR-MODEL-NAMESPACE");
```

Current registered models:
- `benefits` - PhlHomesteadExemption and related benefit decisions
- `Benefits` - Parent benefits model
- `age` - Age calculation utilities
- `Enrollment` - Enrollment checking utilities
- `BDT` - Base Decision Toolkit (shared types and BKMs)

### Limitations

- **FEEL Integration**: Direct invocation from FEEL expressions (e.g., in DMN files) is not currently supported due to Kogito's FEEL engine not recognizing Java package notation
- **Model Discovery**: Models must be manually registered in the `getKnownModels()` method
- **Static Method CDI**: The static `invoke()` method relies on CDI container lookup, which may have limitations in certain contexts

### Future Enhancements

- Auto-discovery of models from classpath/resources
- Configuration-based model registration (application.properties)
- BKM wrapper for FEEL-accessible invocation
- Enhanced error reporting with available models/services

## Technology Stack
- **Quarkus 2.16.10**: Java application framework
- **Kogito 1.44.1**: DMN/BPMN decision automation
- **Java 17**: Runtime version
- **Maven**: Build tool
- **SQLite**: Embedded database for location data
- **Bruno**: API testing (replaces Thunder Client)
- Remember that imported decision services can't be named the same, even if they are in different models