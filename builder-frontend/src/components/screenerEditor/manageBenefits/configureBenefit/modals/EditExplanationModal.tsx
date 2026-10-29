import { Accessor, createSignal, createUniqueId, Show } from "solid-js";
import { Modal } from "@/components/shared/Modal";
import type { CheckConfig } from "@/types";

export default function EditExplanationModal(props: {
  checkConfig: Accessor<CheckConfig>;
  save: (explanation: string | null) => Promise<void>;
  closeModal: () => void;
}) {
  const id = createUniqueId();
  const [draft, setDraft] = createSignal(props.checkConfig().explanation ?? "");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const save = async (event: SubmitEvent) => {
    event.preventDefault();
    if (saving()) return;
    setSaving(true);
    setError("");
    try {
      await props.save(draft().trim() || null);
      props.closeModal();
    } catch {
      setError(
        "Could not save the explanation. Your edits are still here. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal show={true} onClose={props.closeModal} dismissible={!saving()}>
      <form onSubmit={save}>
        <h2 class="text-2xl font-bold mb-4">Edit explanation</h2>
        <p id={`${id}-help`} class="text-gray-600 mb-3">
          Explain this requirement in plain language for the person being
          screened. It appears in the results and in Requirements not met. Leave
          empty to remove it.
        </p>
        <label for={id} class="block font-semibold mb-2">
          Explanation for{" "}
          {props.checkConfig().aliasName || props.checkConfig().checkName}
        </label>
        <textarea
          id={id}
          aria-describedby={`${id}-help`}
          class="form-input-custom w-full"
          rows={5}
          maxLength={2000}
          value={draft()}
          onInput={(event) => setDraft(event.currentTarget.value)}
          disabled={saving()}
        />
        <Show when={error()}>
          <p role="alert" class="text-red-700 mt-2">
            {error()}
          </p>
        </Show>
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            class="btn-default btn-gray"
            onClick={props.closeModal}
            disabled={saving()}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-default btn-blue"
            disabled={saving()}
          >
            {saving() ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
