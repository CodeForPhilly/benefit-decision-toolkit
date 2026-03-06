import { Component, JSX } from "solid-js";
import { useHamburgerMenuContext } from "./HamburgerMenuWrapper";

interface Props {
  children: JSX.Element;
}

export const HamburgerMenuButton: Component<Props> = (props) => {
  const menuCtx = useHamburgerMenuContext();
  return (
    <div class="menu-toggle" onClick={menuCtx.toggle}>
      {props.children}
    </div>
  );
};
