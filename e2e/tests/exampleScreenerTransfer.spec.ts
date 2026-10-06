import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Provision our own local demo account instead of clearing an existing developer's data.
// This also exercises the exact bundled example received by a new analyst.
test("the bundled example can be chosen, exported, and imported with its internal library checks", async ({
  page,
  request,
}) => {
  const email = `import-regression-${randomUUID()}@example.com`;
  const password = "local-import-regression-account";
  const signUp = await request.post(
    "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-demo",
    {
      data: { email, password, returnSecureToken: true },
    },
  );
  expect(signUp.ok()).toBe(true);
  const account = await signUp.json();
  const provision = await request.post(
    "http://localhost:8081/api/account/hooks",
    {
      headers: { Authorization: `Bearer ${account.idToken}` },
      data: { hooks: ["add example screener"] },
    },
  );
  expect(provision.ok()).toBe(true);
  expect((await provision.json()).success).toBe(true);

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/screeners");
  const card = page
    .locator("article")
    .filter({ hasText: "Philadelphia Benefits Example" });
  await expect(card).toHaveCount(1);
  await card.getByRole("button").click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export screener", exact: true })
    .click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  const exported = JSON.parse(buffer.toString());
  expect(exported.benefits).toHaveLength(4);
  expect(exported.benefits.flatMap((benefit: any) => benefit.checks)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        sourceCheckId: "L-internal-sctf-age-requirement-0.9.0",
      }),
    ]),
  );

  await page.goto("/screeners");
  await page
    .getByRole("button", { name: "Import screener", exact: true })
    .click();
  const chooseFile = page.getByRole("button", {
    name: "Choose file",
    exact: true,
  });
  await expect(chooseFile).toBeVisible();
  expect(
    await chooseFile.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopWidth),
    ),
  ).toBeGreaterThan(0);
  const chooserPromise = page.waitForEvent("filechooser");
  await chooseFile.click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "example.bdt.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(
    page.getByText("example.bdt.json", { exact: true }),
  ).toBeVisible();
  const importPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/screener/import") &&
      response.request().method() === "POST",
  );
  await page
    .locator("form")
    .getByRole("button", { name: "Import screener", exact: true })
    .click();
  const response = await importPromise;
  expect(response.status(), await response.text()).toBe(201);
  const imported = await response.json();
  expect(imported.benefits).toHaveLength(4);
  await expect(page).toHaveURL(`/screeners/${imported.id}`);
  await expect(page.locator("#manage-benefits-title")).toBeVisible();
  await expect(
    page.getByText("Senior Citizen Tax Freeze (SCTF)", { exact: true }),
  ).toBeVisible();
  expect(imported.benefits.map((benefit: any) => benefit.name)).toEqual(
    exported.benefits.map((benefit: any) => benefit.name),
  );
  for (const benefit of imported.benefits) {
    await expect(page.getByText(benefit.name, { exact: true })).toBeVisible();
  }
});
