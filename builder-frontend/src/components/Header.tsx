import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "@solidjs/router";

import bdtLogo from "../assets/logos/bdt-logo-large-mono-light.svg";
import { createMemo, Show } from "solid-js";

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
    <header class="bg-gray-200 min-h-24 h-24 px-4 flex items-center justify-between border-b-2 border-gray-300">
      <div class="flex items-center space-x-6">
        <img src={bdtLogo} alt="" class="w-36" />
      </div>
      <div class="flex items-center h-full">
        <Show when={isNotRoot()}>
          <HeaderButton
            buttonText="← Back to Home"
            onClick={() => navigate("/")}
          />
        </Show>
        <HeaderButton buttonText="Logout" onClick={handleLogout} />
      </div>
    </header>
  );
}
