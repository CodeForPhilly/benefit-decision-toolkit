import {
  firestoreEmulatorPort,
  EMULATOR_PROJECT_ID,
  firestoreBaseUrl,
} from './config';

/**
 * Converts a JavaScript value to Firestore REST API value format.
 * Handles strings, numbers, booleans, arrays, objects, and null/undefined.
 */
function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Converts a plain JavaScript object to Firestore document format.
 */
function toFirestoreDocument(data: Record<string, unknown>): { fields: Record<string, unknown> } {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return { fields };
}

/**
 * Creates a new document in a Firestore collection via the emulator REST API.
 * @param collection - The collection path (e.g., 'workingScreener')
 * @param docId - The document ID to create
 * @param data - The document data as a plain JavaScript object
 */
export async function createDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = `${firestoreBaseUrl}/${collection}?documentId=${docId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestoreDocument(data)),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Failed to create document ${collection}/${docId}: ${await response.text()}`);
  }
}

/**
 * Creates a new document in a Firestore subcollection via the emulator REST API.
 * @param parentCollection - The parent collection path
 * @param parentId - The parent document ID
 * @param subcollection - The subcollection name
 * @param docId - The document ID to create
 * @param data - The document data as a plain JavaScript object
 */
export async function createSubcollectionDocument(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = `${firestoreBaseUrl}/${parentCollection}/${parentId}/${subcollection}?documentId=${docId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestoreDocument(data)),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Failed to create subcollection document: ${await response.text()}`);
  }
}

/**
 * Retrieves all documents from a Firestore collection via the emulator REST API.
 * @param collection - The collection path to fetch
 * @returns The raw Firestore response containing documents
 */
export async function getCollection(collection: string): Promise<unknown> {
  const response = await fetch(`${firestoreBaseUrl}/${collection}`, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Failed to get collection ${collection}: ${await response.text()}`);
  }
  return response.json();
}

/**
 * Updates an existing document in Firestore via the emulator REST API.
 * @param collection - The collection path
 * @param docId - The document ID to update
 * @param data - The document data (in raw Firestore format)
 */
export async function patchDocument(
  collection: string,
  docId: string,
  data: unknown
): Promise<void> {
  const response = await fetch(`${firestoreBaseUrl}/${collection}/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Failed to patch document ${collection}/${docId}: ${await response.text()}`);
  }
}

/**
 * Deletes all documents from the Firestore emulator database.
 * Uses the emulator-specific endpoint for bulk deletion.
 */
export async function deleteAllDocuments(): Promise<void> {
  const response = await fetch(
    `http://localhost:${firestoreEmulatorPort}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`,
    {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to delete all documents: ${await response.text()}`);
  }
}
