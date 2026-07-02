import { test, expect } from "@playwright/test";

import { authLogin } from "./authLogin";
import { resetEmulator } from "./firestore";

test.describe("Smoke Tests", () => {
  test.beforeEach("Clear Emulator DB (before)", resetEmulator);
  test.beforeEach("Login", authLogin);
  test.afterEach("Clear Emulator DB (after)", resetEmulator);

  test("user can view landing page after login", async ({ page }) => {
    // Authentication done by beforeEach(...) hook

    // Verify the page title
    await expect(page).toHaveTitle("BDT - Projects List");

    // Verify key elements of the landing page are visible
    // Header with logout button indicates user is authenticated
    await expect(
      page.getByText("Welcome to Benefit Decision Toolkit!"),
    ).toBeVisible();

    await expect(page.getByRole("img", { name: "BDT logo" })).toBeVisible();
    await expect(page.getByTestId("create-new-screener-button")).toBeVisible();
  });
});
