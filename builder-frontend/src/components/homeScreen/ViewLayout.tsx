import { Component, createSignal, JSX, ParentProps } from "solid-js";

export const ViewLayout: Component<ParentProps> = (props) => {
  return <div class="px-12 py-8 text-gray-700">{props.children}</div>;
};
