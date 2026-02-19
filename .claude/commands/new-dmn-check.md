---
name: new-dmn-check
description: Create a new DMN eligibility check in library-api — generates the DMN XML and Bruno test files
argument-hint: "[CheckName] [category]"
disable-model-invocation: true
---

Create a new DMN eligibility check in library-api. Arguments: `$ARGUMENTS` (optional — check name in PascalCase and/or category, e.g. `PersonMinIncome income`).

## Step 1 — Gather Requirements

Parse `$ARGUMENTS` if provided:
- First token (PascalCase word) → check name (e.g. `PersonMinIncome`)
- Second token (lowercase word) → category (e.g. `income`)

If either is missing, ask the user for:
1. **Check name** — PascalCase, globally unique (e.g. `PersonMinIncome`). Derive the file name by converting to kebab-case (e.g. `person-min-income.dmn`) and the service name by appending `Service` (e.g. `PersonMinIncomeService`).
2. **Category** — existing (`age`, `enrollment`) or a new category name.
3. **Description** — one sentence describing what eligibility condition is checked.
4. **Parameters** beyond `situation` — for each: name, FEEL type (`string`, `number`, `date`, `boolean`), and purpose.
5. **FEEL logic** — either a FEEL expression or a plain-English description. Describe which `situation` fields are used (e.g. `situation.people`, `situation.enrollments`, `situation.simpleChecks.*`).
6. **Does the logic need intermediate values?** — Yes → context-chain pattern; No → simple literal expression pattern.

## Step 2 — Validate Before Generating

Run these checks before writing any files:

**A. Model name uniqueness** — Search all existing DMN files:
```
Grep for: name="{CheckName}"
Path: library-api/src/main/resources/**/*.dmn
```
If a match is found, warn the user and stop. The name must be globally unique.

**B. Category directory** — Check if `library-api/src/main/resources/checks/{category}/` exists.
- If it exists, note the base module file (e.g. `Age.dmn`, `Enrollment.dmn`) and its namespace URI for importing.
- If it doesn't exist, warn the user that a base module DMN must be created first for the new category (with its own namespace URI, types, and BKMs), and offer to create a minimal one.

**C. Existing checks in category** — List existing check DMNs in the category directory so the user can confirm there are no near-duplicate checks.

## Step 3 — Generate the DMN File

**File path**: `library-api/src/main/resources/checks/{category}/{check-name}.dmn`

**Rules**:
- Generate fresh UUID v4 values for every `id` attribute (format: `_XXXXXXXX-XXXX-4XXX-XXXX-XXXXXXXXXXXX` using uppercase hex). Each UUID must be unique within the file.
- The model's own `namespace` attribute is a fresh UUID URI: `https://kie.apache.org/dmn/_{UUID}`.
- BDT namespace is always: `https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79`
- BDT `locationURI`: use `../BDT.dmn` for checks directly in `checks/{category}/` (one level deep). Use `../../BDT.dmn` if nested deeper.
- Category base module `locationURI`: `{Category}.dmn` (same directory, relative).
- Decision Service name: exactly `{CheckName}Service`.
- Decision Service output type: `BDT.tCheckResponse`.
- The output decision must be named `checkResult` with `typeRef="boolean"`.
- `tParameters` item definition includes all check-specific parameters.
- `tSituation` item definition includes only the fields the check actually reads (keep it minimal — don't copy BDT's full tSituation).

### Template A — Simple Literal Expression

Use when the FEEL logic is a single expression with no intermediate values needed.

