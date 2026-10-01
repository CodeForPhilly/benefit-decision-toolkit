import { Accessor, Show } from "solid-js";
import Breadcrumbs, { Breadcrumb } from "./Breadcrumbs";
import BdtNavbar, { NavbarProps } from "./BdtNavbar";
import "./EditorNavigation.css";

export default function EditorNavigation(props: {
  items: Breadcrumb[];
  navProps?: Accessor<NavbarProps>;
}) {
  return (
    <div class="editor-navigation">
      <Breadcrumbs items={props.items} />
      <Show when={props.navProps}>
        {(navProps) => <BdtNavbar navProps={navProps()} />}
      </Show>
    </div>
  );
}
