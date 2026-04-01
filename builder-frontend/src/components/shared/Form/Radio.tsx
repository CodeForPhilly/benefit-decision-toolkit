import { useFormContext } from "@/components/shared/Form/Context";
import { JSX, splitProps } from "solid-js";

import styles from "./Form.module.css";

interface RadioProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = (props: RadioProps) => {
  const ctx = useFormContext();
  const [local, rest] = splitProps(props, ["class", "children", "value"]);
  return (
    <div class={styles["radio-wrapper"]}>
      <input
        class={styles["radio-button"]}
        type="radio"
        id={`${ctx.htmlFor}-${local.value}`}
        name={ctx.htmlFor}
        value={local.value}
        checked={local.value === ctx.value()}
        onClick={(e) => ctx.setValue(e.currentTarget.value)}
        {...rest}
      />
      <label for={`${ctx.htmlFor}-${local.value}`}>{local.children}</label>
    </div>
  );
};
