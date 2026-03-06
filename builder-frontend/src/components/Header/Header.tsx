import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "@solidjs/router";
import { Component, For, Show } from "solid-js";

import bdtLogo from "@/assets/logos/bdt-logo-large-mono-light.svg";
import { HamburgerMenu } from "@/components/shared/HamburgerMenu";

import "./Header.css";

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
        px-4 py-3 text-md font-bold text-gray-700 rounded-md
        flex items-center
        hover:bg-gray-300 cursor-pointer select-none"
    >
      {buttonText}
    </div>
  );
};

interface MenuProps {
  userEmail: string;
  logout: () => void;
}

const HeaderMenu: Component<MenuProps> = (props) => {
  const menuItems: { label: string; onClick: () => void }[] = [
    {
      label: "User Guide",
      onClick: () => window.open("https://bdt-docs.web.app/", "_blank"),
    },
    { label: "Logout", onClick: props.logout },
  ];

  return (
    <div class="header-menu">
      <div class="header-user-email" title={props.userEmail}>
        Welcome {props.userEmail}
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
    </div>
  );
};

export default function Header() {
  const auth = useAuth();
  const userEmail = auth.user().email;
  const { logout } = auth;

  const navigate = useNavigate();

  const location = useLocation();
  const isNotRoot = location.pathname !== "/";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="bg-gray-200 min-h-24 h-24 px-4 flex items-center justify-between border-b-2 border-gray-300">
      <div class="flex items-center space-x-6">
        <img
          src={bdtLogo}
          alt="BDT logo"
          class="w-36 cursor-pointer"
          onClick={() => navigate("/")}
        />
      </div>
      <div class="flex items-center h-full">
        <Show when={isNotRoot}>
          <HeaderButton
            buttonText="← Back to Home"
            onClick={() => navigate("/")}
          />
        </Show>

        <HamburgerMenu>
          <HamburgerMenu.Button>
            <div>Open menu</div>
          </HamburgerMenu.Button>
          <HamburgerMenu.Panel>
            <HeaderMenu userEmail={userEmail} logout={handleLogout} />
          </HamburgerMenu.Panel>
        </HamburgerMenu>
      </div>
    </header>
  );
}
