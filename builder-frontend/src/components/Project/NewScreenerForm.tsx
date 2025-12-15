import { createSignal, type JSX, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { createNewScreener } from "@/api/screener";
import Form from "@/components/shared/Form";

export default function NewScreenerForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(false);
  const [screenerName, setScreenerName] = createSignal("");
  const [error, setError] = createSignal<string | null>();

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    const screenerName = fd.get("screenerName")?.toString() || "";

    if (screenerName.length > 0) {
      setError(null);
      const newScreener = await createNewScreener({ screenerName });
      navigate(`/projects/${newScreener.id}`);
    } else {
      setError("Please enter a name.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 class="text-2xl">Create a screener</h1>
      <Form onSubmit={handleSubmit}>
        <Form.LabelAbove htmlFor="screenerName" placeholder="Screener name">
          <Form.TextInput
            value={screenerName()}
            onChange={(e) => setScreenerName(e.target.value)}
          />
        </Form.LabelAbove>
        <Show when={error()}>
          <div class="text-red-500">{error()}</div>
        </Show>
        <button
          type="submit"
          disabled={isLoading()}
          class="mt-3 py-2 px-4 text-white rounded bg-gray-800 disabled:opacity-50"
        >
          Create
        </button>
        <Show when={isLoading()}>{<div>Loading ...</div>}</Show>
      </Form>
    </div>
  );
}
