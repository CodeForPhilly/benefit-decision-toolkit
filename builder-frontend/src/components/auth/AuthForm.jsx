import { createSignal } from "solid-js";
import GoogleLoginButton from "./GoogleLoginButton";
import { useAuth } from "../../context/AuthContext";
import Login from "./Login";
import Signup from "./Signup";
import { useLocation, useNavigate } from "@solidjs/router";

export default function AuthForm() {
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMode = () => {
    if (location.pathname === "/login") {
      navigate("/signup");
    } else {
      navigate("/login");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await loginWithGoogle();
      setIsSigningIn(false);
      navigate("/");
    } catch (err) {
      setIsSigningIn(false);

      console.error(err.message);
    }
  };

  return (
    <div className="w-full h-screen flex self-center place-content-center place-items-center">
      <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
        <div className="text-gray-800 text-xl font-semibold sm:text-2xl">
          Benefits Decision Tookit
        </div>
        {location.pathname === "/login" ? (
          <Login toggleMode={toggleMode}></Login>
        ) : (
          <Signup toggleMode={toggleMode}></Signup>
        )}
        <div class="relative flex w-100 h-12 justify-center items-center">
          <hr class="absolute w-100 border-t border-gray-300" />
          <div class="absolute flex w-100 items-center justify-center text-center text-md font-bold text-gray-500">
            <span className="bg-white px-2">OR</span>
          </div>
        </div>
        <GoogleLoginButton
          isSigningIn={isSigningIn}
          onGoogleSignIn={handleGoogleLogin}
        ></GoogleLoginButton>
      </div>
    </div>
  );
}
