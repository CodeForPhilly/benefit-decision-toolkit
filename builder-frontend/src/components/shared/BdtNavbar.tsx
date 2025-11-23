import { Accessor, Show } from "solid-js";

export interface NavbarProps {
  tabDefs: NavbarButtonDef[];
  activeTabKey: Accessor<string>;
  titleDef: NavbarTitleDef | null;
}
interface NavbarTitleDef {
  label: string;
}
interface NavbarButtonDef {
  key: string;
  label: string;
  onClick: () => void;
};

const BdtNavbar = ({navProps}: {navProps: Accessor<NavbarProps>}) => {
  return (
    <div class="flex border-b border-gray-300">
      <Show when={navProps().titleDef !== null}>
        <div class="py-2 px-4 font-bold text-gray-700 cursor-default">
          {navProps().titleDef!.label}
        </div>
      </Show>
      {navProps().tabDefs.map((tab) => (
        <button
          class={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            navProps().activeTabKey() === tab.key
              ? "border-b border-gray-700 text-gray-700 hover:bg-gray-200"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          }`}
          onClick={tab.onClick}
        >
          {tab.label.charAt(0).toUpperCase() + tab.label.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default BdtNavbar;
