import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const screenshotDirectory = path.join(
  repositoryRoot,
  "docs/src/assets/screenshots",
);
// Intentionally fixed to the local demo emulators: never seed a real account.
const baseUrl = "http://localhost:5173";
const firestore =
  "http://localhost:8080/v1/projects/demo-bdt-dev/databases/(default)/documents";
const email = `docs-${randomUUID()}@example.com`;
const password = "local-docs-screenshot-account";

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`${url}: ${response.status} ${await response.text()}`);
  return response.json();
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { integerValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(firestoreValue) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, firestoreValue(item)]),
      ),
    },
  };
}

async function seedDocument(collection, id, data) {
  return jsonRequest(`${firestore}/${collection}?documentId=${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(firestoreValue(data).mapValue),
  });
}

// Create directly through the emulator so signup does not import the bundled
// example. Every record below belongs to this fresh, isolated account.
const account = await jsonRequest(
  "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-demo",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
const ownerId = account.localId;
const api = (route, data) =>
  jsonRequest(`http://localhost:8081/api${route}`, {
    method: data ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${account.idToken}`,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
const libraryChecks = await api("/library-checks");
function check(name, aliasName) {
  const source = libraryChecks.find((item) => item.name === name);
  if (!source) throw new Error(`Missing library check: ${name}`);
  return {
    checkId: source.id,
    checkName: source.name,
    checkModule: source.module,
    checkVersion: source.version,
    evaluationUrl: source.evaluationUrl,
    inputDefinition: source.inputDefinition,
    parameterDefinitions: [],
    parameters: {},
    aliasName,
  };
}
const resident = check("lives-in-philadelphia-pa", "Lives in Philadelphia");
const homeowner = check("owner-occupant", "Owns and lives in the home");
const benefits = [
  {
    id: randomUUID(),
    name: "Home Repair Support",
    description:
      "Demo program for Philadelphia residents who own and live in their home. Get help with essential repairs and safer living spaces.",
    checks: [resident, homeowner],
  },
  {
    id: randomUUID(),
    name: "Neighborhood Resource Navigation",
    description:
      "Demo program connecting Philadelphia residents with local housing counselors and community services.",
    checks: [resident],
  },
];
const screenerId = randomUUID();
await seedDocument("workingScreener", screenerId, {
  ownerId,
  screenerName: "Philadelphia Homeowner Support",
  publishedScreenerId: null,
  benefits: benefits.map(({ id, name, description }) => ({
    id,
    name,
    description,
  })),
});
for (const benefit of benefits) {
  await seedDocument(
    `workingScreener/${screenerId}/customBenefit`,
    benefit.id,
    { ...benefit, ownerId },
  );
}
const form = {
  schemaVersion: 18,
  type: "default",
  id: "HomeownerSupport",
  components: [
    {
      type: "text",
      id: "intro",
      text: "# Philadelphia Homeowner Support\nAnswer two questions to explore support for your home.\n\n*Documentation demo — these are illustrative programs, not an application for benefits.*",
    },
    {
      type: "yes_no",
      id: "resident",
      key: "simpleChecks.livesInPhiladelphiaPa",
      label: "Do you live in Philadelphia?",
    },
    {
      type: "yes_no",
      id: "homeowner",
      key: "simpleChecks.ownerOccupant",
      label: "Do you own and live in your home?",
      description:
        "Choose Yes if this is the home you own and use as your primary residence.",
    },
  ],
};
await jsonRequest(
  `http://localhost:9199/upload/storage/v1/b/demo-bdt-dev.appspot.com/o?uploadType=media&name=${encodeURIComponent(`form/working/${screenerId}.json`)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": Buffer.byteLength(JSON.stringify(form)).toString(),
    },
    body: JSON.stringify(form),
  },
);
// A second, clearly named draft makes the dashboard show how projects coexist.
await seedDocument("workingScreener", randomUUID(), {
  ownerId,
  screenerName: "Community Food Support (Draft)",
  benefits: [],
  publishedScreenerId: null,
});
const customCheck = await api("/custom-checks", {
  name: "household-income-limit",
  module: "community-support",
  description:
    "Compare annual household income with the limit set by each program.",
  parameterDefinitions: [
    {
      key: "incomeLimit",
      label: "Annual household income limit ($)",
      type: "number",
      required: true,
    },
  ],
});
await api("/custom-checks", {
  name: "minimum-residency",
  module: "community-support",
  description:
    "Check how long a household has lived in the program service area.",
  parameterDefinitions: [
    {
      key: "minimumMonths",
      label: "Minimum months of residency",
      type: "number",
      required: true,
    },
  ],
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1100, height: 720 },
  deviceScaleFactor: 2,
});
page.setDefaultTimeout(15000);
const saveScreenshot = async (name, locator) => {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await (locator ?? page).screenshot({
    path: path.join(screenshotDirectory, name),
    animations: "disabled",
  });
  console.log(`Saved ${name}`);
};

