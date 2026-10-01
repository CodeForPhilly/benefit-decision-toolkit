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

  // On /login and /signup, continue to the app after signing in. Anywhere
  // else, stay put: once signed in, MainLayout renders the requested page
  // (including legacy redirects) in place of this form.
  const finishSignIn = () => {
    if (location.pathname === "/login" || location.pathname === "/signup") {
      navigate("/screeners", { replace: true });
    }
  };

  const toggleMode = () => {
    if (location.pathname === "/signup") {
      navigate("/screeners");
    } else {
      navigate("/signup");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await loginWithGoogle();
      setIsSigningIn(false);
      finishSignIn();
    } catch (err) {
      setIsSigningIn(false);

      console.error(err.message);
    }
  };

  return (
    <div className="w-full h-screen flex self-center place-content-center place-items-center">
      <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
        <h1>
          <img
            src="/logos/bdt-logo-large-mono-light.svg"
            alt="Benefit Decision Toolkit"
            className="mx-auto w-full max-w-64 h-auto"
          />
        </h1>
        {location.pathname === "/signup" ? (
          <Signup toggleMode={toggleMode} onSignedIn={finishSignIn} />
        ) : (
          <Login toggleMode={toggleMode} onSignedIn={finishSignIn} />
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
