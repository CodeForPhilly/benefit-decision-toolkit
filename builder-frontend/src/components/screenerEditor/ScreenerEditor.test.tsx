// @vitest-environment jsdom

import { MetaProvider } from "@solidjs/meta";
import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import ScreenerEditor from "./ScreenerEditor";

vi.mock("@/api/screener", () => ({
  fetchScreener: vi.fn(async () => ({
    screenerName: "My screener",
    formSchema: {},
  })),
}));
vi.mock("./manageBenefits/benefitList/BenefitList", () => ({
  default: (props: { setBenefitIdToConfigure: (id: string) => void }) => (
    <button
      type="button"
      onClick={() => props.setBenefitIdToConfigure("benefit-1")}
    >
      Configure benefit-1
    </button>
  ),
}));
vi.mock("./manageBenefits/configureBenefit/ConfigureBenefit", () => ({
  default: (props: { benefitId: () => string }) => (
    <div>Configuring {props.benefitId()}</div>
  ),
}));
vi.mock("./FormEditorView", () => ({ default: () => <div>Form editor</div> }));
vi.mock("./preview/Preview", () => ({ default: () => <div>Preview</div> }));
vi.mock("./Publish", () => ({ default: () => <div>Publish</div> }));

describe("ScreenerEditor", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  it("returns from Configure Benefit when Manage Benefits is selected", async () => {
    const history = createMemoryHistory();
    history.set({ value: "/screeners/example", replace: true });
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <MetaProvider>
          <MemoryRouter history={history}>
            <Route path="/screeners/:screenerId" component={ScreenerEditor} />
          </MemoryRouter>
        </MetaProvider>
      ),
      container,
    );
    const button = (text: string) =>
      [...container.querySelectorAll("button")].find(
        (b) => b.textContent === text,
      ) as HTMLButtonElement;

    await vi.waitFor(() => expect(button("Configure benefit-1")).toBeDefined());
    button("Configure benefit-1").click();
    expect(container.textContent).toContain("Configuring benefit-1");

    button("Manage Benefits").click();
    expect(container.textContent).not.toContain("Configuring benefit-1");
    expect(button("Configure benefit-1")).toBeDefined();
  });
});
