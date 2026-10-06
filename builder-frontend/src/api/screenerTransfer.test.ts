import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/auth", () => ({ authGet: vi.fn(), authPost: vi.fn() }));
import { authGet, authPost } from "@/api/auth";
import {
  exportScreener,
  importScreener,
  MAX_SCREENER_FILE_BYTES,
  readScreenerFile,
} from "./screenerTransfer";

const file = (content: string) =>
  ({ size: content.length, text: async () => content }) as File;

describe("screener transfer API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloads the complete export through the authenticated endpoint", async () => {
    const json = JSON.stringify({ format: "bdt-screener", formatVersion: 1 });
    vi.mocked(authGet).mockResolvedValue(new Response(json));
    expect(await (await exportScreener("screener-1")).text()).toBe(json);
    expect(authGet).toHaveBeenCalledWith(
      expect.stringContaining("/screener/screener-1/export"),
    );
  });

  it("uploads the parsed file and returns the new screener ID", async () => {
    const data = {
      format: "bdt-screener",
      formatVersion: 1,
      screenerName: "Example",
      benefits: [],
      customChecks: [],
    };
    vi.mocked(authPost).mockResolvedValue(
      new Response(JSON.stringify({ id: "new-screener" }), { status: 201 }),
    );
    await expect(
      importScreener(await readScreenerFile(file(JSON.stringify(data)))),
    ).resolves.toEqual({
      id: "new-screener",
    });
    expect(authPost).toHaveBeenCalledWith(
      expect.stringContaining("/screener/import"),
      data,
    );
  });

  it("rejects oversized files before reading or uploading them", async () => {
    const oversized = {
      size: MAX_SCREENER_FILE_BYTES + 1,
      text: vi.fn(),
    } as unknown as File;
    await expect(readScreenerFile(oversized)).rejects.toThrow("10 MB");
    expect(oversized.text).not.toHaveBeenCalled();
  });

  it("reports invalid JSON without uploading it", async () => {
    await expect(readScreenerFile(file("not JSON"))).rejects.toThrow(
      "not valid JSON",
    );
  });

  it("shows the server's validation error", async () => {
    vi.mocked(authPost).mockResolvedValue(
      new Response(JSON.stringify({ error: "Missing custom check" }), {
        status: 400,
      }),
    );
    await expect(importScreener({ screenerName: "Example" })).rejects.toThrow(
      "Missing custom check",
    );
  });

  it("reports non-JSON export failures", async () => {
    vi.mocked(authGet).mockResolvedValue(
      new Response("Forbidden", { status: 403 }),
    );
    await expect(exportScreener("screener-1")).rejects.toThrow(
      "Could not export",
    );
  });
});

it("uses the chosen name without changing the parsed file", async () => {
  vi.mocked(authPost).mockResolvedValue(
    new Response('{"id":"copy"}', { status: 201 }),
  );
  const original = {
    screenerName: "Example",
    benefits: [],
    customChecks: [],
  };
  await importScreener(original, " Example - Copy ");
  expect(authPost).toHaveBeenLastCalledWith(expect.any(String), {
    screenerName: "Example - Copy",
    benefits: [],
    customChecks: [],
  });
  expect(original.screenerName).toBe("Example");
});
