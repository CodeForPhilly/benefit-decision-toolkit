import { expect, Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { authLogin } from "./authLogin";
import {
  resetEmulator,
  seedCustomCheckWithParameter,
  seedScreenerWithForm,
  TEST_BENEFIT_ID,
  TEST_SCREENER_ID,
} from "./firestore";
import { getCollection, patchDocument } from "./firestore/firestoreClient";
import { uploadObject } from "./firestore/storageClient";

async function downloadScreener(page: Page): Promise<Buffer> {
  await page.goto("/screeners");
  const card = page
    .locator("article")
    .filter({ hasText: "Shared screener" })
    .first();
  await card.getByRole("button").click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export screener", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Shared-screener.bdt.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test.describe("Screener sharing", () => {
  test.beforeEach(resetEmulator);
  test.beforeEach(authLogin);
  test.afterEach(resetEmulator);

  test("exports and imports a complete screener while reusing its custom checks", async ({
    page,
  }) => {
    await seedScreenerWithForm("Shared screener");
    const { workingCheckId, publishedCheckId } =
      await seedCustomCheckWithParameter();
    const model = (
      await readFile(
        "../builder-api/src/main/resources/seed-data/example-screener/storage/check/P-5bdf1ac7-b0ca-403b-89f9-7f1504f6bf26-1.0.0.dmn",
        "utf8",
      )
    ).replaceAll("Household income limit", "income_threshold");
    await uploadObject(`check/${workingCheckId}.dmn`, model);
    await uploadObject(`check/${publishedCheckId}.dmn`, model);

    // Keep the library check and add a parameterized custom check to the same benefit.
    const benefitCollection = (await getCollection(
      `workingScreener/${TEST_SCREENER_ID}/customBenefit`,
    )) as any;
    const benefit = benefitCollection.documents[0];
    const checkCollection = (await getCollection(
      "publishedCustomCheck",
    )) as any;
    const fields = checkCollection.documents[0].fields;
    benefit.fields.checks.arrayValue.values.push({
      mapValue: {
        fields: {
          checkId: { stringValue: "configured-income" },
          sourceCheckId: { stringValue: publishedCheckId },
          checkName: fields.name,
          checkModule: fields.module,
          checkVersion: fields.version,
          inputDefinition: fields.inputDefinition,
          parameterDefinitions: fields.parameterDefinitions,
          parameters: {
            mapValue: { fields: { incomeLimit: { integerValue: "50000" } } },
          },
          aliasName: { stringValue: "Income under $50,000" },
          aliasGenerated: { booleanValue: false },
        },
      },
    });
    await patchDocument(
      `workingScreener/${TEST_SCREENER_ID}/customBenefit`,
      TEST_BENEFIT_ID,
      benefit,
    );
    await uploadObject(
      `form/working/${TEST_SCREENER_ID}.json`,
      JSON.stringify({
        schemaVersion: 18,
        type: "default",
        id: "BDT_Form",
        components: [
          {
            id: "owner",
            key: "simpleChecks.ownerOccupant",
            label: "Is owner occupant?",
            type: "checkbox",
          },
          {
            id: "income",
            key: "custom.householdIncome",
            label: "Household income",
            type: "number",
          },
        ],
      }),
    );

    const buffer = await downloadScreener(page);
    const exported = JSON.parse(buffer.toString());
    expect(exported.customChecks).toHaveLength(2);
    expect(exported.benefits[0].checks[1].parameters).toEqual({
      incomeLimit: 50000,
    });
    expect(exported.benefits[0].checks[1].aliasName).toBe(
      "Income under $50,000",
    );
    expect(exported.customChecks[0].dmnModel).toBe(model);

    await page.goto("/screeners");
    await page
      .getByRole("button", { name: "Import screener", exact: true })
      .click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "shared.bdt.json",
      mimeType: "application/json",
      buffer,
    });
    await page
      .getByLabel("Screener name", { exact: true })
      .fill(`${exported.screenerName} - Copy`);
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/screener/import") &&
        response.request().method() === "POST",
    );
    await page
      .locator("form")
      .getByRole("button", { name: "Import screener", exact: true })
      .click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const imported = await response.json();
    expect(imported.id).not.toBe(TEST_SCREENER_ID);
    expect(imported.publishedScreenerId).toBeNull();
    await expect(page).toHaveURL(`/screeners/${imported.id}`);
    await expect(page.locator("#manage-benefits-title")).toBeVisible();
    await expect(page.getByText("Test Benefit", { exact: true })).toBeVisible();

    // Evaluate both checks using the imported form and DMN artifact.
    await page.getByTestId("editor-section-preview").click();
    await page.getByRole("button", { name: "Show all questions" }).click();
    await page.locator('[type="checkbox"].fjs-input').check();
    await page.getByLabel("Household income").fill("40000");
    await expect(page.locator("#benefit-result-title_0")).toContainText(
      "Test Benefit: Eligible",
      { timeout: 15000 },
    );
    await page.getByLabel("Household income").fill("60000");
    await expect(page.locator("#benefit-result-title_0")).toContainText(
      "Test Benefit: Ineligible",
      { timeout: 15000 },
    );

    // Importing back into the same account keeps the original custom-check family.
    const workingChecks = (await getCollection("workingCustomCheck")) as any;
    expect(workingChecks.documents).toHaveLength(1);
    expect(workingChecks.documents[0].fields.id.stringValue).toBe(
      workingCheckId,
    );
  });
});
