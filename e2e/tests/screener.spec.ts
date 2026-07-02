import { test, expect, Page } from "@playwright/test";

import { authLogin } from "./authLogin";
import {
  resetEmulator,
  seedScreener,
  seedScreenerWithBenefit,
  seedScreenerWithConfiguredBenefit,
  seedScreenerWithForm,
  TEST_SCREENER_ID,
  TEST_BENEFIT_ID,
} from "./firestore";

// ============================================================
// Reusable Step Functions
// ============================================================

const createScreenerViaUI = async (page: Page, name = "Test Screener") => {
  await test.step("Create screener via UI", async () => {
    await page.getByTestId("create-new-screener-button").click();
    await page.locator("#screenerName").fill(name);
    await page.getByTestId("submit-new-screener-button").click();
  });
};

const createBenefitViaUI = async (
  page: Page,
  name = "Test Benefit",
  description = "Description",
) => {
  await test.step("Create benefit via UI", async () => {
    await page.getByTestId("create-new-benefit-button").click();
    await page.locator("#new-benefit-name").fill(name);
    await page.locator("#new-benefit-description").fill(description);
    await page.getByTestId("submit-new-benefit-button").click();
  });
};

const addOwnerOccupantCheck = async (page: Page) => {
  await test.step("Add owner-occupant check", async () => {
    const checkRowLocator = page.getByTestId("add-check-owner-occupant");
    await checkRowLocator.waitFor({ state: "visible" });
    await checkRowLocator.click();
  });
};

const navigateToBenefitConfig = async (page: Page) => {
  await test.step("Navigate to benefit configuration", async () => {
    await page.getByTestId("edit-benefit-test-benefit-id").click();
  });
};

const navigateToFormEditor = async (page: Page) => {
  await test.step("Navigate to form editor", async () => {
    await page.getByTestId("project-tab-formEditor").click();
  });
};

const createFormWithCheckbox = async (page: Page) => {
  await test.step("Create form with checkbox", async () => {
    const checkboxComponentLoc = page.locator(
      '[data-field-type="checkbox"]:has(span:has-text("Checkbox"))',
    );
    await checkboxComponentLoc.waitFor({ state: "visible" });
    await checkboxComponentLoc.dragTo(
      page.locator('[data-id="BDT Form"].fjs-drop-container-vertical'),
    );

    await page
      .locator('[data-title="General"].bio-properties-panel-group-header-title')
      .click();
    await page.getByLabel("Key").selectOption("simpleChecks.ownerOccupant");
    await page.getByLabel("Field label").fill("Is owner occupant?");

    await page.getByTestId("form-editor-save-button").click();
  });
};

const navigateToPreview = async (page: Page) => {
  await test.step("Navigate to preview", async () => {
    await page.getByTestId("project-tab-preview").click();
  });
};

const navigateToPublish = async (page: Page) => {
  await test.step("Navigate to publish", async () => {
    await page.getByTestId("project-tab-publish").click();
  });
};

const publishScreener = async (page: Page) => {
  await test.step("Publish screener", async () => {
    await page.getByTestId("publish-screener-button").click();
  });
};

// ============================================================
// Tests
// ============================================================

test.describe("Screener Builder Tests", () => {
  test.beforeEach("Clear Emulator DB (before)", resetEmulator);
  test.beforeEach("Login", authLogin);
  test.afterEach("Clear Emulator DB (after)", resetEmulator);

  test("User can create a new screener", async ({ page }) => {
    // This test starts from scratch - no seeding needed
    await expect(page.locator("#manage-benefits-title")).toBeHidden();

    await createScreenerViaUI(page);

    await expect(page.locator("#manage-benefits-title")).toBeVisible();
  });

  test("User can add a benefit to a Screener", async ({ page }) => {
    // Seed: screener exists, but no benefits
    await seedScreener();
    await page.goto(`/projects/${TEST_SCREENER_ID}`);

    const editButtonLocator = page.getByText("Edit", { exact: true });
    await expect(editButtonLocator).toHaveCount(0);

    await createBenefitViaUI(page);

    await expect(editButtonLocator).toHaveCount(1);
  });

  test("User can configure a Benefit", async ({ page }) => {
    // Seed: screener with benefit exists, but no checks configured
    await seedScreenerWithBenefit();
    await page.goto(`/projects/${TEST_SCREENER_ID}`);
    await navigateToBenefitConfig(page);

    await expect(
      page.getByText("No eligibility checks selected"),
    ).toBeVisible();

    await addOwnerOccupantCheck(page);

    await expect(
      page
        .locator("#selected-eligibility-checks_container")
        .getByText("Owner-occupant"),
    ).toBeVisible();
  });

  test("User can create a Screener Form", async ({ page }) => {
    // Seed: screener with benefit and check configured, but no form
    await seedScreenerWithConfiguredBenefit();
    await page.goto(`/projects/${TEST_SCREENER_ID}`);
    await navigateToBenefitConfig(page);

    await navigateToFormEditor(page);

    const checkboxComponentLabel = page.locator(
      "label.fjs-form-field-label:has-text('Checkbox')",
    );
    await expect(checkboxComponentLabel).toBeHidden();

    await createFormWithCheckbox(page);

    await expect(checkboxComponentLabel).toBeVisible();
  });

  test("User can Preview a Screener Form", async ({ page }) => {
    // Seed: complete screener with form
    await seedScreenerWithForm();
    await page.goto(`/projects/${TEST_SCREENER_ID}`);

    await navigateToPreview(page);

    await test.step("Verify initial state shows ineligible", async () => {
      const benefitsResultsTitleLoc = page.locator(
        '#screener-results:has(div:has-text("Benefits"))',
      );
      await expect(benefitsResultsTitleLoc).toBeVisible();

      const benefitResultLoc = page.locator("div#benefit-result-title_0");
      await expect(benefitResultLoc).toBeVisible();
      await expect(benefitResultLoc).toHaveText("Test Benefit: Ineligible");
    });

    await test.step("Check the checkbox and verify eligible", async () => {
      await page.locator("[type='checkbox'].fjs-input").click();

      const benefitResultLoc = page.locator("div#benefit-result-title_0");
      await expect(benefitResultLoc).toHaveText("Test Benefit: Eligible");
    });
  });

  test("User can Publish a Screener", async ({ page }) => {
    // Seed: complete screener with form
    await seedScreenerWithForm();
    await page.goto(`/projects/${TEST_SCREENER_ID}`);

    await navigateToPublish(page);

    const screenerUrlInfo = page.locator("div#screener-url-info");

    await test.step("Verify unpublished state", async () => {
      await expect(screenerUrlInfo).toHaveText(
        "Screener URL:Publish screener to create public url.",
      );
    });

    await publishScreener(page);

    await test.step("Verify published state", async () => {
      await expect(screenerUrlInfo).not.toHaveText(
        "Screener URL:Publish screener to create public url.",
      );
    });
  });
});
