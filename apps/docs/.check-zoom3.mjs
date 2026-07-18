import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: {width: 1100, height: 800}, colorScheme: 'light' })).newPage();
await page.goto('http://localhost:3000/docs/components/color-picker', { waitUntil: 'networkidle' });
const trigger = page.locator('.vs-type-product [data-slot="color-picker-swatch"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.locator('[data-slot="color-picker"]').first().waitFor({ state: 'visible' });
await page.locator('[data-slot="color-picker"] [aria-label*="ellow"]').first().click();
await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) {
  await trigger.click({ force: true });
  try {
    await page.locator('[data-slot="color-picker"]').first().waitFor({ state: 'visible', timeout: 2500 });
    break;
  } catch { /* retry */ }
}
await page.waitForTimeout(300);
await page.locator('[data-slot="color-picker"]').first().screenshot({ path: '/tmp/cp-open-2.png' });
await browser.close();
