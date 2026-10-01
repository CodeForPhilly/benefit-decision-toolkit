import { expect } from "@playwright/test";

import { exampleScreenerName, openEditorSection, settle } from "./session.mjs";

// Content of the bundled example screener that the user guide refers to
const phillyCash = "Philly Cash (fictional)";
const residenceQuestion = "Do you live in Philadelphia, Pennsylvania?";
const cashQuestion = "Would you like extra cash?";
const incomeQuestion = "What is your household’s total yearly income?";
const ownerQuestion = "Do you own and live in your home?";

const question = (page, label) =>
  page.locator(".fjs-form-field").filter({ hasText: label });
// The innermost element containing a heading, such as a page section
const section = (scope, heading) => {
  const page = typeof scope.page === "function" ? scope.page() : scope;
  return scope
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: heading }) })
    .last();
};

// "Only Philly Cash passes" from the example's suggested scenarios
async function answerOnlyPhillyCashScenario(page) {
  await question(page, residenceQuestion)
    .getByText("Yes", { exact: true })
    .click();
  await question(page, cashQuestion).getByText("Yes", { exact: true }).click();
  await question(page, incomeQuestion).locator("input").fill("30000");
  await question(page, ownerQuestion).getByText("No", { exact: true }).click();
  await settle(page);
  await expect(page.getByText("Eligible", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Ineligible", { exact: true })).toHaveCount(3);
}

export async function captureScreenerGuide({ page, save }) {
  await page.setViewportSize({ width: 1000, height: 560 });
  await save("screener-dashboard");

  await page.getByText(exampleScreenerName, { exact: true }).click();
  await expect(page.getByText(phillyCash, { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 640 });
  await save("manage-benefits");

  await page
    .locator("div.max-w-lg")
    .filter({ hasText: phillyCash })
    .getByTestId(/^edit-benefit-/)
    .click();
  await expect(page.getByTestId("add-check-person-min-age")).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 780 });
  await save("configure-benefit-1", {
    locator: page.locator("#eligibility-check-list"),
  });
  await save("configure-benefit-2", {
    locator: page.locator("#selected-eligibility-checks"),
  });
  await page.getByTestId("add-check-person-min-age").click();
  const modal = page.locator("div.fixed.inset-0 > div.bg-white");
  await modal.locator('input[type="text"]').fill("client");
  await modal.locator('input[type="number"]').fill("18");
  await save("configure-check", { locator: modal });
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();

  await openEditorSection(page, "formEditor");
  await page.setViewportSize({ width: 1100, height: 700 });
  await expect(page.getByText(cashQuestion, { exact: true })).toBeVisible();
  await save("form-editor-components");
  await page
    .locator(".fjs-element")
    .filter({ hasText: incomeQuestion })
    .last()
    .click();
  await page.getByText("General", { exact: true }).click();
  await expect(page.getByLabel("Key", { exact: true })).toHaveValue(
    "custom.householdIncome",
  );
  await save("form-editor-parameters");
  // Tall enough for the drawer to list every input without scrolling
  await page.setViewportSize({ width: 1100, height: 1500 });
  await page.getByText("Validate Form Outputs", { exact: true }).click();
  await expect(
    page.getByText("Satisfied Inputs", { exact: true }),
  ).toBeVisible();
  const drawer = page.locator("[data-corvu-drawer-content]");
  await save("form-validation", {
    from: drawer,
    to: [section(drawer, "Satisfied Inputs")],
  });
  await page.keyboard.press("Escape");

  await openEditorSection(page, "preview");
  await page.setViewportSize({ width: 1100, height: 720 });
  await answerOnlyPhillyCashScenario(page);
  // The answered questions; the rest of the form is hidden or explanatory
  await save("preview-inputs", {
    from: page.locator(".fjs-form"),
    to: [question(page, incomeQuestion)],
  });
  await save("preview-results", {
    locator: page.locator("#screener-input-data"),
  });

  await openEditorSection(page, "publish");
  await page.getByTestId("publish-screener-button").click();
  const publicLink = page.locator("#screener-url-info a[href]");
  await expect(publicLink).toBeVisible();
  await save("publish", { locator: page.locator("div.px-8.py-4") });

  await page.goto(await publicLink.getAttribute("href"));
  await page.setViewportSize({ width: 1100, height: 720 });
  await answerOnlyPhillyCashScenario(page);
  // The answered questions beside every benefit's result
  await save("published-screener", {
    from: page.locator("main"),
    to: [question(page, incomeQuestion), section(page, "Eligibility Results")],
  });
}
