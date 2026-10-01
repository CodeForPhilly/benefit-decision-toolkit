import type { Component } from "solid-js";
import { A } from "@solidjs/router";

import "./ANavbar.css";

interface Props {
  items: { label: string; href: string }[];
}
// <A> marks a link "active" on its own path and the paths below it, and
// sets aria-current="page" only on its own path.
const ANavBar: Component<Props> = (props) => {
  return (
    <nav aria-label="Main navigation" class="app-areas">
      {props.items.map(({ label, href }) => (
        <A href={href} class="navbarlink">
          {label}
        </A>
      ))}
    </nav>
  );
};

export default ANavBar;
