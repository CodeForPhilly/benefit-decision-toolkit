import type { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import type { Normalized } from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import { normalizeDmnXml } from "@/components/homeScreen/eligibilityCheckList/eligibilityCheckDetail/dmnEditor";

export const renameCheckDmn = async (
  xml: string,
  oldName: string,
  newName: string,
): Promise<string> => {
  const [{ getMarshaller }, { IdentifiersRefactor }] = await Promise.all([
    import("@kie-tools/dmn-marshaller"),
    import("@kie-tools/dmn-language-service/dist/IdentifiersRefactor"),
  ]);
  const marshaller = getMarshaller(normalizeDmnXml(xml), {
    upgradeTo: "latest",
  });
  const model = marshaller.parser.parse() as Normalized<DmnLatestModel>;
  const definitions = model.definitions;
  const matches =
    definitions.drgElement?.filter(
      (element) =>
        element.__$$element === "decision" && element["@_name"] === oldName,
    ) ?? [];
  if (matches.length !== 1 || !matches[0]["@_id"]) {
    throw new Error(
      "The original check decision could not be identified in the DMN model.",
    );
  }
  const decision = matches[0];
  // Build the identifier links before changing any names, so the parser sees
  // the original scopes and can distinguish references from matching text.
  const refactor = new IdentifiersRefactor({
    writeableDmnDefinitions: definitions,
    _readonly_externalDmnModelsByNamespaceMap: new Map(),
  });
  refactor.rename({ identifierUuid: decision["@_id"]!, newName });
  decision["@_name"] = newName;
  if (decision.__$$element === "decision") {
    if (decision.variable) decision.variable["@_name"] = newName;
    if (decision.expression) decision.expression["@_label"] = newName;
  }
  if (definitions["@_name"] === oldName) definitions["@_name"] = newName;
  return marshaller.builder.build(model);
};
