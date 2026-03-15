import { storageEmulatorPort, STORAGE_BUCKET } from './config';

/** Represents an object in Cloud Storage */
export interface StorageObject {
  name: string;
}

/**
 * Uploads a string as an object to the Storage emulator.
 * @param path - The storage path (e.g., 'form/working/screener-id.json')
 * @param content - The string content to upload
 */
export async function uploadObject(path: string, content: string): Promise<void> {
  const url = `http://localhost:${storageEmulatorPort}/upload/storage/v1/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Length': Buffer.byteLength(content, 'utf8').toString(),
    },
    body: content,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Failed to upload to storage ${path}: ${await response.text()}`);
  }
}

/**
 * Lists all objects in the Storage emulator bucket.
 * @returns Array of storage objects, or empty array if bucket doesn't exist
 */
export async function listObjects(): Promise<StorageObject[]> {
  const url = `http://localhost:${storageEmulatorPort}/storage/v1/b/${STORAGE_BUCKET}/o`;
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    // If bucket is empty or doesn't exist yet, return empty array
    if (response.status === 404) return [];
    throw new Error(`Failed to list storage objects: ${await response.text()}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Deletes an object from the Storage emulator.
 * Silently succeeds if the object doesn't exist.
 * @param name - The object name/path to delete
 */
export async function deleteObject(name: string): Promise<void> {
  const url = `http://localhost:${storageEmulatorPort}/storage/v1/b/${STORAGE_BUCKET}/o/${encodeURIComponent(name)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok && response.status !== 404) {
    console.warn(`Failed to delete storage object ${name}: ${response.status}`);
  }
}
