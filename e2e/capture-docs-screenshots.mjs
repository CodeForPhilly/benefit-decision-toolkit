import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const screenshotDirectory = path.join(
  repositoryRoot,
  "docs/src/assets/screenshots",
);
const baseUrl = process.env.BDT_FRONTEND_URL ?? "http://127.0.0.1:5173";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2086, height: 1532 } });

const saveScreenshot = async (name) => {
  await page.screenshot({
    path: path.join(screenshotDirectory, name),
    fullPage: true,
  });
};

try {
  await page.goto(baseUrl);
  await page
    .getByRole("button", { name: "Don't have an account? Sign Up" })
    .click();

  const email = `docs-${randomUUID()}@example.com`;
  const password = "local-docs-screenshot-account";
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByPlaceholder("Repeat Password").fill(password);
  await page.getByRole("button", { name: "Sign Up", exact: true }).click();

  const exampleScreener = page.getByText(
    "Example - Philly Property Tax Relief",
    {
      exact: true,
    },
  );
  await exampleScreener.waitFor();
  await saveScreenshot("screener-dashboard.png");

  await exampleScreener.click();
  await page.getByText("Add library benefit", { exact: true }).waitFor();
  await saveScreenshot("manage-benefits.png");

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish Screener" }).waitFor();
  await saveScreenshot("publish.png");

  await page.getByRole("button", { name: "Publish Screener" }).click();
  await page.waitForFunction(() =>
    document.querySelector("#screener-url-info a")?.getAttribute("href"),
  );
  const publishedUrl = await page
    .locator("#screener-url-info a")
    .getAttribute("href");
  await page.goto(new URL(publishedUrl, baseUrl).toString());
  await page.locator(".fjs-form").waitFor();
  await saveScreenshot("published-screener.png");
  await saveScreenshot("example-screener.png");

  await page.goto(`${baseUrl}/check`);
  await page.getByRole("button", { name: "Create New Check" }).waitFor();
  await saveScreenshot("custom-checks-list.png");

  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.getByRole("button", { name: "Parameter Configuration" }).waitFor();
  await saveScreenshot("custom-check-editor.png");
} finally {
  await browser.close();
}
