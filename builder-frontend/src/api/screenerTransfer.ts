import { authGet, authPost } from "@/api/auth";
import { apiErrorFrom } from "@/api/check";
import { env } from "@/config/environment";

export const MAX_SCREENER_FILE_BYTES = 10 * 1024 * 1024;

export async function exportScreener(screenerId: string): Promise<Blob> {
  const response = await authGet(
    `${env.apiUrl}/screener/${encodeURIComponent(screenerId)}/export`,
  );
  if (!response.ok) {
    throw await apiErrorFrom(response, "Could not export the screener");
  }
  return response.blob();
}

export async function readScreenerFile(
  file: File,
): Promise<Record<string, unknown>> {
  if (file.size > MAX_SCREENER_FILE_BYTES) {
    throw new Error("Choose a screener file smaller than 10 MB.");
  }
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a BDT screener export.",
    );
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof (data as Record<string, unknown>).screenerName !== "string"
  ) {
    throw new Error("Choose a BDT screener export with a screener name.");
  }
  return data as Record<string, unknown>;
}

export async function importScreener(
  file: File,
  name?: string,
): Promise<{ id: string }> {
  const data = await readScreenerFile(file);
  if (name !== undefined) data.screenerName = name.trim();
  const response = await authPost(`${env.apiUrl}/screener/import`, data);
  if (!response.ok) {
    throw await apiErrorFrom(response, "Could not import the screener");
  }
  return response.json();
}

export async function downloadScreener(screenerId: string, name: string) {
  const blob = await exportScreener(screenerId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.replace(/[^a-zA-Z0-9_-]+/g, "-") || "screener"}.bdt.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Allow the browser to start the download before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
