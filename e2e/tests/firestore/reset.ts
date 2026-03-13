import { getCollection, patchDocument, deleteAllDocuments } from './firestoreClient';
import { listObjects, deleteObject } from './storageClient';

/**
 * Clears all Firestore documents while preserving the system/config document.
 * This ensures library API metadata remains available after reset.
 */
async function clearDb_preserveSystem(): Promise<void> {
  // Get system config before clearing
  const systemData = await getCollection('system') as { documents?: Array<unknown> };
  const configData = systemData.documents?.[0];

  if (!configData) {
    throw new Error('Could not retrieve system config data');
  }

  // Clear all documents
  await deleteAllDocuments();

  // Restore system config
  await patchDocument('system', 'config', configData);
}

/**
 * Clears all Storage objects except LibraryApiSchemaExports.
 * Preserves library API schema exports that are synced from library-api.
 */
async function clearStorage(): Promise<void> {
  const items = await listObjects();

  // Delete each object, but preserve LibraryApiSchemaExports (synced from library-api)
  for (const item of items) {
    if (item.name.startsWith('LibraryApiSchemaExports/')) {
      continue;
    }
    await deleteObject(item.name);
  }
}

/**
 * Resets the Firebase emulator to a clean state for testing.
 * Clears Firestore (preserving system config) and Storage (preserving library exports).
 * Use in beforeEach/afterEach hooks to isolate tests.
 */
export async function resetEmulator(): Promise<void> {
  await clearDb_preserveSystem();
  await clearStorage();
}