Based on `person-enrolled-in-benefit.dmn`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions
    xmlns:dmn="http://www.omg.org/spec/DMN/20180521/MODEL/"
    xmlns="https://kie.apache.org/dmn/_{MODEL_NAMESPACE_UUID}"
    xmlns:feel="http://www.omg.org/spec/DMN/20180521/FEEL/"
    xmlns:kie="http://www.drools.org/kie/dmn/1.2"
    xmlns:dmndi="http://www.omg.org/spec/DMN/20180521/DMNDI/"
    xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
    xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
    xmlns:included1="https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79"
    id="_{DEFINITIONS_UUID}"
    name="{CheckName}"
    typeLanguage="http://www.omg.org/spec/DMN/20180521/FEEL/"
    namespace="https://kie.apache.org/dmn/_{MODEL_NAMESPACE_UUID}">
  <dmn:description>{One sentence description}</dmn:description>
  <dmn:extensionElements/>
  <dmn:import id="_{IMPORT_BDT_UUID}" name="BDT"
      namespace="https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79"
      locationURI="../BDT.dmn"
      importType="http://www.omg.org/spec/DMN/20180521/MODEL/"/>
  <!-- Add category base module import here if needed (e.g. Enrollment.dmn, Age.dmn) -->

  <dmn:itemDefinition id="_{TPARAMS_UUID}" name="tParameters" isCollection="false">
    <!-- One dmn:itemComponent per parameter -->
    <dmn:itemComponent id="_{PARAM1_UUID}" name="{paramName}" isCollection="false">
      <dmn:typeRef>{feelType}</dmn:typeRef>
    </dmn:itemComponent>
  </dmn:itemDefinition>

  <dmn:itemDefinition id="_{TSITUATION_UUID}" name="tSituation" isCollection="false">
    <!-- Only the fields this check actually reads from situation -->
    <!-- Example for enrollment check: -->
    <dmn:itemComponent id="_{SITUATION_FIELD_UUID}" name="enrollments" isCollection="false">
      <dmn:typeRef>Enrollment.tEnrollmentList</dmn:typeRef>
    </dmn:itemComponent>
  </dmn:itemDefinition>

  <dmn:decisionService id="_{DS_UUID}" name="{CheckName}Service">
    <dmn:extensionElements/>
    <dmn:variable id="_{DS_VAR_UUID}" name="{CheckName}Service" typeRef="BDT.tCheckResponse"/>
    <dmn:outputDecision href="#{DECISION_UUID}"/>
    <dmn:inputData href="#{SITUATION_INPUT_UUID}"/>
    <dmn:inputData href="#{PARAMS_INPUT_UUID}"/>
  </dmn:decisionService>

  <dmn:decision id="_{DECISION_UUID}" name="checkResult">
    <dmn:extensionElements/>
    <dmn:variable id="_{DECISION_VAR_UUID}" name="checkResult" typeRef="boolean"/>
    <dmn:informationRequirement id="_{IR1_UUID}">
      <dmn:requiredInput href="#{SITUATION_INPUT_UUID}"/>
    </dmn:informationRequirement>
    <dmn:informationRequirement id="_{IR2_UUID}">
      <dmn:requiredInput href="#{PARAMS_INPUT_UUID}"/>
    </dmn:informationRequirement>
    <dmn:literalExpression id="_{EXPR_UUID}">
      <dmn:text>{FEEL expression}</dmn:text>
    </dmn:literalExpression>
  </dmn:decision>

  <dmn:inputData id="_{SITUATION_INPUT_UUID}" name="situation">
    <dmn:extensionElements/>
    <dmn:variable id="_{SITUATION_VAR_UUID}" name="situation" typeRef="tSituation"/>
  </dmn:inputData>
  <dmn:inputData id="_{PARAMS_INPUT_UUID}" name="parameters">
    <dmn:extensionElements/>
    <dmn:variable id="_{PARAMS_VAR_UUID}" name="parameters" typeRef="tParameters"/>
  </dmn:inputData>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="_{DIAGRAM_UUID}" name="DRG">
      <di:extension>
        <kie:ComponentsWidthsExtension>
          <kie:ComponentWidths dmnElementRef="_{EXPR_UUID}">
            <kie:width>917</kie:width>
          </kie:ComponentWidths>
        </kie:ComponentsWidthsExtension>
      </di:extension>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</dmn:definitions>
```

### Template B — Context Chain

Use when the FEEL logic needs intermediate computed values (e.g. extract a field, call a BKM, then compare).

Based on `person-min-age.dmn`. The decision body uses a `dmn:context` instead of `dmn:literalExpression`:

```xml
  <dmn:decision id="_{DECISION_UUID}" name="checkResult">
    <dmn:extensionElements/>
    <dmn:variable id="_{DECISION_VAR_UUID}" name="checkResult" typeRef="boolean"/>
    <dmn:informationRequirement id="_{IR1_UUID}">
      <dmn:requiredInput href="#{SITUATION_INPUT_UUID}"/>
    </dmn:informationRequirement>
    <dmn:informationRequirement id="_{IR2_UUID}">
      <dmn:requiredInput href="#{PARAMS_INPUT_UUID}"/>
    </dmn:informationRequirement>
    <!-- Add dmn:knowledgeRequirement here if calling a BKM from an imported module:
    <dmn:knowledgeRequirement id="_{KR_UUID}">
      <dmn:requiredKnowledge href="{importedModuleNamespace}#{bkmId}"/>
    </dmn:knowledgeRequirement>
    -->
    <dmn:context id="_{CONTEXT_UUID}">
      <!-- Named intermediate value entries -->
      <dmn:contextEntry>
        <dmn:variable id="_{VAR1_UUID}" name="{intermediateName}" typeRef="{feelType}"/>
        <dmn:literalExpression id="_{EXPR1_UUID}">
          <dmn:text>{FEEL expression for this step}</dmn:text>
        </dmn:literalExpression>
      </dmn:contextEntry>
      <!-- ... more entries as needed ... -->
      <!-- Final (unnamed) entry returns the boolean result -->
      <dmn:contextEntry>
        <dmn:literalExpression id="_{FINAL_EXPR_UUID}">
          <dmn:text>{final boolean expression, e.g.: result}</dmn:text>
        </dmn:literalExpression>
      </dmn:contextEntry>
    </dmn:context>
  </dmn:decision>
