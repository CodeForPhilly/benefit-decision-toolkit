import {
  Component,
  createContext,
  JSX,
  splitProps,
  useContext,
} from "solid-js";

import "./Form.css";

interface FormProps extends JSX.FormHTMLAttributes<HTMLFormElement> {}
interface LabelWrapperProps extends JSX.HTMLAttributes<HTMLDivElement> {
  htmlFor: string;
  placeholder: string;
}
interface TextInputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>;
}
interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
  label: string;
}

const FormContext = createContext<{ htmlFor?: string }>({});

const TextInput = (props: TextInputProps) => {
  const [local, rest] = splitProps(props, ["value", "onChange", "placeholder"]);
  const hasUserInput = local.value.length > 0;
  const ctx = useContext(FormContext);
  return (
    <input
      class="textfield-input"
      type="text"
      id={ctx.htmlFor}
      name={ctx.htmlFor}
      value={local.value}
      onChange={local.onChange}
      placeholder={hasUserInput ? local.placeholder || "" : ""}
      {...rest}
    />
  );
};
const Label = (props: LabelProps) => {
  const [local, rest] = splitProps(props, ["htmlFor", "label"]);
  return (
    <label class={`textfield-label`} for={local.htmlFor} {...rest}>
      {local.label}
    </label>
  );
};
const LabelAbove = (props: LabelWrapperProps) => {
  const [local, rest] = splitProps(props, [
    "htmlFor",
    "placeholder",
    "children",
  ]);
  return (
    <FormContext.Provider value={{ htmlFor: local.htmlFor }}>
      <div class="textfield" {...rest}>
        {local.children}
        <Label htmlFor={local.htmlFor} label={local.placeholder} />
      </div>
    </FormContext.Provider>
  );
};

const Form: Component<FormProps> = (props) => {
  return <form {...props}></form>;
};

export default Object.assign(Form, {
  Label,
  TextInput,
  LabelAbove,
});
