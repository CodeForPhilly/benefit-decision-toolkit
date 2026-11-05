// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Screener from "./Screener";
import {
  evaluatePublishedScreener,
  fetchPublishedScreener,
} from "@/api/publishedScreener";
import type { ScreenerResult } from "@/types";
import { answer, input, until } from "@/testing/formJs";

const integration = vi.hoisted(() => ({
  enabled: true,
  initialize: undefined as
    | undefined
    | ((data: Record<string, unknown>) => void),
  disconnect: undefined as undefined | ((reason: string) => void),
  start: vi.fn(),
  dispose: vi.fn(),
  result: vi.fn(),
  error: vi.fn(),
  fail: vi.fn(),
  origin: "https://crm.example",
}));
const formSchema = {
  type: "default",
  id: "published-test",
  schemaVersion: 18,
  components: [
    { id: "city", type: "textfield", key: "custom.city", label: "City" },
  ],
};

vi.mock("@solidjs/router", () => ({
  useParams: () => ({ publishedScreenerId: "published-id" }),
}));
vi.mock("@/api/publishedScreener", () => ({
  fetchPublishedScreener: vi.fn(async () => ({
    screenerName: "Test",
    formSchema,
    integrationOrigins: ["https://crm.example"],
  })),
  evaluatePublishedScreener: vi.fn(),
}));
vi.mock("@/integrations/screenerBridge", () => ({
  createScreeningBridge: (
    _: string,
    callbacks: {
      initialize: () => void;
      onDisconnect: (reason: string) => void;
    },
  ) => {
    integration.initialize = callbacks.initialize;
    integration.disconnect = callbacks.onDisconnect;
    return integration.enabled ? integration : undefined;
  },
}));
const result = (value: "TRUE" | "FALSE"): ScreenerResult => ({
  benefit: { name: "Benefit", result: value, check_results: {} },
});
const initialData = { custom: { city: "Philadelphia" } };

