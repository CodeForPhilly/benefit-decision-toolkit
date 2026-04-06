import type { CreateCheckRequest } from "@/types";
import { createSignal, JSX } from "solid-js";
import Form from "@/components/shared/Form";
import { Button } from "@/components/shared/Button";

interface Props {
  onAddCheck: (check: CreateCheckRequest) => Promise<void>;
  onClose: () => void;
}

const EditCheckModal = (props: Props) => {
  const [error, setError] = createSignal({
    checkName: "",
    module: "",
    description: "",
  });

  const handleAddCheck: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const checkName = form.get("checkName");
    const checkModule = form.get("checkModule");
    const checkDescription = form.get("checkDescription");

    if (!checkName || !checkModule || !checkDescription) {
      setError({
        checkName: !checkName ? "Please enter a name." : "",
        module: !checkModule ? "Please enter a module." : "",
        description: !checkDescription ? "Please enter a description." : "",
      });
    } else {
      const check: CreateCheckRequest = {
        name: checkName.toString(),
        module: checkModule.toString(),
        description: checkDescription.toString(),
        parameterDefinitions: [],
      };
      try {
        await props.onAddCheck(check);
        props.onClose();
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div>
      <div class="text-2xl font-bold mb-4">Create New Check</div>
      <Form onSubmit={handleAddCheck}>
        <Form.LabelAbove placeholder="Check name" htmlFor="checkName">
          <Form.TextInput />
        </Form.LabelAbove>
        <Form.FormError>{error().checkName}</Form.FormError>

        <Form.LabelAbove placeholder="Module" htmlFor="checkModule">
          <Form.TextInput />
        </Form.LabelAbove>
        <Form.FormError>{error().module}</Form.FormError>

        <Form.LabelAbove placeholder="Description" htmlFor="checkDescription">
          <Form.TextInput />
        </Form.LabelAbove>
        <Form.FormError>{error().description}</Form.FormError>
        <Button type="submit">Add Check</Button>
      </Form>
    </div>
  );
};
export default EditCheckModal;
