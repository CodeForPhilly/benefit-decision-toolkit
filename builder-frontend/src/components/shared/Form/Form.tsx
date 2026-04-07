import { Component, createSignal, JSX, splitProps, useContext } from "solid-js";

import styles from "./Form.module.css";
import { Select } from "./Select";
import { Radio } from "@/components/shared/Form/Radio";
import { FormContext, useFormContext } from "@/components/shared/Form/Context";

interface FormProps extends JSX.FormHTMLAttributes<HTMLFormElement> {}
interface FormWrapperProps extends JSX.HTMLAttributes<HTMLDivElement> {
  htmlFor: string;
  value?: string;
}
interface LabelWrapperProps extends JSX.HTMLAttributes<HTMLDivElement> {
  htmlFor: string;
  placeholder: string;
}
interface TextInputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  placeholder?: string;
}

interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {}
interface ErrorProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const mergeClasses = (...classes: (string | undefined)[]): string => {
  return classes.filter((c) => c !== undefined && c.length > 0).join(" ");
};

const TextInput = (props: TextInputProps) => {
  // const [value, setValue] = createSignal(props.value || "");
  const [local, rest] = splitProps(props, ["class", "placeholder"]);
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error("<TextInput> must be used with a FormContext.");
  }
  const showPlaceholder =
    ctx.value().length < 1 && (local.placeholder || "").length > 0;

  return (
    <input
      class={styles[mergeClasses(local.class, "textfield-input")]}
      type="text"
      id={ctx.htmlFor}
      name={ctx.htmlFor}
      value={ctx.value()}
      onInput={(e) => ctx.setValue(e.target.value)}
      placeholder={showPlaceholder ? local.placeholder : ""}
      {...rest}
    />
  );
};

const Label = (props: LabelProps) => {
  const [local, rest] = splitProps(props, ["class"]);
  const ctx = useFormContext();

  return (
    <label
      class={styles[mergeClasses(local.class, "textfield-label")]}
      for={ctx.htmlFor}
      {...rest}
    />
  );
};

const FormError = (props: ErrorProps) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class={styles[mergeClasses(local.class, "form-error")]} {...rest} />
  );
};

/**
 * `<FormWrapper>` element with integrated `<label>`.
 * Accepts a `children` prop that contains `<TextInput>`
 */

const LabelAbove = (props: LabelWrapperProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "htmlFor",
    "placeholder",
  ]);
  return (
    <FormWrapper
      htmlFor={local.htmlFor}
      class={styles["textfield-above"]}
      {...rest}
    >
      {local.children}
      <Label class={styles["textfield-label-above"]}>{local.placeholder}</Label>
    </FormWrapper>
  );
};
const FormWrapper = (props: FormWrapperProps) => {
  const [local, rest] = splitProps(props, ["htmlFor", "value"]);
  const [value, setValue] = createSignal(local.value ?? "");

  return (
    <FormContext.Provider value={{ value, setValue, htmlFor: local.htmlFor }}>
      <div class={styles["textfield"]} {...rest} />
    </FormContext.Provider>
  );
};

const Form: Component<FormProps> = (props) => {
  return <form {...props}></form>;
};

export default Object.assign(Form, {
  Label,
  TextInput,
  FormWrapper,
  LabelAbove,
  FormError,
  Select,
  Radio,
});
