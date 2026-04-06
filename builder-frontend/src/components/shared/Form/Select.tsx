import { For, JSX, splitProps } from "solid-js";

import styles from "./Form.module.css";

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: { label: string; value: string }[];
}

export const Select = (props: SelectProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "id",
    "label",
    "options",
    "value",
  ]);

  return (
    <div class={styles["input-wrapper"]}>
      <select class={styles["select"]} id={local.id} name={local.id} {...rest}>
        {local.children}
        <For each={local.options}>
          {(opt) => (
            <option value={opt.value} selected={opt.value === local.value}>
              {opt.label}
            </option>
          )}
        </For>
      </select>
      <label class={styles["textfield-label"]} for={local.id}>
        {local.label}
      </label>
    </div>
  );
};
