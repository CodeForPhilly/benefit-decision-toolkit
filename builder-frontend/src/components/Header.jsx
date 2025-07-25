import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@solidjs/router";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="bg-gray-200  px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <span class="text-lg font-bold text-gray-600">
          Benefits Decision Toolkit
        </span>
      </div>
      <div className="flex gap-4">
        <span
          onClick={() => navigate("/")}
          class="font-bold text-sm text-gray-500 hover:underline"
        >
          ← Back to Projects
        </span>
        <span
          onClick={handleLogout}
          className="font-bold text-sm text-gray-500 hover:underline"
        >
          Logout
        </span>
      </div>
    </header>
  );
}
