export function insertImportElement(dmnXmlString, importElementsXml) {
  const definitionsTagRegex = /<dmn:definitions\b[^>]*?>/is;
  const match = dmnXmlString.match(definitionsTagRegex);

  if (!match) {
    console.log("Error: Malformed DMN file");
    return;
  }

  const openTag = match[0];
  const insertIndex = dmnXmlString.indexOf(openTag) + openTag.length;

  // Insert import elements right after <dmn:definitions ...>
  return (
    dmnXmlString.slice(0, insertIndex) +
    "\n" +
    importElementsXml +
    "\n" +
    dmnXmlString.slice(insertIndex)
  );
}