describe("published screener integration lifecycle", () => {
  let container: HTMLDivElement;
  let dispose: () => void;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluatePublishedScreener).mockReset();
    integration.enabled = true;
    container = document.createElement("div");
    document.body.append(container);
  });
  afterEach(() => {
    dispose?.();
    container.remove();
    vi.restoreAllMocks();
  });

  it("waits for prefill, then sends results for the latest answers to the host", async () => {
    vi.mocked(evaluatePublishedScreener)
      .mockResolvedValueOnce(result("TRUE"))
      .mockResolvedValueOnce(result("FALSE"));
    dispose = render(() => <Screener />, container);
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    expect(container.textContent).toContain("Waiting for information");
    expect(evaluatePublishedScreener).not.toHaveBeenCalled();
    integration.initialize!(initialData);
    await until(() =>
      expect(integration.result).toHaveBeenCalledExactlyOnceWith(
        initialData,
        result("TRUE"),
        undefined,
      ),
    );
    expect(evaluatePublishedScreener).toHaveBeenCalledWith(
      "published-id",
      initialData,
    );
    expect(input("City")!.value).toBe("Philadelphia");

    answer("City", "Pittsburgh");
    await until(() => expect(integration.result).toHaveBeenCalledTimes(2));
    expect(integration.result).toHaveBeenLastCalledWith(
      { custom: { city: "Pittsburgh" } },
      result("FALSE"),
      undefined,
    );
    expect(container.textContent).toContain("Ineligible");
  });

  it("tells the person and the host when evaluating the latest answers fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(evaluatePublishedScreener).mockRejectedValueOnce(
      new Error("Unavailable"),
    );
    dispose = render(() => <Screener />, container);
    integration.initialize!(initialData);
    await until(() => expect(integration.error).toHaveBeenCalledOnce());
    expect(container.textContent).toContain("We couldn't update your results");
    expect(integration.result).not.toHaveBeenCalled();
  });

  it("disposes the bridge when the page closes", async () => {
    dispose = render(() => <Screener />, container);
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    dispose();
    expect(integration.dispose).toHaveBeenCalledOnce();
  });

  it("tells the user and the host when the screener can't be loaded", async () => {
    vi.mocked(fetchPublishedScreener).mockRejectedValueOnce(
      new Error("Fetch failed with status: 404"),
    );
    dispose = render(() => <Screener />, container);
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    expect(integration.fail).toHaveBeenCalledExactlyOnceWith(
      "SCREENER_UNAVAILABLE",
    );
    expect(container.textContent).toContain("couldn’t be loaded");
    expect(container.textContent).not.toContain("Waiting for information");
    integration.initialize!(initialData);
    await Promise.resolve();
    expect(input("City")).toBeUndefined();
  });

  it("starts the bridge only after the screener loads", async () => {
    let load!: (screener: any) => void;
    vi.mocked(fetchPublishedScreener).mockReturnValueOnce(
      new Promise((resolve) => (load = resolve)),
    );
    dispose = render(() => <Screener />, container);
    await Promise.resolve();
    expect(integration.start).not.toHaveBeenCalled();
    load({
      screenerName: "Test",
      formSchema,
      integrationOrigins: ["https://crm.example"],
    });
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    expect(integration.fail).not.toHaveBeenCalled();
  });

  it("refuses a host whose origin the screener doesn't allow", async () => {
    vi.mocked(fetchPublishedScreener).mockResolvedValueOnce({
      screenerName: "Test",
      formSchema,
      integrationOrigins: ["https://other-crm.example"],
    });
    vi.mocked(evaluatePublishedScreener).mockResolvedValue(result("TRUE"));
    dispose = render(() => <Screener />, container);
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    expect(integration.fail).toHaveBeenCalledExactlyOnceWith(
      "ORIGIN_NOT_ALLOWED",
    );
    await until(() => expect(input("City")).toBeDefined());
    expect(container.textContent).toContain(
      "isn’t set up to send results to https://crm.example",
    );
    expect(evaluatePublishedScreener).not.toHaveBeenCalled();
    integration.disconnect!("timeout");
    await Promise.resolve();
    expect(container.textContent).toContain("isn’t set up");
  });

  it("offers the form unconnected when no host initializes it", async () => {
    vi.mocked(evaluatePublishedScreener).mockResolvedValue(result("TRUE"));
    dispose = render(() => <Screener />, container);
    await vi.waitFor(() => expect(integration.start).toHaveBeenCalledOnce());
    integration.disconnect!("timeout");
    await until(() => expect(input("City")).toBeDefined());
    expect(container.textContent).not.toContain("Waiting for information");
    expect(container.textContent).toContain("couldn’t connect");
    expect(evaluatePublishedScreener).not.toHaveBeenCalled();
  });

  it("keeps the form after the host closes the connection and says so", async () => {
    vi.mocked(evaluatePublishedScreener).mockResolvedValue(result("TRUE"));
    dispose = render(() => <Screener />, container);
    integration.initialize!(initialData);
    await vi.waitFor(() =>
      expect(evaluatePublishedScreener).toHaveBeenCalledOnce(),
    );
    integration.disconnect!("closed");
    await vi.waitFor(() =>
      expect(container.textContent).toContain("no longer connected"),
    );
    expect(input("City")).toBeDefined();
    expect(evaluatePublishedScreener).toHaveBeenCalledOnce();
  });

  it("keeps the standalone form available without waiting or initial evaluation", async () => {
    integration.enabled = false;
    vi.mocked(evaluatePublishedScreener).mockResolvedValue(result("TRUE"));
    dispose = render(() => <Screener />, container);
    await until(() => expect(input("City")).toBeDefined());
    expect(container.textContent).not.toContain("Waiting for information");
    expect(evaluatePublishedScreener).not.toHaveBeenCalled();
    answer("City", "Pittsburgh");
    await until(() => expect(container.textContent).toContain("Eligible"));
    expect(integration.result).not.toHaveBeenCalled();
  });
});
