import { Component, JSX, ParentProps, splitProps } from "solid-js";

import styles from "./Button.module.css";

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "danger"
    | "outline-primary"
    | "outline-secondary"
    | "outline-tertiary"
    | "outline-danger";
}

export const Button: Component<ParentProps<Props>> = (props) => {
  const [local, rest] = splitProps(props, [
    "type",
    "children",
    "variant",
    "class",
  ]);
  return (
    <button
      type={local.type || "button"}
      class={`${styles.button} ${styles[local.variant || "primary"]} ${local.class || ""}`}
      {...rest}
    >
      {local.children}
    </button>
  );
};
