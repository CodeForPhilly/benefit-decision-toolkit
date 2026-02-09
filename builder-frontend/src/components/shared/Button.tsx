import { Component, JSX, ParentProps } from "solid-js";

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
  const { type, variant, children, ...rest } = props;
  return (
    <button
      type={type || "button"}
      class={`${styles.button} ${styles[variant || "primary"]} ${props.class || ""}`}
      {...rest}
    >
      {props.children}
    </button>
  );
};
