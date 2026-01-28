import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { env } from "@/config/environment";

const API_KEY = import.meta.env.VITE_API_KEY;
const AUTH_DOMAIN = env.authDomain;
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;
const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET;
const MESSAGING_SENDER_ID = import.meta.env.VITE_MESSAGING_SENDER_ID;
const APP_ID = import.meta.env.VITE_APP_ID;
const MEASUREMENT_ID = import.meta.env.VITE_MEASUREMENT_ID;

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Connect to emulators in development
if (import.meta.env.MODE === 'development') {
  try {
    const prefixes = ["localhost", "127.0.0.1"];
    const isLocalhost = prefixes.some(prefix => AUTH_DOMAIN.startsWith(prefix));
    const protocol = isLocalhost ? 'http' : 'https';
    const authEmulatorUrl = `${protocol}://${AUTH_DOMAIN}`;
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    console.log("🔧 Connected to Firebase auth emulator");
  } catch (error) {
    console.log("Error connecting to Firebase auth emulator:", error);
  }
}
