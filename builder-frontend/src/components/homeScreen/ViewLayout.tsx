import { Component, createSignal, JSX, ParentProps } from "solid-js";

export const ViewLayout: Component<ParentProps> = (props) => {
  return <div class="p-2 text-gray-700">{props.children}</div>;
};
