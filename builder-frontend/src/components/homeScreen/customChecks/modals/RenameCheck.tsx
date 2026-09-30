import { createSignal } from "solid-js";
import { Button } from "@/components/shared/Button";
import type { EligibilityCheck } from "@/types";
import { checkNameError } from "@/utils/checkName";

interface Props {
  check: EligibilityCheck;
  onRename: (name: string) => Promise<void>;
  onClose: () => void;
}

export const RenameCheck = (props: Props) => {
  const [name, setName] = createSignal(props.check.name);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    const trimmed = name().trim();
    const nameError = checkNameError(trimmed);
    if (nameError) {
      setError(nameError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await props.onRename(trimmed);
      props.onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not rename check.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2 class="text-2xl font-bold mb-4">Rename Check</h2>
      <label for="rename-check-name" class="block mb-2">
        Check name
      </label>
      <input
        id="rename-check-name"
        class="w-full border border-gray-300 rounded px-3 py-2"
        value={name()}
        onInput={(event) => setName(event.currentTarget.value)}
      />
      <p class="mt-2 text-sm text-gray-600">
        The working DMN decision will be renamed. Published versions keep their names.
      </p>
      {error() && (
        <p role="alert" class="mt-2 text-red-700">
          {error()}
        </p>
      )}
      <div class="flex justify-end gap-2 mt-4">
        <Button
          type="button"
          variant="outline-secondary"
          onClick={props.onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving()}>
          {saving() ? "Saving..." : "Save name"}
        </Button>
      </div>
    </form>
  );
};
