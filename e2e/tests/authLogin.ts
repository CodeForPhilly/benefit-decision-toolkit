import { expect, Page } from '@playwright/test';

export const authLogin = async ({ page }: { page: Page }) => {
  /* Authenticate before each Test */

  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials (using Firebase emulator test user)
  await page.locator('#email').fill('test@example.com');
  await page.locator('#password').fill('testpassword123');

  // Click sign in button
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for navigation to home page after successful login
  await expect(page).toHaveURL('/');
};
