import { test as setup } from '@playwright/test';

import firebaseConfig from '../../firebase.json';
const firestoreEmulatorPort = firebaseConfig.emulators.firestore.port;

setup('create new database', async ({ }) => {
  await fetch(`http://localhost:${firestoreEmulatorPort}/`).catch(() => {
    throw new Error('Firebase emulator not running');
  });
});