```

The rest of the file structure (imports, itemDefinitions, inputData, decisionService, DMNDI) is identical to Template A.

**BKM knowledge requirement note**: When calling a BKM from an imported module (e.g. `Age.as of date(...)`), the `<dmn:knowledgeRequirement>` href must reference the imported module's namespace URI followed by `#` and the BKM's `id` attribute in that file. Find the BKM id by reading the base module DMN. Use namespace-qualified calls in FEEL: `{ImportAlias}.{bkmName}(...)`.

## Step 4 — Generate Bruno Test Files

**Directory**: `library-api/test/bdt/checks/{category}/{CheckName}/`

Create two files:

**Pass.bru** — a request that should make `checkResult` evaluate to `true`:
```bru
meta {
  name: Pass
  type: http
  seq: 1
}

post {
  url: {{host}}/checks/{category}/{check-name}
  body: json
  auth: inherit
}

body:json {
  {
    "situation": {
      {situationFieldsForPassCase}
    },
    "parameters": {
      {parametersForPassCase}
    }
  }
}

assert {
  res.body.checkResult: eq true
  res.status: eq 200
}
```

**Fail.bru** — a request that should make `checkResult` evaluate to `false`:
```bru
meta {
  name: Fail
  type: http
  seq: 2
}

post {
  url: {{host}}/checks/{category}/{check-name}
  body: json
  auth: inherit
}

body:json {
  {
    "situation": {
      {situationFieldsForFailCase}
    },
    "parameters": {
      {parametersForFailCase}
    }
  }
}

assert {
  res.body.checkResult: eq false
  res.status: eq 200
}
```

Use realistic test data: concrete IDs (e.g. `"p1"`), dates (ISO 8601), and parameter values that clearly demonstrate the pass vs. fail condition.

## Step 5 — Print a Summary and Next-Steps Checklist

After writing all files, print:

```
## Files Created

- library-api/src/main/resources/checks/{category}/{check-name}.dmn
- library-api/test/bdt/checks/{category}/{CheckName}/Pass.bru
- library-api/test/bdt/checks/{category}/{CheckName}/Fail.bru

## Next Steps

- [ ] Start (or restart) the dev server: `cd library-api && quarkus dev`
      (or `devbox services up` if using the full stack)
- [ ] Verify the endpoint appears in Swagger UI:
      http://localhost:8083/q/swagger-ui  (look for POST /checks/{category}/{check-name})
- [ ] Run Bruno tests: `cd library-api/test/bdt && bru run checks/{category}/{CheckName}`
- [ ] If you created a new category, create the base module DMN first:
      library-api/src/main/resources/checks/{category}/{Category}.dmn
```

---

## Critical Constraints (always enforce)

1. **Model name uniqueness** — check all `.dmn` files before generating. Stop if duplicate found.
2. **Service name** — must be exactly `{CheckName}Service`. No variations.
3. **File name** — kebab-case, `.dmn` extension (e.g. `person-min-income.dmn`).
4. **Namespace-qualified references** — when calling imported BKMs or decisions, always prefix with the import alias (e.g. `Age.as of date(...)`, `BDT.tCheckResponse`).
5. **No circular imports** — checks import BDT.dmn and their category base module only; they must not import other checks.
6. **BDT import path** — relative to the check file: `../BDT.dmn` for `checks/{category}/` files.
7. **Fresh UUIDs** — generate a new UUID v4 for every `id` attribute. Never reuse UUIDs from example files.
8. **tSituation is local and minimal** — define only the `situation` fields this check actually reads. Do not copy BDT's full tSituation definition.
9. **Output decision named `checkResult`** — the boolean output decision must always be named `checkResult`.
