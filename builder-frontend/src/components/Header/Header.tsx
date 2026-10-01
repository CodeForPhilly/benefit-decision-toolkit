import { useAuth } from "../../context/AuthContext";
import { A, useNavigate } from "@solidjs/router";
import { Component, createSignal, DEV, Show } from "solid-js";

import { HamburgerMenu } from "@/components/shared/HamburgerMenu";
import ANavBar from "@/components/shared/ANavbar";

import "./Header.css";
import { Menu } from "lucide-solid";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { ExportExampleScreener } from "@/components/Header/ExportExampleScreener";

interface MenuProps {
  userEmail: string;
  displayName: string | null;
  logout: () => void;
}

const HeaderMenu: Component<MenuProps> = (props) => {
  const [showExportMenu, setShowExportMenu] = createSignal(false);

  return (
    <section class="header-menu">
      <h2 class="header-user-email" title={props.userEmail}>
        Welcome {props.displayName} {props.userEmail}
      </h2>
      <hr />
      <ul>
        <li>
          <a
            class="header-menu-item block"
            href="https://bdt-docs.web.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            User Guide
          </a>
        </li>
        <li>
          <button
            type="button"
            class="header-menu-item text-left"
            onClick={props.logout}
          >
            Logout
          </button>
        </li>
      </ul>
      <Show when={DEV}>
        <Button onClick={() => setShowExportMenu(true)}>
          Export Example Screener
        </Button>
        <Modal show={showExportMenu()} onClose={() => setShowExportMenu(false)}>
          <ExportExampleScreener setShowExportMenu={setShowExportMenu} />
        </Modal>
      </Show>
    </section>
  );
};

export default function Header() {
  const auth = useAuth();
  const userEmail = auth.user().email;
  const displayName = auth.user().displayName;
  const { logout } = auth;

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="app-header">
      <A href="/screeners" aria-label="BDT screeners" class="app-brand">
        <img src="/logos/bdt-logo-small-mono-light.svg" alt="BDT logo" />
      </A>
      <ANavBar
        items={[
          { label: "Screeners", href: "/screeners" },
          { label: "Custom Checks", href: "/custom-checks" },
        ]}
      />
      <div class="app-account">
        <HamburgerMenu>
          <HamburgerMenu.Button label="Account menu">
            <Menu size={20} />
          </HamburgerMenu.Button>
          <HamburgerMenu.Panel closeLabel="Close account menu">
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
