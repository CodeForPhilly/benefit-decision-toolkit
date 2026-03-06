import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";

export type HamburgerMenuContextValue = {
  showMenu: () => boolean;
  setShowMenu: (show: boolean) => void;
  toggle: () => void;
};

export const HamburgerMenuContext = createContext<HamburgerMenuContextValue>();

export const useHamburgerMenuContext = () => {
  const ctx = useContext(HamburgerMenuContext);
  if (!ctx) {
    throw new Error(
      "HamburgerMenu components must be used within <HamburgerMenu>",
    );
  }
  return ctx;
};

export const HamburgerMenuWrapper: ParentComponent = (props) => {
  const [root, setRoot] = createSignal<HTMLDivElement>();
  const [showMenu, setShowMenu] = createSignal(false);

  const handleClickOutside = (ev: MouseEvent) => {
    const el = root();
    if (showMenu() && el && !el.contains(ev.target as Node)) {
      setShowMenu(false);
    }
  };

  const ctx: HamburgerMenuContextValue = {
    showMenu,
    setShowMenu,
    toggle: () => setShowMenu(!showMenu()),
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  return (
    <HamburgerMenuContext.Provider value={ctx}>
      <div ref={setRoot} class="menu-wrapper">
        {props.children}
      </div>
    </HamburgerMenuContext.Provider>
  );
};
