import { LIBRARY_API_BASE_URL } from './config';

// Cached library API version (fetched once per test run)
let _libraryApiVersion: string | null = null;

/**
 * Fetches the library-api version from its OpenAPI spec.
 * The result is cached for the duration of the test run.
 * @returns The version string (e.g., '0.6.0')
 */
export async function getVersion(): Promise<string> {
  if (_libraryApiVersion) {
    return _libraryApiVersion;
  }

  const response = await fetch(`${LIBRARY_API_BASE_URL}/q/openapi`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch library-api OpenAPI spec: ${response.status}`);
  }

  const yaml = await response.text();
  // Parse version from YAML: "  version: 0.6.0"
  const match = yaml.match(/^\s*version:\s*(.+)$/m);
  if (!match) {
    throw new Error('Could not find version in library-api OpenAPI spec');
  }

  _libraryApiVersion = match[1].trim();
  return _libraryApiVersion;
}
