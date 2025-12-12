import {
  createSignal,
  createContext,
  useContext,
  onCleanup,
  onMount,
  Accessor,
  ParentProps,
} from "solid-js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  UserCredential,
  Unsubscribe,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

type AuthContextValue = {
  user: Accessor<User | null>;
  isAuthLoading: Accessor<boolean>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential | null>;
  register: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue>();
const googleProvider = new GoogleAuthProvider();

export function AuthProvider(props: ParentProps) {
  const [user, setUser] = createSignal<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = createSignal(true);
  let unsubscribe: Unsubscribe | undefined;

  onMount(() => {
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsAuthLoading(true);
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
  });

  onCleanup(() => {
    if (unsubscribe) unsubscribe();
  });

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider).catch((error) => {
      console.error("Google sign-in error:", error.message);
      return null;
    });
    // try {
    //   return signInWithPopup(auth, googleProvider);
    // } catch (error) {
    //   console.error("Google sign-in error:", error.message);
    // }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, isAuthLoading, login, register, loginWithGoogle, logout }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("AuthContext must be used within <AuthProvider />");
  }

  return ctx;
}
