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
  getAdditionalUserInfo,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import { runAccountHooks } from "@/api/account";

const AuthContext = createContext();
const googleProvider = new GoogleAuthProvider();

export function AuthProvider(props) {
  const [user, setUser] = createSignal("loading");
  const [isAuthLoading, setIsAuthLoading] = createSignal(true);
  const [isProvisioningAccount, setIsProvisioningAccount] = createSignal(false);
  let unsubscribe;

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

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password) => {
    setIsProvisioningAccount(true);
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => {
        return runAccountHooks()
          .then(
            () => {
              console.log("Successfully hooked the account.");
            },
            (error) => {
              console.log("Error hooking the account", error);
            },
          )
          .finally(() => {
            setIsProvisioningAccount(false);
          });
      },
    );
  };

  const loginWithGoogle = async () => {
    try {
      return signInWithPopup(auth, googleProvider).then((userCredential) => {
        const isSignUp =
          getAdditionalUserInfo(userCredential)?.isNewUser || false;
        if (isSignUp) {
          setIsProvisioningAccount(true);
          runAccountHooks()
            .then(
              () => {
                console.log("Successfully hooked the account.");
              },
              (error) => {
                console.log("Error hooking the account", error);
              },
            )
            .finally(() => {
              setIsProvisioningAccount(false);
            });
        }
      });
    } catch (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isProvisioningAccount,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
