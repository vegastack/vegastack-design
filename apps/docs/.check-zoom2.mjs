import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await (
  await browser.newContext({
    viewport: { width: 1100, height: 800 },
    colorScheme: "light",
  })
).newPage();
await page.goto("http://localhost:3000/docs/components/color-picker", {
  waitUntil: "networkidle",
});
const trigger = page
  .locator('.vs-type-product [data-slot="color-picker-swatch"]')
  .first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page
  .locator('[data-slot="color-picker"]')
  .first()
  .waitFor({ state: "visible" });
await page
  .locator('[data-slot="color-picker"] [aria-label*="ellow"]')
  .first()
  .click();
await page.waitForTimeout(500);
await trigger.click();
const grid = page.locator('[data-slot="color-picker"]').first();
await grid.waitFor({ state: "visible", timeout: 10000 });
await page.waitForTimeout(300);
await grid.screenshot({ path: "/tmp/cp-open-2.png" });
await browser.close();
