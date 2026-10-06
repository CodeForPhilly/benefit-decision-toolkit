import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "@/components/shared/Button";
import { importScreener, readScreenerFile } from "@/api/screenerTransfer";

export default function ImportScreenerForm(props: {
  existingNames?: string[];
}) {
  const navigate = useNavigate();
  const [file, setFile] = createSignal<File>();
  const [data, setData] = createSignal<Record<string, unknown>>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [name, setName] = createSignal("");
  const [reading, setReading] = createSignal(false);
  const duplicate = () =>
    props.existingNames?.some(
      (existing) =>
        existing.trim().toLowerCase() === name().trim().toLowerCase(),
    );
  let fileInput!: HTMLInputElement;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!data() || !name().trim() || reading() || duplicate() || loading())
          return;
        setError("");
        setLoading(true);
        try {
          const screener = await importScreener(data()!, name());
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
          onChange={async (event) => {
            const selected = event.currentTarget.files?.[0];
            setFile(selected);
            setData(undefined);
            setName("");
            setError("");
            if (!selected) {
              setReading(false);
              return;
            }
            setReading(true);
            try {
              const parsed = await readScreenerFile(selected);
              if (file() === selected) {
                setData(parsed);
                setName(parsed.screenerName as string);
              }
            } catch (failure) {
              if (file() === selected)
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Could not read this file.",
                );
            } finally {
              if (file() === selected) setReading(false);
            }
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
      <Show when={file() && !reading()}>
        <label class="block mb-4">
          Screener name
          <input
            class="block w-full rounded border border-gray-400 px-3 py-2 mt-1"
            name="screenerName"
            required
            value={name()}
            disabled={loading()}
            aria-invalid={duplicate() ? "true" : undefined}
            aria-describedby={
              duplicate() ? "screener-name-collision" : undefined
            }
            onInput={(event) => {
              setName(event.currentTarget.value);
              setError("");
            }}
          />
        </label>
        <Show when={duplicate()}>
          <p
            id="screener-name-collision"
            role="alert"
            class="text-red-700 mb-3"
          >
            You already have a screener with this name. Choose a different name.
          </p>
        </Show>
      </Show>
      <Show when={error()}>
        <p role="alert" class="text-red-700 mb-3">
          {error()}
        </p>
      </Show>
      <Button
        type="submit"
        disabled={
          !data() || !name().trim() || reading() || duplicate() || loading()
        }
      >
        {loading() ? "Importing…" : "Import screener"}
      </Button>
    </form>
  );
}
