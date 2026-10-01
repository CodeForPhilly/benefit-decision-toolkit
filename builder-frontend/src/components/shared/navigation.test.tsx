// @vitest-environment jsdom

import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import Header from "../Header/Header";
import Breadcrumbs from "./Breadcrumbs";
import EditorNavigation from "./EditorNavigation";
import AreaRedirect from "./AreaRedirect";

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
          <Route
            path="/"
            component={() => <AreaRedirect from="/" to="/screeners" />}
          />
          <Route
            path={["/projects", "/projects/:id"]}
            component={() => <AreaRedirect from="/projects" to="/screeners" />}
          />
          <Route
            path={["/check", "/check/:id"]}
            component={() => <AreaRedirect from="/check" to="/custom-checks" />}
          />
          <Route path="/screeners" component={() => <div>Screener list</div>} />
          <Route
            path="/custom-checks"
            component={() => <div>Check list</div>}
          />
          <Route
            path="/screeners/:id"
            component={() => (
              <EditorNavigation
                items={[
                  { label: "Screeners", href: "/screeners" },
                  { label: "My screener" },
                ]}
              />
            )}
          />
          <Route
            path="/custom-checks/:id"
            component={() => (
              <EditorNavigation
                items={[
                  { label: "Custom Checks", href: "/custom-checks" },
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

  it.each(["/", "/screeners", "/screeners/example"])(
    "highlights the Screeners area at %s",
    async (path) => {
      const { container } = mount(path);
      await vi.waitFor(() =>
        expect(
          container.querySelector('nav[aria-label="Main navigation"] a.active')
            ?.textContent,
        ).toBe("Screeners"),
      );
      expect(
        container.querySelectorAll(
          'nav[aria-label="Main navigation"] a.active',
        ),
      ).toHaveLength(1);
    },
  );

  it.each(["/", "/screeners"])(
    "marks the Screeners link as the current page at %s",
    async (path) => {
      const { container } = mount(path);
      await vi.waitFor(() =>
        expect(
          container.querySelector(
            'nav[aria-label="Main navigation"] a[aria-current="page"]',
          )?.textContent,
        ).toBe("Screeners"),
      );
    },
  );

  it("marks only the open screener as the current page in its editor", () => {
    const { container } = mount("/screeners/example");
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe("My screener");
  });

  it.each([
    ["/", "/screeners"],
    ["/?source=bookmark#list", "/screeners?source=bookmark#list"],
    ["/projects", "/screeners"],
    ["/projects/", "/screeners/"],
    [
      "/projects/example?source=bookmark#form",
      "/screeners/example?source=bookmark#form",
    ],
    ["/check", "/custom-checks"],
    ["/check/", "/custom-checks/"],
    [
      "/check/income%20limit?source=bookmark#testing",
      "/custom-checks/income%20limit?source=bookmark#testing",
    ],
  ])("redirects %s to %s", async (oldUrl, newUrl) => {
    const { history } = mount(oldUrl);
    await vi.waitFor(() => expect(history.get()).toBe(newUrl));
    history.back();
    expect(history.get()).toBe(newUrl);
  });

  it("replaces the legacy URL rather than adding an extra history entry", async () => {
    const { history } = mount("/custom-checks");
    history.set({ value: "/projects/example" });
    await vi.waitFor(() => expect(history.get()).toBe("/screeners/example"));
    history.back();
    await vi.waitFor(() => expect(history.get()).toBe("/custom-checks"));
    history.forward();
    await vi.waitFor(() => expect(history.get()).toBe("/screeners/example"));
  });

  it("moves between areas and follows browser back and forward", async () => {
    const { container, history } = mount("/screeners/example");
    (
      container.querySelector('a[href="/custom-checks"]') as HTMLAnchorElement
    ).click();
    const activeArea = () =>
      container.querySelector('nav[aria-label="Main navigation"] a.active')
        ?.textContent;
    await vi.waitFor(() => expect(history.get()).toBe("/custom-checks"));
    expect(activeArea()).toBe("Custom Checks");
    history.back();
    await vi.waitFor(() => expect(activeArea()).toBe("Screeners"));
    history.forward();
    await vi.waitFor(() => expect(activeArea()).toBe("Custom Checks"));
  });

  it("keeps both areas visible while the account menu is closed", () => {
    const { container } = mount("/custom-checks/example");
    const navigation = container.querySelector(
      'nav[aria-label="Main navigation"]',
    )!;
    expect(navigation.querySelector('a[href="/screeners"]')?.textContent).toBe(
      "Screeners",
    );
    expect(
      navigation.querySelector('a[href="/custom-checks"]')?.textContent,
    ).toBe("Custom Checks");
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
    ["/screeners/example", "/screeners", "My screener"],
    ["/custom-checks/example", "/custom-checks", "My check"],
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

  it("returns from benefit configuration without leaving the screener", () => {
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(() => {
      const [configuring, setConfiguring] = createSignal(true);
      return (
        <Breadcrumbs
          label="Benefit configuration"
          current="true"
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
    expect(
      container.querySelector('nav[aria-label="Benefit configuration"]'),
    ).not.toBeNull();
    expect(container.querySelector('[aria-current="page"]')).toBeNull();
    expect(container.querySelector('[aria-current="true"]')?.textContent).toBe(
      "My benefit",
    );
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
          items={[{ label: "My screener" }]}
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
        '[data-testid="editor-section-preview"]',
      ) as HTMLButtonElement
    ).click();
    expect(
      container.querySelector(
        'nav[aria-label="Editor sections"] [aria-current="true"]',
      )?.textContent,
    ).toBe("Preview");
    expect(
      container.querySelector(".breadcrumb-current")?.getAttribute("title"),
    ).toBe("My screener");
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});
