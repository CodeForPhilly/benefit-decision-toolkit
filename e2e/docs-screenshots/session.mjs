import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Intentionally fixed to the local demo emulators: never touch a real account.
export const baseUrl = "http://localhost:5173";
const apiUrl = "http://localhost:8081/api";
const authEmulator =
  "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-demo";
const password = "local-docs-screenshot-account";
const screenshotDirectory = fileURLToPath(
  new URL("../../docs/src/assets/screenshots/", import.meta.url),
);

export const exampleScreenerName = "Philadelphia Benefits Example";

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`${url}: ${response.status} ${await response.text()}`);
  return response.json();
}

/* A fresh local account that receives the bundled example screener through
   the same account hook the app runs when someone signs up. */
async function createAccount() {
  const email = `docs-${randomUUID()}@example.com`;
  const account = await jsonRequest(authEmulator, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const hooks = await jsonRequest(`${apiUrl}/account/hooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ hooks: ["add example screener"] }),
  });
  if (!hooks.success)
    throw new Error(`Example screener import failed: ${JSON.stringify(hooks)}`);
  return email;
}

// The bounding box once an element has stopped moving, such as a sliding drawer
export async function settledBox(locator, timeout = 10000) {
  await locator.waitFor({ state: "visible" });
  const deadline = Date.now() + timeout;
  let previous = await locator.boundingBox();
  while (Date.now() < deadline) {
    await locator.page().waitForTimeout(100);
    const box = await locator.boundingBox();
    if (box && JSON.stringify(box) === JSON.stringify(previous)) return box;
    previous = box;
  }
  throw new Error(`${locator} did not stop moving within ${timeout}ms`);
}

export async function openSession() {
  const email = await createAccount();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 720 },
    deviceScaleFactor: 2,
  });
  page.setDefaultTimeout(30000);

  await page.goto(baseUrl);
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByText(exampleScreenerName, { exact: true }),
  ).toBeVisible();

  /* Saves the page, one element (`locator`), or the region from the top of
     one element down to the bottom of the lowest of several (`from`, `to`) */
  const save = async (name, target = {}) => {
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    const options = {
      path: `${screenshotDirectory}${name}.png`,
      animations: "disabled",
    };
    if (target.locator) {
      await target.locator.screenshot(options);
      return console.log(`Saved ${name}.png`);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (target.from) {
      const from = await settledBox(target.from);
      const bottoms = await Promise.all(
        target.to.map(async (locator) => {
          await locator.waitFor({ state: "visible" });
          const box = await locator.boundingBox();
          if (!box) throw new Error(`${locator} has no bounding box`);
          return box.y + box.height;
        }),
      );
      options.fullPage = true;
      options.clip = {
        x: from.x,
        y: from.y,
        width: from.width,
        height: Math.max(...bottoms) + 16 - from.y,
      };
    }
    await page.screenshot(options);
    console.log(`Saved ${name}.png`);
  };

  return {
    page,
    save,
    email,
    close: () => browser.close(),
  };
}

export const openEditorSection = (page, key) =>
  page.getByTestId(`editor-section-${key}`).click();

// Waits for typing in a debounced editor to be applied
export const settle = (page) => page.waitForTimeout(750);
