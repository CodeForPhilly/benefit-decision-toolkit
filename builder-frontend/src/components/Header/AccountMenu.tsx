import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";

export const AccountMenu = () => {
  const [root, setRoot] = createSignal<HTMLDivElement>();
  const [showMenu, setShowMenu] = createSignal(false);
  const navigate = useNavigate();

  const auth = useAuth();
  const userEmail = auth.user().email;
  const { logout } = auth;

  const handleClickOutside = (ev: MouseEvent) => {
    const el = root();
    if (showMenu() && el && !el.contains(ev.target as Node)) {
      setShowMenu(false);
    }
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div ref={setRoot} class="account-menu-wrapper">
      <div class="account-menu-toggle" onClick={() => setShowMenu(!showMenu())}>
        <div>Welcome {userEmail}</div>
      </div>
      <Show when={showMenu()}>
        <div class="account-menu-panel">
          <div class="account-menu-item">
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
