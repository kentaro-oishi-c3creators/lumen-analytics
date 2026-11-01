import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5173/#/story');
  await page.getByRole('button', { name: '7: 触れるほど、見えてくる。', exact: true }).click();
  await page.getByRole('link', { name: '操作ステップ2を体験する', exact: true }).click();
  assert.equal(await page.getByLabel('期間', { exact: true }).inputValue(), 'quarter');
  assert.equal(await page.getByLabel('エリア', { exact: true }).inputValue(), '関東');
  assert.equal(await page.getByLabel('カテゴリー', { exact: true }).inputValue(), 'アパレル');
  await page.goto('http://127.0.0.1:5173/#/collection');
  await page.goto(
    'http://127.0.0.1:5173/#/retail?period=quarter&region=関東&category=アパレル&detail=アパレル',
  );
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert.ok(page.url().includes('#/retail'));
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
  await page.goto('http://127.0.0.1:5173/#/story');
  await page.getByRole('button', { name: '2: 4つの現場。4つの問い。', exact: true }).click();
  await page.getByRole('link', { name: 'healthcareのダッシュボードを開く', exact: true }).click();
  await page.getByRole('heading', { name: 'Healthcare pulse.', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Slide diagram hotspots, parameterized filtered view, detail link and keyboard dialog dismissal passed.',
  );
} finally {
  await browser.close();
}
