import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173/#/retail');
await page.evaluate(() => document.fonts.ready);
await page.locator('.recharts-area').first().waitFor();
await page.screenshot({
  path: '/workspace/lumen-analytics/public/captures/retail-initial.png',
  fullPage: true,
});
console.log(
  JSON.stringify(
    {
      title: await page.title(),
      errors,
      body: await page.locator('.kpi').allTextContents(),
      dimensions: await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      })),
    },
    null,
    2,
  ),
);
await browser.close();
