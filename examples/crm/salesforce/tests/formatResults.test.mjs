import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// In Salesforce, c/bdtCrmHost is the copied host adapter.
const source = (
  await readFile(
    new URL("../bdtScreeningResults/formatResults.js", import.meta.url),
    "utf8",
  )
).replace(
  '"c/bdtCrmHost"',
  JSON.stringify(
    new URL(
      "../../../../builder-frontend/public/integrations/host.js",
      import.meta.url,
    ).href,
  ),
);
const { formatSavedResults } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const snapshot = {
  results: {
    housing: { name: "Housing", result: "TRUE", check_results: {} },
    food: { name: "Food", result: "FALSE", check_results: {} },
    utility: {
      name: "Utilities",
      result: "UNABLE_TO_DETERMINE",
      check_results: {},
    },
  },
  nextSteps: {
    housing: {
      status: "eligible",
      applyUrl: "https://example.org/apply",
      help: { url: "https://example.org/help", phone: "215-555-0100" },
      body: { format: "markdown", text: "Bring **ID**." },
    },
    food: {
      status: "ineligible",
      unmetRequirements: ["Income limit"],
      note: { format: "markdown", text: "Ask about other help." },
    },
    utility: { status: "eligible", applyUrl: "https://example.org/wrong" },
  },
};

test("formats saved contacts, instructions and requirements while excluding undecided benefits", () => {
  const view = formatSavedResults(JSON.stringify(snapshot));
  assert.equal(view.benefits[0].applyUrl, "https://example.org/apply");
  assert.equal(view.benefits[0].body, "Bring **ID**.");
  assert.equal(view.benefits[0].phone, "215-555-0100");
  assert.equal(view.benefits[0].hasUnmetRequirements, false);
  assert.deepEqual(view.benefits[1].unmetRequirements, [
    { id: "0", name: "Income limit" },
  ]);
  assert.equal(view.benefits[1].hasUnmetRequirements, true);
  assert.equal(view.benefits[1].note, "Ask about other help.");
  assert.equal(view.benefits[2].hasNextSteps, undefined);
});
test("reads older snapshots and drops unsafe links without interpreting Markdown", () => {
  const old = structuredClone(snapshot);
  delete old.nextSteps;
  assert.equal(
    formatSavedResults(JSON.stringify(old)).benefits[0].hasNextSteps,
    undefined,
  );
  const unsafe = structuredClone(snapshot);
  unsafe.nextSteps.housing.applyUrl = "javascript:alert(1)";
  unsafe.nextSteps.housing.help.url = "https://user:secret@example.org/";
  unsafe.nextSteps.food.status = "eligible";
  unsafe.results.food.result = "TRUE";
  unsafe.nextSteps.food.applyUrl = "http://under_score/";
  unsafe.nextSteps.housing.body.text = "<script>not rendered HTML</script>";
  const view = formatSavedResults(JSON.stringify(unsafe));
  assert.equal(view.benefits[0].applyUrl, null);
  assert.equal(view.benefits[0].helpUrl, null);
  assert.equal(view.benefits[1].applyUrl, null);
  assert.equal(view.benefits[0].body, "<script>not rendered HTML</script>");
});
