// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { navigate, importScreener, readScreenerFile } = vi.hoisted(() => ({
  navigate: vi.fn(),
  importScreener: vi.fn(),
  readScreenerFile: vi.fn(),
}));
vi.mock("@solidjs/router", () => ({ useNavigate: () => navigate }));
vi.mock("@/api/screenerTransfer", () => ({ importScreener, readScreenerFile }));
import ImportScreenerForm from "./ImportScreenerForm";

let dispose: () => void;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  readScreenerFile.mockResolvedValue({ screenerName: "Example" });
  container = document.createElement("div");
  document.body.appendChild(container);
  dispose = render(() => <ImportScreenerForm />, container);
});
afterEach(() => {
  dispose();
  container.remove();
  vi.restoreAllMocks();
});

async function chooseFile() {
  const input =
    container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["{}"], "example.bdt.json", {
    type: "application/json",
  });
  Object.defineProperty(input, "files", { value: [file] });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await vi.waitFor(() =>
    expect(
      container.querySelector<HTMLInputElement>('input[name="screenerName"]')
        ?.value,
    ).toBe("Example"),
  );
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
  const file = await chooseFile();
  importScreener.mockResolvedValue({ id: "new-screener" });
  submit();
  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith("/screeners/new-screener"),
  );
  expect(importScreener).toHaveBeenCalledWith(file, "Example");
});

it("shows a failure and allows retrying the same file", async () => {
  await chooseFile();
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

it("opens the file picker from a visible button and displays the chosen filename", async () => {
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
  const file = await chooseFile();
  expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
    file.name,
  );
});

it("requires a different name on collision, treating case and spaces alike", async () => {
  dispose();
  dispose = render(
    () => <ImportScreenerForm existingNames={[" example "]} />,
    container,
  );
  await chooseFile();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    "Choose a different name",
  );
  expect(
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!
      .disabled,
  ).toBe(true);
  submit();
  expect(importScreener).not.toHaveBeenCalled();
  const input = container.querySelector<HTMLInputElement>(
    'input[name="screenerName"]',
  )!;
  input.value = "Example - Copy";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  importScreener.mockResolvedValue({ id: "copy" });
  submit();
  await vi.waitFor(() =>
    expect(navigate).toHaveBeenCalledWith("/screeners/copy"),
  );
  expect(importScreener).toHaveBeenCalledWith(
    expect.any(File),
    "Example - Copy",
  );
});
