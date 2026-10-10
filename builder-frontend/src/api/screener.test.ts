import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/auth", () => ({
  authGet: vi.fn(),
  authPost: vi.fn(),
  authDelete: vi.fn(),
  authPatch: vi.fn(),
}));
import { authPost } from "@/api/auth";
import { draftFormSchema } from "./screener";

describe("draft form API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the schema from the authenticated drafting endpoint", async () => {
    const schema = { type: "default", components: [] };
    vi.mocked(authPost).mockResolvedValue(
      new Response(JSON.stringify({ schema })),
    );
    await expect(draftFormSchema("screener-1")).resolves.toEqual(schema);
    expect(authPost).toHaveBeenCalledWith(
      expect.stringContaining("/screener/screener-1/draft-form"),
      {},
    );
  });

  it("preserves the API's useful generation failure message", async () => {
    vi.mocked(authPost).mockResolvedValue(
      new Response(JSON.stringify({ error: "Gemini is unavailable" }), {
        status: 503,
      }),
    );
    await expect(draftFormSchema("screener-1")).rejects.toMatchObject({
      status: 503,
      message: "Gemini is unavailable",
    });
  });
});
