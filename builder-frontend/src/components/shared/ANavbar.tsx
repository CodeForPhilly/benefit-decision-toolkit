import type { Component } from "solid-js";
import { useLocation } from "@solidjs/router";

import "./ANavbar.css";

interface Props {
  items: { label: string; href: string }[];
}
const ANavBar: Component<Props> = (props) => {
  const location = useLocation();
  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Main navigation" class="app-areas">
      {props.items.map(({ label, href }) => (
        <a
          href={href}
          class="navbarlink"
          classList={{ active: isActive(href), inactive: !isActive(href) }}
          aria-current={isActive(href) ? "page" : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
};

export default ANavBar;
