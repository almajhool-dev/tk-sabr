// Run against a local server: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser-check.mjs
// Test-only intercepted fixtures never enter the production bundle.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, devices } = process.env.PLAYWRIGHT_MODULE
  ? await import(process.env.PLAYWRIGHT_MODULE)
  : require("playwright");
const browser = await chromium.launch({ headless: true });
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const summary = [];
try {
  for (const [name, options] of [
    ["desktop", { viewport: { width: 1440, height: 1000 } }],
    ["android", devices["Pixel 7"]],
    [
      "small",
      { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true },
    ],
  ]) {
    const context = await browser.newContext(options),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${name}: overflow`,
    );
    await page
      .getByLabel("أدخل يوزر حساب تيك توك")
      .fill("https://evil.org/@creator");
    await page.getByRole("button", { name: "ابدأ فحص الحساب" }).click();
    await page.getByRole("alert").waitFor();
    await page.getByLabel("أدخل يوزر حساب تيك توك").fill("@creator");
    await page.getByRole("button", { name: "ابدأ فحص الحساب" }).click();
    await page.getByRole("alert").filter({ hasText: "مصدر" }).waitFor();
    await page.getByRole("button", { name: "English", exact: true }).click();
    assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
    await page
      .getByRole("button", { name: "Reduce motion", exact: true })
      .click();
    assert.equal(
      await page
        .locator("html")
        .evaluate((e) => e.classList.contains("reduce-motion")),
      true,
    );
    assert.deepEqual(errors, []);
    summary.push(
      `${name}: validation, real 503, language, reduced motion, no overflow/errors`,
    );
    await context.close();
  }
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    page = await context.newPage();
  await page.route("**/api/tiktok/analyze", async (route) =>
    route.fulfill({
      json: {
        status: "success",
        username: "creator",
        profile: {
          displayName: "Test fixture only",
          avatarUrl: null,
          verified: null,
          followers: null,
          following: 0,
          likes: 0,
          videos: 0,
          bio: "",
          private: false,
        },
        videos: [],
        analysis: {
          engagementRate: null,
          sampleSize: 0,
          estimatedAccountScore: null,
          scoreDisclaimer: "Test limitation",
          factors: [],
          averagePostingGapDays: null,
          issues: [],
          recommendations: [],
        },
        dataSource: "Test-only fixture",
        fetchedAt: "2026-10-21T12:00:00Z",
      },
    }),
  );
  await page.route("**/api/reports/generate", async (route) =>
    route.fulfill({
      json: {
        report: {
          type: "rules",
          summary: "Rule-based fixture",
          recommendations: [],
          disclaimer: "test",
        },
      },
    }),
  );
  await page.goto(base);
  await page.getByLabel("أدخل يوزر حساب تيك توك").fill("creator");
  await page.getByRole("button", { name: "ابدأ فحص الحساب" }).click();
  await page.getByRole("heading", { name: "Test fixture only" }).waitFor();
  assert.ok(
    (await page.getByText("البيانات غير متاحة", { exact: true }).count()) > 0,
  );
  assert.equal(await page.locator("#results img").count(), 0);
  await page
    .getByRole("button", { name: "توليد التقرير الذكي", exact: true })
    .click();
  await page.getByText("Rule-based fixture").waitFor();
  await page.emulateMedia({ media: "print" });
  assert.equal(
    await page.getByRole("heading", { name: "Test fixture only" }).isVisible(),
    true,
  );
  await page.pdf({
    path: "/tmp/tksabr-print-test.pdf",
    format: "A4",
    printBackground: true,
  });
  summary.push(
    "results: null vs zero, no avatar overlay, rules report and PDF print layout",
  );
  await page.emulateMedia({ media: "screen" });
  await page.unroute("**/api/tiktok/analyze");
  await page.route("**/api/tiktok/analyze", (route) =>
    route.abort("internetdisconnected"),
  );
  await page.getByRole("button", { name: "فحص حساب آخر" }).click();
  await page.getByLabel("أدخل يوزر حساب تيك توك").fill("creator");
  await page.getByRole("button", { name: "ابدأ فحص الحساب" }).click();
  await page.getByRole("alert").filter({ hasText: "الاتصال" }).waitFor();
  summary.push("offline: visible error and recovered button");
  await context.close();
  console.log(JSON.stringify({ passed: summary }, null, 2));
} finally {
  await browser.close();
}
