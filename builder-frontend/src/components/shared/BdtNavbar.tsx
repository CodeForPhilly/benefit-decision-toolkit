import { Accessor, createSignal, For, onCleanup, Show } from "solid-js";
import MenuIcon from "@/components/icon/MenuIcon";

export interface NavbarProps {
  tabDefs: NavbarButtonDef[];
  activeTabKey: Accessor<string>;
  titleDef: NavbarTitleDef | null;
  menuDef?: NavbarMenuDef;
}
interface NavbarTitleDef {
  label: string;
}
interface NavbarButtonDef {
  key: string;
  label: string;
  onClick: () => void;
}
interface NavbarMenuDef {
  items: NavbarMenuItem[];
}
interface NavbarMenuItem {
  key: string;
  label: string;
  onClick: () => void;
}

const BdtNavbar = ({ navProps }: { navProps: Accessor<NavbarProps> }) => {
  const [menuOpen, setMenuOpen] = createSignal(false);

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-navbar-menu]")) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("click", handleOutsideClick);
  onCleanup(() => document.removeEventListener("click", handleOutsideClick));

  return (
    <div class="flex border-b border-gray-300">
      <Show when={navProps().titleDef !== null}>
        <div class="py-2 px-4 font-bold text-gray-700 cursor-default">
          {navProps().titleDef!.label}
        </div>
      </Show>
      <For each={navProps().tabDefs}>
        {(tab) => (
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
        )}
      </For>
      <Show when={navProps().menuDef !== undefined}>
        <div class="relative ml-auto" data-navbar-menu>
          <button
            class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            aria-label="More options"
          >
            <MenuIcon />
          </button>
          <Show when={menuOpen()}>
            <div class="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-md z-10">
              <For each={navProps().menuDef!.items}>
                {(item) => (
                  <button
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      item.onClick();
                      setMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default BdtNavbar;
