// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import Publish from "./Publish";
import { publishScreener } from "@/api/screener";
import { ApiError } from "@/api/check";

vi.mock("@solidjs/router", () => ({
  useParams: () => ({ screenerId: "screener-1" }),
}));
vi.mock("@/api/screener", () => ({ publishScreener: vi.fn() }));
vi.mock("@/components/shared/Tooltip", () => ({ default: () => null }));
vi.mock("./IntegrationOrigins", () => ({ default: () => null }));
let dispose: () => void;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
  vi.clearAllMocks();
});
function mount() {
  const refetch = vi.fn();
  const container = document.body.appendChild(document.createElement("div"));
  dispose = render(
    () => (
      <Publish
        screener={() => ({ screenerName: "Test" })}
        refetchScreener={refetch}
        setIntegrationOrigins={() => {}}
      />
    ),
    container,
  );
  const button = container.querySelector<HTMLButtonElement>(
    '[data-testid="publish-screener-button"]',
  )!;
  return { container, button, refetch };
}

it("shows the missing-form instruction and allows a successful retry", async () => {
  vi.mocked(publishScreener)
    .mockRejectedValueOnce(
      new ApiError("Save the form in Form Editor before publishing.", 400),
    )
    .mockResolvedValueOnce(undefined);
  const { container, button, refetch } = mount();
  expect(container.querySelector("#screener-url-info a[href]")).toBeNull();
  button.click();
  await vi.waitFor(() =>
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Save the form in Form Editor before publishing.",
    ),
  );
  expect(refetch).not.toHaveBeenCalled();
  expect(button.disabled).toBe(false);
  button.click();
  await vi.waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

it("prevents duplicate publishes and reports storage failures", async () => {
  let fail!: (error: Error) => void;
  vi.mocked(publishScreener).mockReturnValueOnce(
    new Promise((_resolve, reject) => {
      fail = reject;
    }),
  );
  const { container, button } = mount();
  button.click();
  button.click();
  expect(publishScreener).toHaveBeenCalledTimes(1);
  expect(button.disabled).toBe(true);
  fail(new Error("Network failed"));
  await vi.waitFor(() =>
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not publish",
    ),
  );
  expect(button.disabled).toBe(false);
});
