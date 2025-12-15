import { Component, createSignal, JSX, ParentProps } from "solid-js";

export const ProjectsLayout: Component<ParentProps> = (props) => {
  return <div>{props.children}</div>;
};
