import {
  createSignal,
  createContext,
  useContext,
  onCleanup,
  onMount,
} from "solid-js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { clearSessionStorage } from "../storageUtils/storageUtils";
import { auth } from "../firebase/firebase";

const AuthContext = createContext();
const googleProvider = new GoogleAuthProvider();

export function AuthProvider(props) {
  const [user, setUser] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  let unsubscribe;

  onMount(() => {
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      clearSessionStorage();
      setLoading(false);
    });
  });

  onCleanup(() => {
    if (unsubscribe) unsubscribe();
  });

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password) => {
    console.log("register");
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      return signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
