import {
  Component,
  createContext,
  createSignal,
  JSX,
  splitProps,
  useContext,
} from "solid-js";

import "./Form.css";

interface FormProps extends JSX.FormHTMLAttributes<HTMLFormElement> {}
interface FormWrapperProps extends JSX.HTMLAttributes<HTMLDivElement> {
  htmlFor: string;
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

const mergeClasses = (...classes: (string | undefined)[]): string => {
  return classes.filter((c) => c !== undefined && c.length > 0).join(" ");
};
const FormContext = createContext<{ htmlFor?: string }>({});

const TextInput = (props: TextInputProps) => {
  const [value, setValue] = createSignal(props.value || "");
  const [local, rest] = splitProps(props, ["class", "placeholder"]);
  const ctx = useContext(FormContext);
  const showPlaceholder =
    value().length < 1 && (local.placeholder || "").length > 0;

  return (
    <input
      class={mergeClasses(local.class, "textfield-input")}
      type="text"
      id={ctx.htmlFor}
      name={ctx.htmlFor}
      value={value()}
      onInput={(e) => setValue(e.target.value)}
      placeholder={showPlaceholder ? local.placeholder : ""}
      {...rest}
    />
  );
};
const Label = (props: LabelProps) => {
  const [local, rest] = splitProps(props, ["class"]);
  const ctx = useContext(FormContext);

  return (
    <label
      class={mergeClasses(local.class, "textfield-label")}
      for={ctx.htmlFor}
      {...rest}
    />
  );
};
const LabelAbove = (props: LabelWrapperProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "htmlFor",
    "placeholder",
  ]);
  return (
    <FormWrapper htmlFor={local.htmlFor} class="textfield-above" {...rest}>
      {local.children}
      <Label class="textfield-label-above">{local.placeholder}</Label>
    </FormWrapper>
  );
};
const FormWrapper = (props: FormWrapperProps) => {
  const [local, rest] = splitProps(props, ["htmlFor"]);
  return (
    <FormContext.Provider value={{ htmlFor: local.htmlFor }}>
      <div class="textfield" {...rest} />
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
});
