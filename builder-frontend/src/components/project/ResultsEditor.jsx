import { createSignal, For, onMount } from "solid-js";
import { updateScreener } from "../../api/screener";
import { XMLParser } from "fast-xml-parser";

async function getDecisionNames(dmnXmlString) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNamespace: true, // This removes namespace prefixes
    });

    const result = parser.parse(dmnXmlString);
    console.log(result);
    const definitions = result["dmn:definitions"];
    if (!definitions) return [];

    let decisions = definitions["dmn:decision"] || [];
    if (!Array.isArray(decisions)) decisions = [decisions];

    console.log("decisions");
    console.log(decisions);

    const decisionNames = decisions
      .map((d) => d["@_name"])
      .filter((name) => name); // Filter out undefined names
    console.log("decision names");
    console.log(decisionNames);
    return decisionNames;
  } catch (err) {
    console.error("Error parsing DMN XML:", err);
    return [];
  }
}

export default function ResultsEditor({ project, dmnModel }) {
  const [benefits, setBenefits] = createSignal(project().resultsSchema ?? []);
  const [decisionOptions, setDecisionOptions] = createSignal([]);
  const [isSaving, setIsSaving] = createSignal(false);

  onMount(async () => {
    const names = await getDecisionNames(dmnModel());
    setDecisionOptions(names);
  });

  // Add a new benefit
  const addBenefit = () => {
    setBenefits((prev) => [
      ...prev,
      {
        id: Date.now() + "-" + Math.floor(Math.random() * 1000000),
        decisionName: "",
        displayName: "",
        checks: [],
      },
    ]);
  };

  // Remove a benefit
  const removeBenefit = (benefitId) => {
    setBenefits((prev) => prev.filter((b) => b.id !== benefitId));
  };

  // Update benefit decisionName or displayName
  const updateBenefit = (benefitId, field, value) => {
    setBenefits((prev) =>
      prev.map((b) => (b.id === benefitId ? { ...b, [field]: value } : b))
    );
  };

  // Add a check to a benefit
  const addCheck = (benefitId) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.id === benefitId
          ? {
              ...b,
              checks: [
                ...b.checks,
                {
                  id: Date.now() + "-" + Math.floor(Math.random() * 1000000),
                  decisionName: "",
                  displayName: "",
                },
              ],
            }
          : b
      )
    );
  };

  // Remove a check
  const removeCheck = (benefitId, checkId) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.id === benefitId
          ? {
              ...b,
              checks: b.checks.filter((c) => c.id !== checkId),
            }
          : b
      )
    );
  };

  // Update check field
  const updateCheck = (benefitId, checkId, field, value) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.id === benefitId
          ? {
              ...b,
              checks: b.checks.map((c) =>
                c.id === checkId ? { ...c, [field]: value } : c
              ),
            }
          : b
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault(); // prevent page reload
    setIsSaving(true);
    const formData = benefits();

    const resultsSchema = formData.map((benefit) => ({
      id: benefit.id,
      decisionName: benefit.decisionName,
      displayName: benefit.displayName,
      checks: benefit.checks.map((check) => ({
        id: check.id,
        decisionName: check.decisionName,
        displayName: check.displayName,
      })),
    }));

    let projectData = project();
    projectData.resultsSchema = resultsSchema;
    try {
      await updateScreener(projectData);
    } catch (error) {
      console.debug("Error saving results schema: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form class="flex flex-col mx-8 p-4 space-y-4 border border-gray-300 rounded shadow-sm">
      <div className="text-lg text-gray-800 text-md font-bold">
        Screener Results Section
      </div>
      <div>
        Define the benefit decisions and checks that will be visible in the
        results section of your published screener.
      </div>

      {decisionOptions().length === 0 ? (
        <div>
          DMN Model does not yet include decisions. Once decisions are included
          they can be added to the results section.
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={addBenefit}
            class="my-4 border-2 border-gray-500 text-gray-500 px-4 py-2 rounded hover:bg-gray-100 w-40"
          >
            Add Benefit
          </button>

          <For each={benefits()}>
            {(benefit) => (
              <div class="border p-4 rounded space-y-2">
                <div class="flex space-x-2">
                  <select
                    class="border px-2 py-1 rounded"
                    value={benefit.decisionName}
                    onInput={(e) =>
                      updateBenefit(
                        benefit.id,
                        "decisionName",
                        e.currentTarget.value
                      )
                    }
                  >
                    <option value="">Select Benefit DMN Decision Name</option>
                    <For each={decisionOptions()}>
                      {(decisionName) => (
                        <option value={decisionName}>{decisionName}</option>
                      )}
                    </For>
                  </select>

                  <input
                    type="text"
                    class="border px-2 py-1 rounded"
                    placeholder="Custom Display Name"
                    value={benefit.displayName}
                    onBlur={(e) =>
                      updateBenefit(
                        benefit.id,
                        "displayName",
                        e.currentTarget.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeBenefit(benefit.id)}
                    class="mx-4 text-red-500 hover:text-red-700"
                  >
                    Remove Benefit
                  </button>
                </div>

                <div class="space-y-2">
                  <For each={benefit.checks}>
                    {(check) => (
                      <div class="px-8 flex space-x-2">
                        <select
                          class="border px-2 py-1 rounded"
                          value={check.decisionName}
                          onInput={(e) =>
                            updateCheck(
                              benefit.id,
                              check.id,
                              "decisionName",
                              e.currentTarget.value
                            )
                          }
                        >
                          <option value="">
                            Select Check DMN Decision Name
                          </option>
                          <For each={decisionOptions()}>
                            {(decisionName) => (
                              <option value={decisionName}>
                                {decisionName}
                              </option>
                            )}
                          </For>
                        </select>

                        <input
                          type="text"
                          class="border px-2 py-1 rounded"
                          placeholder="Custom Display Name"
                          value={check.displayName}
                          onBlur={(e) =>
                            updateCheck(
                              benefit.id,
                              check.id,
                              "displayName",
                              e.currentTarget.value
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() => removeCheck(benefit.id, check.id)}
                          class="mx-4 text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </For>

                  <button
                    type="button"
                    onClick={() => addCheck(benefit.id)}
                    class="text-green-500 hover:text-green-700"
                  >
                    + Add Check
                  </button>
                </div>
              </div>
            )}
          </For>
          <button
            onClick={handleSave}
            disabled={isSaving()}
            type="submit"
            class="w-60 mt-4 border-1 border-emerald-500 text-emerald-500 px-4 py-2 rounded hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            Save Result Schema
          </button>
        </>
      )}
    </form>
  );
}
