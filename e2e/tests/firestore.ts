import firebaseConfig from '../../firebase.json';
const firestoreEmulatorPort = firebaseConfig.emulators.firestore.port;


const EMULATOR_PROJECT_ID = "demo-bdt-dev";

async function clearDb_preserveSystem() {
  const systemDataResponse = await fetch(
    `http://localhost:${firestoreEmulatorPort}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/system`,
    {
      signal: AbortSignal.timeout(5000),
      method: 'GET',
    }
  );
  if (systemDataResponse.status !== 200) {
    throw new Error('Trouble retrieving System Data: ' + (await systemDataResponse.text()));
  }
  const systemData = await systemDataResponse.json();
  const configData = systemData["documents"][0];

  const deleteResponse = await fetch(
    `http://localhost:${firestoreEmulatorPort}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`,
    {
      signal: AbortSignal.timeout(5000),
      method: 'DELETE',
    }
  );
  if (deleteResponse.status !== 200) {
    throw new Error('Trouble clearing Emulator: ' + (await deleteResponse.text()));
  }

  const systemDataPatch = await fetch(
    `http://localhost:${firestoreEmulatorPort}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/system/config`,
    {
      signal: AbortSignal.timeout(5000),
      method: 'PATCH',
      body: JSON.stringify(configData),
      headers: {'Content-Type': 'application/json'}
    }
  );
  if (systemDataPatch.status !== 200) {
    throw new Error('Trouble Patching System Data: ' + (await systemDataPatch.text()));
  }

  return;
}

async function resetDb() {
  await clearDb_preserveSystem();
}

export { resetDb };
