import { Component, JSX, Show } from "solid-js";
import { useHamburgerMenuContext } from "./HamburgerMenuWrapper";
import { X } from "lucide-solid";

interface Props {
  children: JSX.Element;
}
export const HamburgerMenuPanel: Component<Props> = (props) => {
  const { showMenu, setShowMenu } = useHamburgerMenuContext();
  return (
    <Show when={showMenu()}>
      <div>
        <div class="menu-panel">
          <button
            class="menu-toggle"
            type="button"
            aria-label="Close account menu"
            onClick={() => setShowMenu(false)}
          >
            <X />
          </button>
          {props.children}
        </div>
      </div>
    </Show>
  );
};
