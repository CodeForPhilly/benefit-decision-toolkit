import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    /* Auntenticate before each Test */

    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials (using Firebase emulator test user)
    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('testpassword123');

    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation to home page after successful login
    await expect(page).toHaveURL('/');
  });

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
