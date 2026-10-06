import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "@/components/shared/Button";
import { importScreener } from "@/api/screenerTransfer";

export default function ImportScreenerForm() {
  const navigate = useNavigate();
  const [file, setFile] = createSignal<File>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  let fileInput!: HTMLInputElement;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!file() || loading()) return;
        setError("");
        setLoading(true);
        try {
          const screener = await importScreener(file()!);
          navigate(`/screeners/${screener.id}`);
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not import the screener.",
          );
        } finally {
          setLoading(false);
        }
      }}
    >
      <h2 class="text-xl font-bold">Import screener</h2>
      <p class="my-3">
        Choose a BDT screener export to create an editable copy with its
        benefits, checks, and form. The copy starts as an unpublished draft.
      </p>
      <div class="mb-4">
        <p class="mb-2">Screener file (JSON, up to 10 MB)</p>
        <input
          ref={fileInput}
          class="hidden"
          aria-label="Screener file"
          type="file"
          accept=".json,application/json"
          disabled={loading()}
          onChange={(event) => {
            setFile(event.currentTarget.files?.[0]);
            setError("");
          }}
        />
        <div class="flex flex-wrap items-center gap-3">
          <Button
            variant="outline-primary"
            disabled={loading()}
            onClick={() => fileInput.click()}
          >
            Choose file
          </Button>
          <span class="min-w-0 break-all" aria-live="polite">
            {file()?.name ?? "No file selected"}
          </span>
        </div>
      </div>
      <Show when={error()}>
        <p role="alert" class="text-red-700 mb-3">
          {error()}
        </p>
      </Show>
      <Button type="submit" disabled={!file() || loading()}>
        {loading() ? "Importing…" : "Import screener"}
      </Button>
    </form>
  );
}
