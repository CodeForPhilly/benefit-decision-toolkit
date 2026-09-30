import { Component, JSX } from "solid-js";
import { useHamburgerMenuContext } from "./HamburgerMenuWrapper";

interface Props {
  children: JSX.Element;
}

export const HamburgerMenuButton: Component<Props> = (props) => {
  const menuCtx = useHamburgerMenuContext();
  return (
    <button
      type="button"
      aria-label="Account menu"
      aria-expanded={menuCtx.showMenu()}
      class="menu-toggle"
      onClick={menuCtx.toggle}
    >
      {props.children}
    </button>
  );
};
