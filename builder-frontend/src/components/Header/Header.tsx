import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "@solidjs/router";
import {
  Component,
  createMemo,
  createSignal,
  DEV,
  For,
  JSX,
  Match,
  Show,
  Switch,
} from "solid-js";

import { HamburgerMenu } from "@/components/shared/HamburgerMenu";

import "./Header.css";
import { Menu } from "lucide-solid";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { exportExampleScreener } from "@/api/account";

const HeaderButton = ({
  buttonText,
  onClick,
}: {
  buttonText: string;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      class="
        px-4 py-2 text-md font-bold text-gray-700 rounded-md
        flex items-center
        hover:bg-gray-300 cursor-pointer select-none"
    >
      {buttonText}
    </div>
  );
};

interface MenuProps {
  userEmail: string;
  displayName: string | null;
  logout: () => void;
}

const HeaderMenu: Component<MenuProps> = (props) => {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = createSignal(false);
  const [exportingMessage, setExportingMessage] = createSignal("");
  const [isExportingExample, setIsExportingExample] = createSignal(false);

  const menuItems: { label: string; onClick: () => void }[] = [
    {
      label: "Custom Checks",
      onClick: () => navigate("/check"),
    },
    {
      label: "User Guide",
      onClick: () => window.open("https://bdt-docs.web.app/", "_blank"),
    },
    { label: "Logout", onClick: props.logout },
  ];

  const handleExportExampleScreener: JSX.EventHandler<
    HTMLButtonElement,
    MouseEvent
  > = async (e) => {
    setIsExportingExample(true);
    setExportingMessage("");
    const result = await exportExampleScreener();
    if (!result.success) {
      setExportingMessage("An error occurred exporting.");
    } else {
      setExportingMessage("Successfully exported screeners.");
    }
    setIsExportingExample(false);
  };
  return (
    <div class="header-menu">
      <div class="header-user-email" title={props.userEmail}>
        Welcome {props.displayName} {props.userEmail}
      </div>
      <hr />
      <ul>
        <For each={menuItems}>
          {(menuItem) => (
            <li class="header-menu-item" onClick={menuItem.onClick}>
              {menuItem.label}
            </li>
          )}
        </For>
      </ul>
      <Show when={DEV}>
        <Button onClick={() => setShowExportMenu(true)}>
          Export Example Screener
        </Button>
        <Modal show={showExportMenu()} onClose={() => setShowExportMenu(false)}>
          <div>Ready to save changes to the example screener?</div>
          <Button variant="secondary" onClick={() => setShowExportMenu(false)}>
            Cancel
          </Button>
          <Switch>
            <Match when={!isExportingExample()}>
              <Button onClick={handleExportExampleScreener}>Export</Button>
            </Match>
            <Match when={isExportingExample()}>Waiting for export</Match>
          </Switch>
          <div>{exportingMessage()}</div>
        </Modal>
      </Show>
    </div>
  );
};

export default function Header() {
  const auth = useAuth();
  const userEmail = auth.user().email;
  const displayName = auth.user().displayName;
  const { logout } = auth;

  const navigate = useNavigate();

  const location = useLocation();
  const isNotRoot = createMemo(
    () => location.pathname !== "/" && location.pathname !== "/projects",
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="bg-gray-200 min-h-12 h-12 px-4 flex items-center justify-between border-b-2 border-gray-300">
      <div class="flex items-center space-x-6">
        <img
          src="/logos/bdt-logo-small-mono-light.svg"
          alt="BDT logo"
          class="w-18 cursor-pointer"
          onClick={() => navigate("/")}
        />
      </div>
      <div class="flex items-center h-full">
        <Show when={isNotRoot()}>
          <HeaderButton
            buttonText="← Back to Home"
            onClick={() => navigate("/")}
          />
        </Show>

        <HamburgerMenu>
          <HamburgerMenu.Button>
            <Menu />
          </HamburgerMenu.Button>
          <HamburgerMenu.Panel>
            <HeaderMenu
              userEmail={userEmail}
              displayName={displayName}
              logout={handleLogout}
            />
          </HamburgerMenu.Panel>
        </HamburgerMenu>
      </div>
    </header>
  );
}