try {
  await page.goto(baseUrl);
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByText("Philadelphia Homeowner Support", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 610 });
  await saveScreenshot("screener-dashboard.png");

  await page
    .getByText("Philadelphia Homeowner Support", { exact: true })
    .click();
  await expect(
    page.getByText("Home Repair Support", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 480 });
  await saveScreenshot("manage-benefits.png");

  await page.getByTestId(`edit-benefit-${benefits[0].id}`).click();
  await expect(page.getByTestId("add-check-person-min-age")).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 780 });
  await saveScreenshot(
    "configure-benefit-1.png",
    page.locator("#eligibility-check-list"),
  );
  await saveScreenshot(
    "configure-benefit-2.png",
    page.locator("#selected-eligibility-checks"),
  );
  await page.getByTestId("add-check-person-min-age").click();
  const modal = page.locator("div.fixed.inset-0 > div.bg-white");
  await modal.locator('input[type="text"]').fill("applicant");
  await modal.locator('input[type="number"]').fill("18");
  await saveScreenshot("configure-check.png", modal);
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.getByRole("button", { name: "Form Editor", exact: true }).click();
  await page.setViewportSize({ width: 1100, height: 650 });
  await expect(
    page.getByText("Do you live in Philadelphia?", { exact: true }),
  ).toBeVisible();
  await saveScreenshot("form-editor-components.png");
  await page
    .getByText("Do you own and live in your home?", { exact: true })
    .click();
  await page.getByText("General", { exact: true }).click();
  await expect(page.getByLabel("Key", { exact: true })).toHaveValue(
    "simpleChecks.ownerOccupant",
  );
  await saveScreenshot("form-editor-parameters.png");
  await page.setViewportSize({ width: 1100, height: 780 });
  await page.getByText("Validate Form Outputs", { exact: true }).click();
  await page.setViewportSize({ width: 1100, height: 500 });
  await expect(
    page.getByText("Satisfied Inputs", { exact: true }),
  ).toBeVisible();
  await saveScreenshot(
    "form-validation.png",
    page.locator("[data-corvu-drawer-content]"),
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1100, height: 720 });

  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const previewQuestions = page.locator(".fjs-form-field-yes_no");
  await previewQuestions.nth(0).getByText("Yes", { exact: true }).click();
  await previewQuestions.nth(1).getByText("Yes", { exact: true }).click();
  await expect(page.getByText("Eligible", { exact: true })).toHaveCount(2, {
    timeout: 30000,
  });
  await saveScreenshot("preview-inputs.png", page.locator(".fjs-form"));
  await saveScreenshot(
    "preview-results.png",
    page.locator("#screener-input-data"),
  );

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish Screener" }).click();
  const publicLink = page.locator("#screener-url-info a[href]");
  await expect(publicLink).toBeVisible();
  await saveScreenshot("publish.png", page.locator("div.px-8.py-4"));
  await page.goto(await publicLink.getAttribute("href"));
  await page.setViewportSize({ width: 1100, height: 600 });
  await expect(
    page.getByText("Do you live in Philadelphia?", { exact: true }),
  ).toBeVisible();
  const questions = page.locator(".fjs-form-field-yes_no");
  await questions.nth(0).getByText("Yes", { exact: true }).click();
  await questions.nth(1).getByText("Yes", { exact: true }).click();
  await expect(page.getByText("Eligible", { exact: true })).toHaveCount(2, {
    timeout: 30000,
  });
  await saveScreenshot("published-screener.png", page.locator("main"));
  await saveScreenshot("example-screener.png", page.locator("main"));

  await page.goto(`${baseUrl}/check`);
  await page.setViewportSize({ width: 1100, height: 420 });
  await expect(
    page.getByText("household-income-limit", { exact: true }),
  ).toBeVisible();
  await saveScreenshot("custom-checks-list.png");
  await page.goto(`${baseUrl}/check/${customCheck.id}`);
  await page.setViewportSize({ width: 1000, height: 530 });
  await expect(page.getByText("incomeLimit", { exact: true })).toBeVisible();
  await saveScreenshot("custom-check-editor.png");
  console.log(`Captured documentation examples for local account ${email}`);
} finally {
  await browser.close();
}
