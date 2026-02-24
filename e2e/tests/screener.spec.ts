import { test, expect, Page } from '@playwright/test';

import { authLogin } from './authLogin';
import { resetDb } from './firestore';


const step1_createScreener = async (page: Page) => {
  await page.getByText("Create new screener").click();
  await page.locator("#new-screener-name").fill("Test Screener");
  await page.locator("#new-screener-submit").click();
};
const step2_createBenefit = async (page: Page) => {
  await page.getByText("Create new benefit").click();
  await page.locator("#new-benefit-name").fill("Test Benefit");
  await page.locator("#new-benefit-description").fill("Description");
  await page.locator("#new-benefit-submit").click();
};
const step3_navigateToBenefitConfiguration = async (page: Page) => {
  await page.getByText("Edit", { exact: true }).click();
};
const step4_configureBenefit = async (page: Page) => {
  // Wait for the checks table to load and the specific row to appear
  const checkRowLocator = page.locator("#check-row_owner-occupant > td:first-child > div.btn-default");
  await checkRowLocator.waitFor({ state: 'visible' });
  await checkRowLocator.click();
};
const step5_navigateToFormEditor = async (page: Page) => {
  await page.getByText("Form Editor", { exact: true }).click();
};
const step6_createScreenerForm = async (page: Page) => {
  const checkboxComponentLoc = page.locator('[data-field-type="checkbox"]:has(span:has-text("Checkbox"))');
  await checkboxComponentLoc.waitFor({ state: 'visible' });
  await checkboxComponentLoc.dragTo(page.locator('[data-id="BDT Form"].fjs-drop-container-vertical'));

  await page.locator('[data-title="General"].bio-properties-panel-group-header-title').click();
  await page.getByLabel('Key').selectOption('simpleChecks.ownerOccupant');
  await page.getByLabel('Field label').fill('Is owner occupant?');

  await page.locator("#form-editor-save_container > div").click();
};
const step7_navigateToPreview = async (page: Page) => {
  await page.getByText("Preview", { exact: true }).click();
};

test.describe('Screener Builder Tests', () => {
  test.beforeEach("Clear Emulator DB (before)", resetDb);
  test.beforeEach("Login", authLogin);
  test.afterEach("Clear Emulator DB (after)", resetDb);

  // test('User can create a new screener', async ({ page }: { page: Page }) => {
  //   await expect(page.locator('#manage-benefits-title')).toBeHidden();

  //   await step1_createScreener(page);

  //   await expect(page.locator('#manage-benefits-title')).toBeVisible();
  // });

  // test('User can add a benefit to a Screener', async ({ page }: { page: Page }) => {
  //   const itemsLocator = page.getByText("Edit", { exact: true });
  //   await expect(itemsLocator).toHaveCount(0);

  //   await step1_createScreener(page);
  //   await step2_createBenefit(page);

  //   await expect(itemsLocator).toHaveCount(1);
  // });

  // test('User can configure a Benefit', async ({ page }: { page: Page }) => {
  //   await step1_createScreener(page);
  //   await step2_createBenefit(page);
  //   await step3_navigateToBenefitConfiguration(page);

  //   const firstSelectedCheckLoc = page.locator("#selected-eligibility-checks_container > div.cursor-pointer");
  //   await expect(firstSelectedCheckLoc).toHaveCount(0);

  //   await step4_configureBenefit(page);

  //   await expect(firstSelectedCheckLoc).toHaveCount(1);
  // });

  // test('User can create a Screener Form', async ({ page }: { page: Page }) => {
  //   await step1_createScreener(page);
  //   await step2_createBenefit(page);
  //   await step3_navigateToBenefitConfiguration(page);
  //   await step4_configureBenefit(page);
  //   await step5_navigateToFormEditor(page);

  //   const checkboxComponentLabel = page.locator("label.fjs-form-field-label:has-text('Checkbox')");
  //   await expect(checkboxComponentLabel).toHaveCount(0);

  //   await step6_createScreenerForm(page);

  //   await expect(checkboxComponentLabel).toHaveCount(1);
  // });

  test('User can Preview a Screener Form', async ({ page }: { page: Page }) => {
    await step1_createScreener(page);
    await step2_createBenefit(page);
    await step3_navigateToBenefitConfiguration(page);
    await step4_configureBenefit(page);
    await step5_navigateToFormEditor(page);
    await step6_createScreenerForm(page);
    await step7_navigateToPreview(page);

    const benefitsResultsTitleLoc = page.locator('#screener-results:has(div:has-text("Benefits"))');
    await benefitsResultsTitleLoc.waitFor({ state: 'visible' });


  });
});
