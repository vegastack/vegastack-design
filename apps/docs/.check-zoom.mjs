import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: {width: 1100, height: 800}, colorScheme: 'light' })).newPage();
await page.goto('http://localhost:3000/docs/components/color-picker', { waitUntil: 'networkidle' });
const trigger = page.locator('.vs-type-product [data-slot="color-picker-swatch"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(600);
const grid = page.locator('[data-slot="color-picker"]').first();
await grid.screenshot({ path: '/tmp/cp-open-1.png' });
// click Yellow, reopen, shoot again
const yellow = page.locator('[data-slot="color-picker"] [aria-label*="ellow"]').first();
await yellow.click();
await page.waitForTimeout(400);
await trigger.click();
await page.waitForTimeout(600);
await page.locator('[data-slot="color-picker"]').first().screenshot({ path: '/tmp/cp-open-2.png' });
await browser.close();
