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
const step3_configureBenefit = async (page: Page) => {
  await page.getByText("Edit", { exact: true }).click();
  await page.locator("#check-row_person-min-age td:first-child div").click();
};

test.describe('Screener Builder Tests', () => {
  test.beforeEach("Clear Emulator DB (before)", resetDb);
  test.beforeEach("Login", authLogin);
  test.afterEach("Clear Emulator DB (after)", resetDb);

  test('User can create a new screener', async ({ page }: { page: Page }) => {
    await expect(page.locator('#manage-benefits-title')).toBeHidden();

    await step1_createScreener(page);

    await expect(page.locator('#manage-benefits-title')).toBeVisible();
  });

  test('User can add a benefit to a Screener', async ({ page }: { page: Page }) => {
    const itemsLocator = page.getByText("Edit", { exact: true });
    await expect(itemsLocator).toHaveCount(0);

    await step1_createScreener(page);
    await step2_createBenefit(page);

    await expect(itemsLocator).toHaveCount(1);
  });

  test('User can configure a Benefit', async ({ page }: { page: Page }) => {
    await step1_createScreener(page);
    await step2_createBenefit(page);
    await step3_configureBenefit(page);

    const selectedCheckLocator = page.getByText("Person-min-age - 0.5.0", { exact: true });
    await expect(selectedCheckLocator).toHaveCount(1);
  });
});
