import { createSignal, JSX } from "solid-js";
import type { ParameterDefinition } from "@/types";
import Form from "@/components/shared/Form";
import { Button } from "@/components/shared/Button";

type ParamValues = {
  key: string;
  label: string;
  type: string;
  required: string;
};

interface Props {
  actionTitle: string;
  modalAction: (parameter: ParameterDefinition) => Promise<void>;
  closeModal: () => void;
  initialData?: ParamValues;
}

/**
 * Predicate determining whether a `value` is a valid `ParameterType`.
 * Narrows `value`'s type from `string` to `ParameterType`
 * for the compiler. Returns a boolean at runtime.
 */
const isParameterType = (
  value: string,
): value is ParameterDefinition["type"] => {
  const parameterTypes = [
    "string",
    "number",
    "boolean",
    "date",
    "array",
  ] as const satisfies readonly ParameterDefinition["type"][];
  return parameterTypes.includes(value as ParameterDefinition["type"]);
};

const emptyError: ParamValues = {
  key: "",
  label: "",
  type: "",
  required: "",
};

const parameterTypeOptions: {
  label: string;
  value: ParameterDefinition["type"];
}[] = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "String List", value: "array" },
];

const ParameterModal = (props: Props) => {
  const [error, setError] = createSignal<ParamValues>({ ...emptyError });

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    setError(() => ({
      key: "",
      label: "",
      required: "",
      type: "",
    }));

    const form = new FormData(e.currentTarget);
    const parameterKey = form.get("parameterKey");
    const parameterLabel = form.get("parameterLabel");
    const rawParameterType = form.get("parameterType")?.toString();
    const parameterRequired = form.get("parameterRequired");

    if (
      !parameterKey ||
      !parameterLabel ||
      !rawParameterType ||
      !isParameterType(rawParameterType) ||
      !parameterRequired
    ) {
      setError({
        key: !parameterKey ? "Please enter a value." : "",
        label: !parameterLabel ? "Please enter a value." : "",
        type: !rawParameterType ? "Please enter a value." : "",
        required: !parameterRequired ? "Please enter a value." : "",
      });
    } else {
      const parameter: ParameterDefinition = {
        key: parameterKey.toString(),
        label: parameterLabel.toString(),
        type: rawParameterType,
        required: parameterRequired === "true",
      };
      await props.modalAction(parameter);
      props.closeModal();
    }
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white px-12 py-8 rounded-xl max-w-140 w-1/2 min-w-80 min-h-96">
        <div class="text-2xl font-bold mb-4">{props.actionTitle}</div>
        <Form onSubmit={handleSubmit}>
          <Form.LabelAbove
            placeholder="Enter parameter key"
            htmlFor="parameterKey"
          >
            <Form.TextInput value={props.initialData?.key || ""} />
          </Form.LabelAbove>
          <Form.FormError>{error().key}</Form.FormError>

          <Form.LabelAbove
            placeholder="Enter parameter label"
            htmlFor="parameterLabel"
          >
            <Form.TextInput value={props.initialData?.label || ""} />
          </Form.LabelAbove>
          <Form.FormError>{error().label}</Form.FormError>

          <Form.Select
            id="parameterType"
            label="Type"
            value={props.initialData?.type || ""}
            options={parameterTypeOptions}
          >
            <option value="" disabled>
              Select a type
            </option>
          </Form.Select>
          <Form.FormError>{error().type}</Form.FormError>

          <Form.FormWrapper
            value={props.initialData?.required ? "true" : "false"}
            htmlFor="parameterRequired"
          >
            <div>Required</div>
            <Form.Radio value="true">True</Form.Radio>
            <Form.Radio value="false">False</Form.Radio>
          </Form.FormWrapper>
          <Form.FormError>{error().required}</Form.FormError>

          <div class="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={props.closeModal}
            >
              Cancel
            </Button>
            <Button type="submit">{props.actionTitle}</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
export default ParameterModal;
