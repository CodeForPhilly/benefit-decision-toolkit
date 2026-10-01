import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/auth", () => ({
  authGet: vi.fn(),
  authPatch: vi.fn(),
  authPost: vi.fn(),
  authPut: vi.fn(),
}));

import { authPatch, authPost } from "@/api/auth";
import { addCheck, ApiError, updateCheck, publishCheck } from "./check";

const request = {
  name: "incomeCheck",
  module: "income",
  description: "Checks income",
  parameterDefinitions: [],
};

describe("publishCheck", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("returns the updated check from the API", async () => {
    const check = { id: "W-check", name: "Income", version: "2.0.0" };
    vi.mocked(authPost).mockResolvedValue(new Response(JSON.stringify(check)));
    await expect(publishCheck(check.id)).resolves.toEqual(check);
  });

  it("reports the server's publication error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(authPost).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Failed to extract input schema" }),
        { status: 500 },
      ),
    );
    await expect(publishCheck("W-check")).rejects.toMatchObject({
      message: "Failed to extract input schema",
      status: 500,
    });
  });
});

describe("updateCheck", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a check name change", async () => {
    vi.mocked(authPatch).mockResolvedValue(new Response("{}", { status: 200 }));

    await updateCheck("check-id", {
      name: "New title",
      dmnModel: "renamed",
      originalDmnModel: "original",
    });

    expect(authPatch).toHaveBeenCalledWith(
      expect.stringContaining("/custom-checks/check-id"),
      { name: "New title", dmnModel: "renamed", originalDmnModel: "original" },
    );
  });
});

describe("addCheck", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("reports the API error message when check creation fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(authPost).mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            'You already have a check named "incomeCheck" in module "income".',
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(addCheck(request)).rejects.toThrow(
      'You already have a check named "incomeCheck" in module "income".',
    );
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Error creating new check:",
      expect.objectContaining({
        message:
          'You already have a check named "incomeCheck" in module "income".',
        status: 409,
      }),
    );
  });

  it("carries the response status so callers can tell failures apart", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(authPost).mockResolvedValue(
      new Response(JSON.stringify({ error: "Could not save Check" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(addCheck(request)).rejects.toMatchObject({
      status: 500,
    });
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Error creating new check:",
      expect.objectContaining({ message: "Could not save Check", status: 500 }),
    );
  });

  it("falls back to the status when the error response is not JSON", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(authPost).mockResolvedValue(
      new Response("unavailable", { status: 503 }),
    );

    await expect(addCheck(request)).rejects.toThrow(
      "Post failed with status: 503",
    );
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Error creating new check:",
      expect.objectContaining({
        message: "Post failed with status: 503",
        status: 503,
      }),
    );
  });

  it("rejects with an ApiError", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(authPost).mockResolvedValue(
      new Response("unavailable", { status: 503 }),
    );

    await expect(addCheck(request)).rejects.toBeInstanceOf(ApiError);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Error creating new check:",
      expect.any(ApiError),
    );
  });
});
