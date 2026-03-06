import { Component, JSX, Show } from "solid-js";
import { useHamburgerMenuContext } from "./HamburgerMenuWrapper";

interface Props {
  children: JSX.Element;
}
export const HamburgerMenuPanel: Component<Props> = (props) => {
  const { showMenu, setShowMenu } = useHamburgerMenuContext();
  return (
    <Show when={showMenu()}>
      <div>
        <div class="menu-panel">
          <button type="button" onClick={() => setShowMenu(false)}>
            X Close menu
          </button>
          {props.children}
        </div>
      </div>
    </Show>
  );
};
