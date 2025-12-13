import { createMemo } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";

import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const isNotRoot = createMemo(() => location.pathname !== "/");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="header">
      <a href="/" title="BDT Home">
        <img
          src="/logos/bdt-logo-large-mono-light.svg"
          alt="BDT logo"
          class="w-36"
        />
      </a>

      <div class="flex items-center">
        {isNotRoot() && (
          <a href="/" class="back-to-home">
            &larr; Back to home
          </a>
        )}
        <button type="button" onClick={handleLogout} class="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
}
