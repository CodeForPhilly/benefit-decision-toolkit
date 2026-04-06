import { Accessor, createContext, Setter, useContext } from "solid-js";

type FormContextValue = {
  value: Accessor<string>;
  setValue: Setter<string>;
  htmlFor?: string;
};
export const FormContext = createContext<FormContextValue>();

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      "useFormContext must be used within a FormContext provider",
    );
  }
  return context;
};
