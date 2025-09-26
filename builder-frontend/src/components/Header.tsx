import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@solidjs/router";


const HeaderButton = ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      class="
        h-full px-4 text-sm font-bold text-gray-500
        flex items-center
        hover:bg-gray-300 cursor-pointer select-none"
    >
      {buttonText}
    </div>
  );
}

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="bg-gray-200 min-h-18 h-18 px-4 flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <span class="text-lg font-bold text-gray-600">
          Benefit Decision Toolkit
        </span>
      </div>
      <div class="flex items-center h-full">
        <HeaderButton buttonText="← Back to Projects" onClick={() => navigate("/")} />
        <HeaderButton buttonText="Logout" onClick={handleLogout} />
      </div>
    </header>
  );
}
