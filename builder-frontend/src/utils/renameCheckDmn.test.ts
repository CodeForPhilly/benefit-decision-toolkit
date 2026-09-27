import { describe, expect, it } from "vitest";
import { getMarshaller } from "@kie-tools/dmn-marshaller";
import { renameCheckDmn } from "./renameCheckDmn";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20240513/MODEL/"
  id="model" name="Income check" namespace="https://example.org/check">
  <dmn:decision id="check" name="Income check">
    <dmn:variable id="check-variable" name="Income check" typeRef="boolean"/>
    <dmn:literalExpression id="check-expression"><dmn:text>true</dmn:text></dmn:literalExpression>
  </dmn:decision>
  <dmn:decision id="dependent" name="Dependent">
    <dmn:variable id="dependent-variable" name="Dependent" typeRef="boolean"/>
    <dmn:informationRequirement id="requirement"><dmn:requiredDecision href="#check"/></dmn:informationRequirement>
    <dmn:literalExpression id="dependent-expression"><dmn:text>Income check and Income check</dmn:text></dmn:literalExpression>
  </dmn:decision>
  <dmn:decision id="string" name="String">
    <dmn:variable id="string-variable" name="String" typeRef="string"/>
    <dmn:literalExpression id="string-expression"><dmn:text>"Income check"</dmn:text></dmn:literalExpression>
  </dmn:decision>
  <dmn:decision id="local" name="Local">
    <dmn:variable id="local-variable" name="Local"/>
    <dmn:literalExpression id="local-expression"><dmn:text>for Income check in [1] return Income check</dmn:text></dmn:literalExpression>
  </dmn:decision>
  <dmn:decision id="table" name="Table">
    <dmn:variable id="table-variable" name="Table" typeRef="boolean"/>
    <dmn:informationRequirement id="table-requirement"><dmn:requiredDecision href="#check"/></dmn:informationRequirement>
    <dmn:decisionTable id="table-expression" hitPolicy="FIRST">
      <dmn:input id="table-input"><dmn:inputExpression id="table-input-expression" typeRef="boolean"><dmn:text>Income check</dmn:text></dmn:inputExpression></dmn:input>
      <dmn:output id="table-output" typeRef="boolean"/>
      <dmn:rule id="table-rule">
        <dmn:inputEntry id="table-condition"><dmn:text>true</dmn:text></dmn:inputEntry>
        <dmn:outputEntry id="table-result"><dmn:text>Income check</dmn:text></dmn:outputEntry>
      </dmn:rule>
    </dmn:decisionTable>
  </dmn:decision>
</dmn:definitions>`;

describe("renameCheckDmn", () => {
  it("updates FEEL references while preserving string literals and decision IDs", async () => {
    const result = await renameCheckDmn(
      xml,
      "Income check",
      "Household income",
    );
    const model = getMarshaller(result, { upgradeTo: "latest" }).parser.parse();
    const decisions = model.definitions.drgElement!;
    expect(decisions[0]["@_id"]).toBe("check");
    expect(decisions[0]["@_name"]).toBe("Household income");
    expect(result).toContain("Household income and Household income");
    const stringDecision = decisions[2];
    expect(
      stringDecision.__$$element === "decision" &&
        stringDecision.expression?.__$$element === "literalExpression" &&
        stringDecision.expression.text?.__$$text,
    ).toBe('"Income check"');
    expect(result).toContain("for Income check in [1] return Income check");
    expect(result).toContain('href="#check"');
  });

  it("rejects a missing original decision", async () => {
    await expect(renameCheckDmn(xml, "Missing", "New name")).rejects.toThrow(
      "could not be identified",
    );
  });

  it("updates decision table inputs and output expressions", async () => {
    const result = await renameCheckDmn(
      xml,
      "Income check",
      "Household income",
    );
    const model = getMarshaller(result, { upgradeTo: "latest" }).parser.parse();
    const table = model.definitions.drgElement!.find(
      (element) => element["@_id"] === "table",
    );
    expect(table?.__$$element).toBe("decision");
    if (
      table?.__$$element !== "decision" ||
      table.expression?.__$$element !== "decisionTable"
    ) {
      throw new Error("Decision table missing");
    }
    expect(table.expression.input?.[0].inputExpression?.text?.__$$text).toBe(
      "Household income",
    );
    expect(table.expression.rule?.[0].outputEntry?.[0].text?.__$$text).toBe(
      "Household income",
    );
  });
});
