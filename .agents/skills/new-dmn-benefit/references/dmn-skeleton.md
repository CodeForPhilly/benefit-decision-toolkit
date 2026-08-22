# Benefit DMN skeleton

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
    xmlns:included1="{BENEFITS_NAMESPACE}"
    xmlns:included2="{CHECK_1_NAMESPACE}"
    ...
    xmlns:includedN="{BDT_NAMESPACE}"
    ...
    id="_{DEFINITIONS_UUID}"
    name="{BenefitName}"
    typeLanguage="http://www.omg.org/spec/DMN/20180521/FEEL/"
    namespace="https://kie.apache.org/dmn/_{MODEL_NAMESPACE_UUID}">
  <dmn:extensionElements/>

  <!-- Imports: Benefits.dmn first, then checks, then BDT, then category base modules -->
  <dmn:import id="_{UUID}" name="Benefits"
      namespace="https://kie.apache.org/dmn/_9514D95A-63FB-4345-911B-D83E1867F709"
      locationURI="{relative path to Benefits.dmn}"
      importType="http://www.omg.org/spec/DMN/20180521/MODEL/"/>
  <!-- One import per selected check -->
  <dmn:import id="_{UUID}" name="{CheckModelName}"
      namespace="{checkNamespace}"
      locationURI="{relative path to check DMN}"
      importType="http://www.omg.org/spec/DMN/20180521/MODEL/"/>
  <!-- BDT import -->
  <dmn:import id="_{UUID}" name="BDT"
      namespace="https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79"
      locationURI="{relative path to BDT.dmn}"
      importType="http://www.omg.org/spec/DMN/20180521/MODEL/"/>
  <!-- Category base module imports (only if types are referenced) -->
  <dmn:import id="_{UUID}" name="{CategoryName}"
      namespace="{categoryNamespace}"
      locationURI="{relative path to category base DMN}"
      importType="http://www.omg.org/spec/DMN/20180521/MODEL/"/>

  <!-- Type definitions -->
  <dmn:itemDefinition id="_{UUID}" name="tSituation" isCollection="false">
    <!-- Union of fields from all selected checks' tSituation -->
  </dmn:itemDefinition>
  <!-- tSimpleChecks, tPerson, tPeople only if needed -->

  <!-- Decision Service -->
  ...
  <!-- checks decision with context entries -->
  ...
  <!-- isEligible decision -->
  ...
  <!-- situation inputData -->
  ...
  <!-- DMNDI -->
  ...
</dmn:definitions>
```
