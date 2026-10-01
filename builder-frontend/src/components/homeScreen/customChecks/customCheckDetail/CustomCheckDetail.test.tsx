// @vitest-environment jsdom

import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import CustomCheckDetail from "./CustomCheckDetail";

const resource = vi.hoisted(() => ({
  state: undefined as
    | undefined
    | {
        check: () => { id?: string; name?: string };
        loading: () => boolean;
        error: () => unknown;
      },
}));

vi.mock("./customCheckDetailResource", () => ({
  default: () => ({
    eligibilityCheck: () => resource.state!.check(),
    actions: {},
    actionInProgress: () => false,
    initialLoadStatus: {
      loading: () => resource.state!.loading(),
      error: () => resource.state!.error(),
    },
  }),
}));
vi.mock("./KogitoDmnEditorView", () => ({ default: () => null }));
vi.mock("./checkTesting/EligibilityCheckTest", () => ({ default: () => null }));
vi.mock("./PublishCheck", () => ({ default: () => null }));
vi.mock("./ParametersConfiguration", () => ({ default: () => null }));

describe("CustomCheckDetail", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function mount(url = "/custom-checks/example") {
    const [check, setCheck] = createSignal<{ id?: string; name?: string }>({});
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<unknown>();
    resource.state = { check, loading, error };

    const history = createMemoryHistory();
    history.set({ value: url, replace: true });
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <MemoryRouter history={history}>
          <Route path="/custom-checks/:checkId" component={CustomCheckDetail} />
        </MemoryRouter>
      ),
      container,
    );
    const currentCrumb = () =>
      container.querySelector(".breadcrumb-current")?.textContent;
    return { container, currentCrumb, setCheck, setLoading, setError };
  }

  it("shows the check name once loaded, even while refetching", () => {
    const { currentCrumb, setCheck, setLoading } = mount();
    expect(currentCrumb()).toBe("Loading check…");
    setCheck({ id: "example", name: "Income limit" });
    setLoading(false);
    expect(currentCrumb()).toBe("Income limit");
    setLoading(true);
    expect(currentCrumb()).toBe("Income limit");
  });

  it("stops showing the loading label when the check fails to load", () => {
    const { currentCrumb, setLoading, setError } = mount();
    setError(new Error("Not found"));
    setLoading(false);
    expect(currentCrumb()).toBe("Check unavailable");
  });

  it("opens the Publish section from the rename review link", () => {
    const { container } = mount("/custom-checks/example?tab=publish");
    expect(
      container
        .querySelector('[data-testid="editor-section-publish"]')
        ?.getAttribute("aria-current"),
    ).toBe("true");
  });
});
