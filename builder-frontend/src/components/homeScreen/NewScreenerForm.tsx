import { createNewScreener } from "@/api/screener";
import { Button } from "@/components/shared/Button";
import Form from "@/components/shared/Form";
import { useNavigate } from "@solidjs/router";
import { createSignal, JSX } from "solid-js";

export default function NewScreenerForm({}) {
  const navigate = useNavigate();
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const screenerName = form.get("screenerName");
    if (screenerName?.toString().trim()) {
      const data = { screenerName: screenerName.toString() };
      try {
        const newScreener = await createNewScreener(data);
        navigate(`/screeners/${newScreener.id}`);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not create the screener.",
        );
      }
    } else {
      setError("Please enter a screener name.");
    }
    setIsLoading(false);
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Form.LabelAbove
          placeholder="What is the name of your screener?"
          htmlFor="screenerName"
        >
          <Form.TextInput />
        </Form.LabelAbove>
        <Form.FormError>{error()}</Form.FormError>
        <Button
          type="submit"
          variant="secondary"
          id="new-screener-submit"
          data-testid="submit-new-screener-button"
          disabled={isLoading()}
        >
          Create
        </Button>
      </Form>
    </div>
  );
}
