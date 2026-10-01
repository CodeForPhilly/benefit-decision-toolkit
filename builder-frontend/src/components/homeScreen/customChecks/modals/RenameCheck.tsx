import { createSignal, Show } from "solid-js";
import { Button } from "@/components/shared/Button";
import type { EligibilityCheck } from "@/types";
import { checkNameError } from "@/utils/checkName";

interface Props {
  check: EligibilityCheck;
  onRename: (name: string) => Promise<void>;
  onClose: () => void;
  onReviewPublish: () => void;
}

export const RenameCheck = (props: Props) => {
  const [name, setName] = createSignal(props.check.name);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (saving()) return;
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
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not rename check.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show
      when={!saved()}
      fallback={
        <div>
          <h2 class="text-2xl font-bold mb-4">Draft name saved</h2>
          <p role="status">
            Your draft is now named <strong>{name().trim()}</strong>. Publish a
            new version to make this name available when adding checks to a
            benefit. Existing benefits keep their current check version and
            name.
          </p>
          <div class="flex justify-end gap-2 mt-4">
            <Button variant="outline-secondary" onClick={props.onClose}>
              Done
            </Button>
            <Button onClick={props.onReviewPublish}>
              Review &amp; publish
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={submit}>
        <h2 class="text-2xl font-bold mb-4">Rename Check</h2>
        <label for="rename-check-name" class="block mb-2">
          Check name
        </label>
        <input
          id="rename-check-name"
          class="w-full border border-gray-300 rounded px-3 py-2"
          value={name()}
          disabled={saving()}
          aria-describedby="rename-check-help"
          onInput={(event) => setName(event.currentTarget.value)}
        />
        <p id="rename-check-help" class="mt-2 text-sm text-gray-600">
          This saves the name in your draft. Publish a new version to make the
          new name available in screeners. Published versions and existing
          benefits keep their current names.
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
            disabled={saving()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving() || name().trim() === props.check.name}
          >
            {saving() ? "Saving..." : "Save draft name"}
          </Button>
        </div>
      </form>
    </Show>
  );
};
