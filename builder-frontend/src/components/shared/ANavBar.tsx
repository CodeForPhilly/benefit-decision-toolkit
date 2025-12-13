import type { Component } from "solid-js";
import { A } from "@solidjs/router";

import "./ANavBar.css";

interface Props {
  items: { label: string; href: string }[];
}
const ANavBar: Component<Props> = (props) => {
  return (
    <div class="flex border-b border-gray-300">
      {props.items.map(({ label, href }) => (
        <A href={href} class="navbarlink">
          {label}
        </A>
      ))}
    </div>
  );
};

export default ANavBar;
