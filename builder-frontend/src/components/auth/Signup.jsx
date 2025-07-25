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
  "auth/email-already-in-use":
    "Email is already associated with a registered user.",
  // "auth/invalid-credential": "Click sign Up to create a new account"
  // Add more as needed
};

function getFriendlyErrorMessage(firebaseError) {
  return (
    firebaseErrorMessages[firebaseError.code] ||
    "Login failed. Please try again."
  );
}

export default function Signup({ toggleMode }) {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [passwordConfirm, setPasswordConfirm] = createSignal("");
  const [error, setError] = createSignal("");
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const { loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const isInputValid = validateInput();
    if (!isInputValid) return;

    try {
      setIsSigningIn(true);
      await register(email(), password());
      setIsSigningIn(false);
      setError(null);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setIsSigningIn(false);
      console.error(err.message);
    }
  };

  const validateInput = () => {
    if (password() != passwordConfirm()) {
      setError("Password does not match.");
      return false;
    }
    return true;
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
      <div className="pt-8 flex flex-col">
        <label className="text-sm text-gray-500 font-semibold" for="password">
          Confirm Password
        </label>
        <input
          className="w-100 border-1 border-gray-200 bg-gray-100 p-2"
          type="password"
          placeholder="Repeat Password"
          id="password"
          value={passwordConfirm()}
          onInput={(e) => setPasswordConfirm(e.target.value)}
        />
      </div>
      <button
        className={`mt-4 w-full p-2 rounded text-white font-bold transition ${
          isSigningIn()
            ? "bg-emerald-300 opacity-50 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
        type="submit"
        disabled={isSigningIn()}
        onClick={(e) => handleRegister(e)}
      >
        Sign Up
      </button>
      <div className="text-gray-600 pt-4 text-center" onClick={toggleMode}>
        Have an account?&nbsp;
        <span className="text-gray-700 font-bold hover:underline hover:cursor-pointer">
          Sign In
        </span>
      </div>
      <div className="h-4 text-center">
        {error() && <p style={{ color: "red" }}>{error()}</p>}
      </div>
    </form>
  );
}
