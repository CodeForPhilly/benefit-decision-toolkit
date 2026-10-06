// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { navigate, importScreener } = vi.hoisted(() => ({
  navigate: vi.fn(),
  importScreener: vi.fn(),
}));
vi.mock("@solidjs/router", () => ({ useNavigate: () => navigate }));
vi.mock("@/api/screenerTransfer", () => ({ importScreener }));
import ImportScreenerForm from "./ImportScreenerForm";

let dispose: () => void;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  dispose = render(() => <ImportScreenerForm />, container);
});
afterEach(() => {
  dispose();
  container.remove();
  vi.restoreAllMocks();
});

function chooseFile() {
  const input =
    container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["{}"], "example.bdt.json", {
    type: "application/json",
  });
  Object.defineProperty(input, "files", { value: [file] });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return file;
}
function submit() {
  container
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

it("requires a file and opens the imported screener", async () => {
  expect(
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!
      .disabled,
  ).toBe(true);
  const file = chooseFile();
  importScreener.mockResolvedValue({ id: "new-screener" });
  submit();
  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith("/screeners/new-screener"),
  );
  expect(importScreener).toHaveBeenCalledWith(file);
});

it("shows a failure and allows retrying the same file", async () => {
  chooseFile();
  importScreener.mockRejectedValue(new Error("Missing DMN model"));
  submit();
  await vi.waitFor(() =>
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Missing DMN model",
    ),
  );
  expect(
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!
      .disabled,
  ).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
  importScreener.mockResolvedValue({ id: "retry-screener" });
  submit();
  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith("/screeners/retry-screener"),
  );
});

it("opens the file picker from a visible button and displays the chosen filename", () => {
  const input =
    container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const click = vi.spyOn(input, "click");
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="button"]',
  )!;
  expect(button.textContent).toBe("Choose file");
  expect(button.disabled).toBe(false);
  button.click();
  expect(click).toHaveBeenCalledOnce();
  const file = chooseFile();
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
    file.name,
  );
});
