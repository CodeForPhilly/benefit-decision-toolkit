import { test, expect } from "@playwright/test";

for (const showWhen of ["whenDecided", "whenComplete"]) {
  test(`published next steps show safely with ${showWhen} and suppress stale decisions`, async ({
    page,
  }) => {
    let fail = false;
    await page.route("**/api/published/**", async (route) => {
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      };
      if (route.request().method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      if (route.request().method() === "GET")
        return route.fulfill({
          headers,
          json: {
            screenerName: "Next steps test",
            formSchema: {
              id: "form",
              type: "default",
              schemaVersion: 18,
              components: [
                {
                  id: "income",
                  type: "number",
                  key: "income",
                  label: "Household income",
                },
                {
                  id: "household-size",
                  type: "number",
                  key: "householdSize",
                  label: "Number of people in your household",
                },
                { id: "print", type: "print_summary" },
                {
                  id: "next",
                  type: "next_steps",
                  showWhen,
                  benefitContent: {
                    housing: {
                      eligible: {
                        applyUrl: "https://example.org/apply",
                        helpPhone: "215-555-0100",
                        body: "Bring **photo ID**. [Help](https://example.org/help)<script>window.bad=true</script>",
                      },
                      ineligible: { note: "Ask about other assistance." },
                    },
                  },
                },
              ],
            },
          },
        });
      if (fail) return route.fulfill({ headers, status: 503, json: {} });
      const answers = route.request().postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 150));
      return route.fulfill({
        headers,
        json: {
          housing: {
            name: "Housing assistance",
            result: answers.income < 1000 ? "TRUE" : "FALSE",
            check_results: {
              income: {
                name: "Income",
                aliasName: "Income must be below $1,000",
                result: answers.income < 1000 ? "TRUE" : "FALSE",
                inputPaths: [],
                parameters: {},
              },
            },
          },
          food: {
            name: "Food assistance",
            result:
              answers.householdSize == null ? "UNABLE_TO_DETERMINE" : "TRUE",
            check_results: {
              size: {
                name: "Household size",
                result:
                  answers.householdSize == null
                    ? "UNABLE_TO_DETERMINE"
                    : "TRUE",
                inputPaths: ["householdSize"],
                parameters: {},
              },
            },
          },
        },
      });
    });
    await page.goto("/screener/next-steps-test");
    const income = page.getByLabel("Household income", { exact: true });
    await income.fill("500");
    if (showWhen === "whenDecided") {
      await expect(
        page.getByRole("heading", { name: "Your next steps so far" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Apply for this benefit" }),
      ).toBeVisible();
      await expect(
        page.getByText("Still needs more information.", { exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText(
          "Answer the remaining questions to see your next steps.",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Apply for this benefit" }),
      ).toHaveCount(0);
    }
    const nextSteps = page.getByRole("region", {
      name: "Your next steps",
      exact: true,
    });
    await expect(
      nextSteps.getByText("Number of people in your household", {
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate(() => {
      window.print = () => {
        (window as any).partialPrint =
          document.querySelector(".bdt-print-root")!.textContent;
        window.dispatchEvent(new Event("afterprint"));
      };
    });
    await page.getByRole("button", { name: "Print / Save as PDF" }).click();
    const partialPrint = await page.evaluate(
      () => (window as any).partialPrint,
    );
    expect(partialPrint).toContain("Number of people in your household");
    expect(partialPrint).not.toContain("Household income");
    await page
      .getByLabel("Number of people in your household", { exact: true })
      .fill("2");
    await expect(
      page.getByRole("heading", {
        name: "Screening complete — your next steps",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      nextSteps.getByText("Find answers to these questions to continue:", {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(nextSteps.locator("strong")).toHaveText("photo ID");
    await expect(
      nextSteps.getByRole("link", { name: "Help", exact: true }),
    ).toHaveAttribute("target", "_blank");
    await expect(
      page.getByText("Screening complete. All benefits", { exact: false }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).bad)).toBeUndefined();
    // Capture the real print tree and print-media visibility without opening a dialog.
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => {
      window.print = () => {
        const root = document.querySelector(".bdt-print-root")!;
        (window as any).printed = {
          text: root.textContent,
          summaryDisplay: getComputedStyle(root).display,
          otherDisplays: Array.from(document.body.children)
            .filter((el) => el !== root)
            .map((el) => getComputedStyle(el).display),
        };
      };
    });
    await page.getByRole("button", { name: "Print / Save as PDF" }).click();
    const printed = await page.evaluate(() => (window as any).printed);
    expect(printed.text).toContain("Next steps test");
    expect(printed.text).toContain("photo ID");
    expect(printed.text).toContain("https://example.org/apply");
    expect(printed.text).toContain("https://example.org/help");
    expect(printed.text).not.toContain("Household income");
    expect(printed.summaryDisplay).toBe("block");
    expect(
      printed.otherDisplays.every((display: string) => display === "none"),
    ).toBe(true);
    // Like mobile browsers, this print() returns before printing ends, so the tree stays
    // until the print media query stops matching.
    await expect(page.locator(".bdt-print-root")).toHaveCount(1);
    await page.emulateMedia({ media: "screen" });
    await expect(page.locator(".bdt-print-root")).toHaveCount(0);
    await income.fill("2000");
    await expect(
      page.getByRole("button", { name: "Print / Save as PDF" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Updating your next steps…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Apply for this benefit" }),
    ).toHaveCount(0);
    await expect(
      nextSteps.getByText("Requirements not met", { exact: true }),
    ).toBeVisible();
    await expect(nextSteps.getByRole("listitem")).toHaveText(
      "Income must be below $1,000",
    );
    await expect(
      nextSteps.getByText("Ask about other assistance."),
    ).toBeVisible();
    fail = true;
    await income.fill("600");
    await expect(
      page.getByText(
        "We couldn't update your next steps. Change an answer to try again.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Screening complete — your next steps",
        exact: true,
      }),
    ).toHaveCount(0);
  });
}
