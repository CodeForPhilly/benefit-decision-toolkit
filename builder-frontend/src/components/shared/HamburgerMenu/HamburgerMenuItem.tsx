import { Component } from "solid-js";

interface Props {
  label: string;
  onClick: () => void;
}
export const HamburgerMenuItem: Component<Props> = (props) => {
  return (
    <li class="menu-item" onClick={props.onClick}>
      {props.label}
    </li>
  );
};
