import { expect } from "@playwright/test";

import { baseUrl, openEditorSection, settle } from "./session.mjs";

// The example screener's custom check that the custom checks guide walks through
const incomeCheck = "Household income limit";
const incomeLimit = "40000";

async function runTest(page, input, expected) {
  await page.locator(".cm-content[contenteditable=true]").fill(input);
  await settle(page);
  await page.getByText("Run Test", { exact: true }).click();
  await expect(page.getByText(expected, { exact: true })).toBeVisible();
}

export async function captureCustomChecksGuide({ page, save }) {
  await page.goto(`${baseUrl}/custom-checks`);
  await page.setViewportSize({ width: 1100, height: 480 });
  await expect(page.getByText(incomeCheck, { exact: true })).toBeVisible();
  await save("custom-checks-list");

  // Shows the create dialog without creating a check, so the account keeps
  // only the example's checks
  await page
    .getByRole("button", { name: "Create New Check", exact: true })
    .click();
  await page.locator("#checkName").fill("Minimum household size");
  await page.locator("#checkModule").fill("Philadelphia examples");
  await page
    .locator("#checkDescription")
    .fill("Passes when a household has enough people for a program.");
  await save("custom-check-create", {
    locator: page.locator("[data-modal-root] > div"),
  });
  // Clicking the backdrop closes the dialog and can never submit it
  await page.locator("[data-modal-root]").click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#checkName")).toBeHidden();

  await page
    .locator("div.max-w-lg")
    .filter({ hasText: incomeCheck })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await expect(page.getByText("incomeLimit", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 560 });
  await save("custom-check-editor");
  await page.getByText("incomeLimit", { exact: true }).click();
  const parameterModal = page.locator("div.fixed.inset-0 > div.bg-white");
  await expect(page.locator("#parameterKey")).toHaveValue("incomeLimit");
  await save("custom-check-parameter", { locator: parameterModal });
  await parameterModal.getByRole("button", { name: "Cancel" }).click();

  await openEditorSection(page, "dmnDefinition");
  await page.setViewportSize({ width: 1100, height: 820 });
  await page.waitForTimeout(4000); // The DMN editor renders in an iframe
  await save("custom-check-dmn");
  await page.getByText("Validate Current DMN", { exact: true }).click();
  await expect(
    page.getByText("No validation errors found in DMN model.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No validation errors found in DMN model.", { exact: true }),
  ).toBeHidden();

  await openEditorSection(page, "testing");
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.getByTestId(`selected-check-${incomeCheck}`).click();
  const testModal = page.locator("div.fixed.inset-0 > div.bg-white");
  await testModal.locator('input[type="number"]').fill(incomeLimit);
  await save("custom-check-test-parameter", { locator: testModal });
  await testModal.getByRole("button", { name: "Confirm", exact: true }).click();
  await runTest(page, '{"householdIncome": 30000}', "Eligible");
  await save("custom-check-test-eligible");
  await runTest(page, '{"householdIncome": 50000}', "Ineligible");
  await save("custom-check-test-ineligible");
  // The guide also describes the boundary and an unanswered income
  await runTest(page, `{"householdIncome": ${incomeLimit}}`, "Eligible");
  await runTest(page, '{"householdIncome": null}', "Need more information");

  await openEditorSection(page, "publish");
  await expect(
    page.getByText(`${incomeCheck} - 1.0.0`, { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 540 });
  await save("custom-check-publish");
}
