import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Dedicated local-only account; never imports or modifies another user's checks.
const email = `docs-checks-${randomUUID()}@example.com`;
const password = "local-docs-screenshot-account";
const accountResponse = await fetch(
  "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-demo",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
if (!accountResponse.ok) throw new Error(await accountResponse.text());
const account = await accountResponse.json();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1100, height: 650 },
  deviceScaleFactor: 2,
});
page.setDefaultTimeout(30000);
const save = async (name, locator = page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await locator.screenshot({
    path: fileURLToPath(
      new URL(`../docs/src/assets/screenshots/${name}.png`, import.meta.url),
    ),
    animations: "disabled",
  });
  console.log(`Saved ${name}`);
};
try {
  await page.goto("http://localhost:5173");
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByTestId("create-new-screener-button")).toBeVisible();
  await page.goto("http://localhost:5173/check");
  await page
    .getByRole("button", { name: "Create New Check", exact: true })
    .click();
  await page.locator("#checkName").fill("household-income-limit");
  await page.locator("#checkModule").fill("community-support");
  await page
    .locator("#checkDescription")
    .fill("Compare annual income with a program limit.");
  await save("custom-check-create", page.locator("[data-modal-root] > div"));
  await page.getByRole("button", { name: "Add Check", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByText("Create New Parameter", { exact: true }).click();
  await page.locator("#parameterKey").fill("incomeLimit");
  await page
    .locator("#parameterLabel")
    .fill("Annual household income limit ($)");
  await page.locator("#parameterType").selectOption("number");
  await page.getByLabel("True", { exact: true }).check();
  const parameterModal = page.locator("div.fixed.inset-0 > div.bg-white");
  await save("custom-check-parameter", parameterModal);
  await parameterModal
    .getByRole("button", { name: "Add Parameter", exact: true })
    .click();
  await expect(page.getByText("incomeLimit", { exact: true })).toBeVisible();
  const checkUrl = page.url();
  const checkId = checkUrl.split("/").at(-1);
  const dmnModel = await readFile(
    new URL("./fixtures/docs-income-limit.dmn", import.meta.url),
    "utf8",
  );
  const saved = await fetch(
    `http://localhost:8081/api/custom-checks/${checkId}/dmn`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${account.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dmnModel }),
    },
  );
  if (!saved.ok) throw new Error(await saved.text());
  await page.reload();
  await page
    .getByRole("button", { name: "DMN Definition", exact: true })
    .click();
  await page.setViewportSize({ width: 1000, height: 820 });
  await page.waitForTimeout(4000);
  await save("custom-check-dmn");
  await page.getByText("Validate Current DMN", { exact: true }).click();
  await expect(
    page.getByText("No validation errors found in DMN model.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No validation errors found in DMN model.", { exact: true }),
  ).toBeHidden({ timeout: 15000 });
  await page.getByRole("button", { name: "Testing", exact: true }).click();
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.getByTestId("selected-check-household-income-limit").click();
  const testModal = page.locator("div.fixed.inset-0 > div.bg-white");
  await testModal.locator('input[type="number"]').fill("35000");
  await save("custom-check-test-parameter", testModal);
  await testModal.getByRole("button", { name: "Confirm", exact: true }).click();
  const editor = page.locator(".cm-content[contenteditable=true]");
  await editor.fill('{"householdIncome": 28000}');
  await page.waitForTimeout(750); // JSON editor debounces valid-content updates.
  await page.getByText("Run Test", { exact: true }).click();
  await expect(page.getByText("Eligible", { exact: true })).toBeVisible();
  await save("custom-check-test-eligible");
  await editor.fill('{"householdIncome": 42000}');
  await page.waitForTimeout(750);
  await page.getByText("Run Test", { exact: true }).click();
  await expect(page.getByText("Ineligible", { exact: true })).toBeVisible();
  await save("custom-check-test-ineligible");
  for (const [input, expected] of [
    ['{"householdIncome":35000}', "Eligible"],
    ['{"householdIncome":null}', "Need more information"],
  ]) {
    await editor.fill(input);
    await page.waitForTimeout(750);
    await page.getByText("Run Test", { exact: true }).click();
    await expect(page.getByText(expected, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByText("Publish Check", { exact: true }).click();
  // Reopen the tab to load the newly published versions.
  await page.getByRole("button", { name: "Testing", exact: true }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByText("household-income-limit - 1.0.0", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 540 });
  await save("custom-check-publish");
  console.log(`Demo account: ${email}`);
} finally {
  await browser.close();
}
