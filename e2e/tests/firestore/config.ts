import firebaseConfig from '../../../firebase.json';

export const firestoreEmulatorPort = firebaseConfig.emulators.firestore.port;
export const storageEmulatorPort = firebaseConfig.emulators.storage.port;

export const EMULATOR_PROJECT_ID = "demo-bdt-dev";
export const STORAGE_BUCKET = "demo-bdt-dev.appspot.com";
export const LIBRARY_API_BASE_URL = "http://localhost:8083";

// Test user ID from emulator-data/auth_export/accounts.json
export const TEST_USER_ID = "E2uB0h1FpSUKq5rGObr9jvmbn15E";

// Fixed IDs for predictable test navigation
export const TEST_SCREENER_ID = "test-screener-id";
export const TEST_BENEFIT_ID = "test-benefit-id";

// Derived URLs
export const firestoreBaseUrl = `http://localhost:${firestoreEmulatorPort}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`;
