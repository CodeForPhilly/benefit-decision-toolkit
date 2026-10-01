// @vitest-environment jsdom
import { createResource, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomCheckWithDmn } from "@/types";
import { fetchCheck, getRelatedPublishedChecks } from "@/api/check";
import PublishCheck from "./PublishCheck";
import { loadPublication } from "./checkPublication";

vi.mock("@/api/check", () => ({
  fetchCheck: vi.fn(),
  getRelatedPublishedChecks: vi.fn(),
}));

const draft: CustomCheckWithDmn = {
  id: "W-check",
  name: "New name",
  module: "income",
  description: "Income limit",
  version: "1.0.0",
  parameterDefinitions: [],
  inputDefinition: {},
  dmnModel: "<definitions>new</definitions>",
};
const published = {
  ...draft,
  id: "P-check-1.0.0",
  name: "Old name",
  dmnModel: "<definitions>old</definitions>",
};

describe("PublishCheck", () => {
  let dispose: (() => void) | undefined;
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getRelatedPublishedChecks).mockResolvedValue([published]);
    vi.mocked(fetchCheck).mockResolvedValue(published);
  });
  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function mount(
    publishCheck = vi.fn().mockResolvedValue(undefined),
    saveDmnChanges = vi.fn().mockResolvedValue(undefined),
  ) {
    const container = document.body.appendChild(document.createElement("div"));
    const [check, setCheck] = createSignal(draft);
    const [unsavedDmn, setUnsavedDmn] = createSignal(false);
    dispose = render(() => {
      const [publication, { refetch }] = createResource(
        () => check().id,
        loadPublication,
      );
      return (
        <PublishCheck
          eligibilityCheck={check}
          publishCheck={publishCheck}
          hasUnsavedDmnChanges={unsavedDmn}
          saveDmnChanges={saveDmnChanges}
          publication={publication}
          refetchPublication={refetch}
        />
      );
    }, container);
    const button = () =>
      [...container.querySelectorAll("button")].find((button) =>
        /Publish Check|Publishing/.test(button.textContent || ""),
      )!;
    return { container, button, setCheck, setUnsavedDmn };
  }

  it("explains an unpublished rename and preserves the published name", async () => {
    const { container, button } = mount();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Unpublished changes"),
    );
    expect(container.textContent).toContain(
      "Latest published version: Old name — 1.0.0",
    );
    expect(container.textContent).toContain(
      "Existing benefits keep the version they already use",
    );
    expect(button().disabled).toBe(false);
  });

  it("shows that a new draft needs its first publication", async () => {
    vi.mocked(getRelatedPublishedChecks).mockResolvedValue([]);
    const { container, button } = mount();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Not yet published"),
    );
    expect(container.textContent).toContain("No published versions yet");
    expect(fetchCheck).not.toHaveBeenCalled();
    expect(button().disabled).toBe(false);
  });

  it("disables publishing when all saved fields already match, then enables it for edits", async () => {
    vi.mocked(fetchCheck).mockResolvedValue({ ...draft, id: published.id });
    const { container, button, setCheck } = mount();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("All saved changes published"),
    );
    expect(button().disabled).toBe(true);
    setCheck({
      ...draft,
      parameterDefinitions: [
        { key: "limit", label: "Limit", type: "number", required: true },
      ],
    });
    expect(container.textContent).toContain("Unpublished changes");
    expect(button().disabled).toBe(false);
  });

  it("warns about unsaved DMN edits and offers to save them", async () => {
    vi.mocked(fetchCheck).mockResolvedValue({ ...draft, id: published.id });
    const saveDmnChanges = vi.fn().mockResolvedValue(undefined);
    const { container, setUnsavedDmn } = mount(undefined, saveDmnChanges);
    await vi.waitFor(() =>
      expect(container.textContent).toContain("All saved changes published"),
    );
    expect(container.textContent).not.toContain("Unsaved DMN edits");
    setUnsavedDmn(true);
    expect(container.textContent).toContain("Unsaved DMN edits");
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Save DMN edits")!
      .click();
    expect(saveDmnChanges).toHaveBeenCalledOnce();
  });

  it("publishes once, refreshes versions immediately, and shows success", async () => {
    let finish!: () => void;
    const publishCheck = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { container, button } = mount(publishCheck);
    await vi.waitFor(() => expect(button().disabled).toBe(false));
    button().click();
    expect(button().disabled).toBe(true);
    button().click();
    expect(publishCheck).toHaveBeenCalledExactlyOnceWith("W-check");
    const newVersion = { ...draft, id: "P-check-2.0.0", version: "2.0.0" };
    vi.mocked(getRelatedPublishedChecks).mockResolvedValue([
      published,
      newVersion,
    ]);
    vi.mocked(fetchCheck).mockResolvedValue(newVersion);
    finish();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("All saved changes published"),
    );
    expect(container.textContent).toContain("Check published.");
    expect(container.textContent).toContain(
      "Latest published version: New name — 2.0.0",
    );
    expect(getRelatedPublishedChecks).toHaveBeenCalledTimes(2);
    expect(button().disabled).toBe(true);
  });

  it("shows publication failures and allows retry without claiming success", async () => {
    const publishCheck = vi
      .fn()
      .mockRejectedValue(new Error("Failed to extract input schema"));
    const { container, button } = mount(publishCheck);
    await vi.waitFor(() => expect(button().disabled).toBe(false));
    button().click();
    await vi.waitFor(() =>
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Failed to extract input schema",
      ),
    );
    expect(container.textContent).not.toContain("Check published.");
    expect(getRelatedPublishedChecks).toHaveBeenCalledTimes(1);
    expect(button().disabled).toBe(false);
  });

  it("reports a status load failure and recovers with Retry", async () => {
    vi.mocked(getRelatedPublishedChecks).mockRejectedValueOnce(
      new Error("Offline"),
    );
    const { container, button } = mount();
    await vi.waitFor(() =>
      expect(container.textContent).toContain(
        "Could not load publication status",
      ),
    );
    expect(container.textContent).not.toContain("Not yet published");
    expect(button().disabled).toBe(true);
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Retry")!
      .click();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Unpublished changes"),
    );
    expect(button().disabled).toBe(false);
  });
});
