import { createSignal } from "solid-js";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "@solidjs/router";

const firebaseErrorMessages = {
  "auth/user-not-found": "No user found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/user-disabled": "This user account has been disabled.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/weak-password": "Password must be at least 6 characters.",
  // "auth/invalid-credential": "Click sign Up to create a new account"
  // Add more as needed
};

function getFriendlyErrorMessage(firebaseError) {
  return (
    firebaseErrorMessages[firebaseError.code] || "Incorrect email or password."
  );
}

export default function Login({ toggleMode }) {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const { loginWithGoogle, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsSigningIn(true);
      await login(email(), password());
      setIsSigningIn(false);
      setError(null);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setIsSigningIn(false);
      console.error(err.message);
    }
  };

  return (
    <form className="flex flex-col">
      <div className="pt-4 flex flex-col">
        <label className="text-sm text-gray-500 font-semibold" for="email">
          Email
        </label>
        <input
          className="w-100 border-1 border-gray-200 bg-gray-100 p-2"
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email()}
          onInput={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="pt-8 flex flex-col">
        <label className="text-sm text-gray-500 font-semibold" for="password">
          Password
        </label>
        <input
          className="w-100 border-1 border-gray-200 bg-gray-100 p-2"
          type="password"
          placeholder="Password"
          id="password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        className={`mt-4 w-full p-2 rounded text-white font-bold transition ${
          isSigningIn()
            ? "bg-emerald-300 opacity-50 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
        type="submit"
        onClick={(e) => handleLogin(e)}
        disabled={isSigningIn()}
      >
        Sign In
      </button>

      <div className="text-gray-600 pt-4 text-center" onClick={toggleMode}>
        Don't have an account?&nbsp;
        <span className="text-gray-700 font-bold hover:underline hover:cursor-pointer">
          Sign Up
        </span>
      </div>
      <div className="h-4 text-center">
        {error() && <p style={{ color: "red" }}>{error()}</p>}
      </div>
    </form>
  );
}
