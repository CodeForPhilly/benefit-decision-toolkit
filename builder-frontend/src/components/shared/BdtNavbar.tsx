import { Accessor } from "solid-js";

export interface NavbarProps {
  tabDefs: NavbarButtonDef[];
  activeTabKey: Accessor<string>;
}
interface NavbarButtonDef {
  key: string;
  label: string;
  onClick: () => void;
}

const BdtNavbar = ({ navProps }: { navProps: Accessor<NavbarProps> }) => {
  return (
    <nav aria-label="Editor sections" class="editor-sections">
      {navProps().tabDefs.map((tab) => (
        <button
          type="button"
          aria-current={
            navProps().activeTabKey() === tab.key ? "page" : undefined
          }
          data-testid={`editor-section-${tab.key}`}
          class="editor-section"
          classList={{ selected: navProps().activeTabKey() === tab.key }}
          onClick={tab.onClick}
        >
          {tab.label.charAt(0).toUpperCase() + tab.label.slice(1)}
        </button>
      ))}
    </nav>
  );
};

export default BdtNavbar;
