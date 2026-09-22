import { Accessor, Show, createSignal } from "solid-js";

import { titleCase } from "@/utils/title_case";

import type { CheckConfig } from "@/types";

const EditAliasModal = ({
  checkConfig,
  updateCheckConfigAlias,
  generateCheckConfigAlias,
  closeModal,
}: {
  checkConfig: Accessor<CheckConfig>;
  updateCheckConfigAlias: (aliasName: string | null) => void;
  generateCheckConfigAlias?: () => Promise<string>;
  closeModal: () => void;
}) => {
  const [aliasValue, setAliasValue] = createSignal(
    checkConfig().aliasName ?? "",
  );
  const [generating, setGenerating] = createSignal(false);
  const [generationError, setGenerationError] = createSignal("");

  const confirmAndClose = () => {
    const trimmedValue = aliasValue().trim();
    updateCheckConfigAlias(trimmedValue === "" ? null : trimmedValue);
    closeModal();
  };

  const clearAlias = () => {
    setAliasValue("");
  };

  const generateAlias = async () => {
    if (!generateCheckConfigAlias) return;
    setGenerating(true);
    setGenerationError("");
    try {
      setAliasValue(await generateCheckConfigAlias());
    } catch (error) {
      console.error("Failed to generate check alias", error);
      setGenerationError("Could not generate an alias. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80">
        <div class="text-2xl mb-4">
          Edit Alias: {titleCase(checkConfig().checkName)}
        </div>

        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-2">
            Set an alias name to display instead of the check's original name.
            Leave empty to use the original name.
          </div>
          <div class="flex gap-2">
            <input
              type="text"
              value={aliasValue()}
              onInput={(e) => setAliasValue(e.target.value)}
              placeholder={checkConfig().checkName}
              class="form-input-custom flex-1"
            />
            {aliasValue() && (
              <button
                class="btn-default btn-gray !text-sm"
                onClick={clearAlias}
              >
                Clear
              </button>
            )}
          </div>
          <Show when={generationError()}>
            <div class="mt-2 text-sm text-red-700">{generationError()}</div>
          </Show>
        </div>

        <div class="flex justify-between gap-2">
          <Show when={generateCheckConfigAlias}>
            <button
              class="btn-default btn-gray !text-sm"
              onClick={generateAlias}
              disabled={generating()}
            >
              {generating() ? "Generating…" : "Generate alias"}
            </button>
          </Show>
          <div class="flex justify-end gap-2">
            <button class="btn-default btn-gray !text-sm" onClick={closeModal}>
              Cancel
            </button>
            <button
              class="btn-default btn-blue !text-sm"
              onClick={confirmAndClose}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAliasModal;
