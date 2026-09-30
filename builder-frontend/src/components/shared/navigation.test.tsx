// @vitest-environment jsdom

import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import Header from "../Header/Header";
import Breadcrumbs from "./Breadcrumbs";
import EditorNavigation from "./EditorNavigation";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: () => ({ email: "editor@example.test", displayName: "Editor" }),
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/Header/ExportExampleScreener", () => ({
  ExportExampleScreener: () => <div>Example export</div>,
}));

describe("app navigation", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  function mount(path: string) {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const history = createMemoryHistory();
    history.set({ value: path, replace: true });
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <MemoryRouter
          history={history}
          root={(props) => (
            <>
              <Header />
              {props.children}
            </>
          )}
        >
          <Route path="/" component={() => <div>Project list</div>} />
          <Route path="/projects" component={() => <div>Project list</div>} />
          <Route path="/check" component={() => <div>Check list</div>} />
          <Route
            path="/projects/:id"
            component={() => (
              <EditorNavigation
                items={[
                  { label: "Projects", href: "/projects" },
                  { label: "My project" },
                ]}
              />
            )}
          />
          <Route
            path="/check/:id"
            component={() => (
              <EditorNavigation
                items={[
                  { label: "Eligibility checks", href: "/check" },
                  { label: "My check" },
                ]}
              />
            )}
          />
        </MemoryRouter>
      ),
      container,
    );
    return { container, history };
  }

  it.each(["/", "/projects", "/projects/example"])(
    "marks Projects as current at %s",
    (path) => {
      const { container } = mount(path);
      const active = container.querySelector(
        'nav[aria-label="Main navigation"] a[aria-current="page"]',
      );
      expect(active?.textContent).toBe("Projects");
      expect(active?.classList.contains("active")).toBe(true);
    },
  );

  it("moves between areas and follows browser back and forward", async () => {
    const { container, history } = mount("/projects/example");
    (container.querySelector('a[href="/check"]') as HTMLAnchorElement).click();
    await vi.waitFor(() => expect(history.get()).toBe("/check"));
    expect(container.querySelector('a[aria-current="page"]')?.textContent).toBe(
      "Eligibility checks",
    );
    history.back();
    await vi.waitFor(() =>
      expect(
        container.querySelector('a[aria-current="page"]')?.textContent,
      ).toBe("Projects"),
    );
    history.forward();
    await vi.waitFor(() =>
      expect(
        container.querySelector('a[aria-current="page"]')?.textContent,
      ).toBe("Eligibility checks"),
    );
  });

  it("keeps both areas visible while the account menu is closed", () => {
    const { container } = mount("/check/example");
    const navigation = container.querySelector(
      'nav[aria-label="Main navigation"]',
    )!;
    expect(navigation.querySelector('a[href="/projects"]')?.textContent).toBe(
      "Projects",
    );
    expect(navigation.querySelector('a[href="/check"]')?.textContent).toBe(
      "Eligibility checks",
    );
    const toggle = container.querySelector(
      'button[aria-label="Account menu"]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(
      container.querySelector('a[href="https://bdt-docs.web.app/"]')
        ?.textContent,
    ).toBe("User Guide");
    (
      container.querySelector(
        'button[aria-label="Close account menu"]',
      ) as HTMLButtonElement
    ).click();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it.each([
    ["/projects/example", "/projects", "My project"],
    ["/check/example", "/check", "My check"],
  ])(
    "returns a directly opened detail page %s to its own list",
    async (path, parent, name) => {
      const { container, history } = mount(path);
      const breadcrumbs = container.querySelector(
        'nav[aria-label="Breadcrumb"]',
      )!;
      expect(
        breadcrumbs.querySelector('[aria-current="page"]')?.textContent,
      ).toBe(name);
      expect(breadcrumbs.querySelector('[aria-current="page"]')?.tagName).toBe(
        "SPAN",
      );
      (breadcrumbs.querySelector("a") as HTMLAnchorElement).click();
      await vi.waitFor(() => expect(history.get()).toBe(parent));
    },
  );

  it("returns from benefit configuration without leaving the project", () => {
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(() => {
      const [configuring, setConfiguring] = createSignal(true);
      return (
        <Breadcrumbs
          items={
            configuring()
              ? [
                  {
                    label: "Manage Benefits",
                    onClick: () => setConfiguring(false),
                  },
                  { label: "My benefit" },
                ]
              : [{ label: "Manage Benefits" }]
          }
        />
      );
    }, container);
    (container.querySelector("button") as HTMLButtonElement).click();
    expect(container.textContent).toBe("Manage Benefits");
    expect(container.querySelector("button")).toBeNull();
  });

  it("updates the current editor section when selected", () => {
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(() => {
      const [active, setActive] = createSignal("edit");
      return (
        <EditorNavigation
          items={[{ label: "My project" }]}
          navProps={() => ({
            activeTabKey: active,
            tabDefs: [
              { key: "edit", label: "Edit", onClick: () => setActive("edit") },
              {
                key: "preview",
                label: "Preview",
                onClick: () => setActive("preview"),
              },
            ],
          })}
        />
      );
    }, container);
    (
      container.querySelector(
        '[data-testid="project-tab-preview"]',
      ) as HTMLButtonElement
    ).click();
    expect(
      container.querySelector(
        'nav[aria-label="Editor sections"] [aria-current="page"]',
      )?.textContent,
    ).toBe("Preview");
    expect(
      container.querySelector(".breadcrumb-current")?.getAttribute("title"),
    ).toBe("My project");
  });
});
