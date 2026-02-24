import { test, expect } from '@playwright/test';

import { authLogin } from './authLogin';
import { resetDb } from './firestore';

test.describe('Smoke Tests', () => {
  test.beforeEach("Clear Emulator DB (before)", resetDb);
  test.beforeEach("Login", authLogin);
  test.afterEach("Clear Emulator DB (after)", resetDb);

  test('user can view landing page after login', async ({ page }) => {
    // Authentication done by beforeEach(...) hook

    // Verify the page title
    await expect(page).toHaveTitle(/Benefit Decision Toolkit/);

    // Verify key elements of the landing page are visible
    // Header with logout button indicates user is authenticated
    await expect(page.getByText('Logout')).toBeVisible();

    // Navigation tabs should be visible
    await expect(page.getByRole('button', { name: 'Screeners' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Eligibility checks' })).toBeVisible();
  });
});
