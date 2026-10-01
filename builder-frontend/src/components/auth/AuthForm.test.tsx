// @vitest-environment jsdom

import { createMemoryHistory, MemoryRouter, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import AuthForm from "./AuthForm";

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => auth,
}));

describe("AuthForm", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  function mount(path: string) {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const history = createMemoryHistory();
    history.set({ value: path, replace: true });
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <MemoryRouter history={history}>
          <Route path="*" component={AuthForm} />
        </MemoryRouter>
      ),
      container,
    );
    return { container, history };
  }

  // Lets the sign-in promise and any resulting navigation finish.
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  function clickButton(container: HTMLElement, text: string) {
    const button = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    )!;
    button.click();
  }

  it.each([
    ["Sign In", "/login"],
    ["Sign Up", "/signup"],
  ])("continues to Screeners after %s on %s", async (buttonText, path) => {
    auth.login.mockResolvedValue(undefined);
    auth.register.mockResolvedValue(undefined);
    const { container, history } = mount("/custom-checks");
    history.set({ value: path });
    await vi.waitFor(() => expect(container.textContent).toContain(buttonText));
    clickButton(container, buttonText);
    await vi.waitFor(() => expect(history.get()).toBe("/screeners"));
    history.back();
    await vi.waitFor(() => expect(history.get()).toBe("/custom-checks"));
  });

  it("keeps a bookmarked detail URL after signing in", async () => {
    auth.login.mockResolvedValue(undefined);
    const bookmark = "/check/income-limit?source=bookmark#testing";
    const { container, history } = mount(bookmark);
    clickButton(container, "Sign In");
    await vi.waitFor(() => expect(auth.login).toHaveBeenCalled());
    await settle();
    expect(history.get()).toBe(bookmark);
  });

  it("keeps a bookmarked detail URL after Google sign-in", async () => {
    auth.loginWithGoogle.mockResolvedValue(undefined);
    const bookmark = "/screeners/example";
    const { container, history } = mount(bookmark);
    clickButton(container, "Google");
    await vi.waitFor(() => expect(auth.loginWithGoogle).toHaveBeenCalled());
    await settle();
    expect(history.get()).toBe(bookmark);
  });
});
