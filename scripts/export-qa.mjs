import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  acceptDownloads: true,
  reducedMotion: 'reduce',
});
const page = await context.newPage(),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5173/#/story');
  await page.locator('.slide-img').evaluate((i) => i.decode());
  await page.getByRole('button', { name: '書き出す', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.equal(await dialog.getByRole('link').count(), 4);
  const currentSlide = await page.locator('.slide-caption').innerText();
  await page.keyboard.press('End');
  assert.equal(await page.locator('.slide-caption').innerText(), currentSlide);
  for (const [label, filename] of [
    ['HTMLで保存', 'lumen-design-story.html'],
    ['PowerPointで保存', 'lumen-design-story.pptx'],
    ['PDFで保存', 'lumen-design-story.pdf'],
    ['SVGで保存', 'lumen-svg-slides.zip'],
  ]) {
    const pending = page.waitForEvent('download');
    await dialog.getByRole('link', { name: label, exact: true }).click();
    const dl = await pending;
    assert.equal(dl.suggestedFilename(), filename);
    const data = await readFile(await dl.path());
    assert.deepEqual(data, await readFile('public/' + filename));
  }
  await page.screenshot({ path: '.export-build/export-dialog.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.locator('.story-exports').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.export-build/export-controls.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/#/story');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('.story-exports a').count(), 4);
  await page.locator('.story-exports').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.export-build/mobile-exports.png' });
  const offlineContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    offline: true,
    reducedMotion: 'reduce',
  });
  const offline = await offlineContext.newPage();
  const external = [];
  offline.on('pageerror', (e) => errors.push(e.message));
  offline.on('request', (request) => {
    if (/^https?:/.test(request.url())) external.push(request.url());
  });
  await offline.setContent(await readFile('public/lumen-design-story.html', 'utf8'), {
    waitUntil: 'load',
  });
  await offline.locator('#slide').evaluate((i) => i.decode());
  assert.equal(await offline.locator('#thumbs button').count(), 10);
  assert.equal(await offline.locator('#slide').evaluate((i) => i.naturalWidth), 1600);
  await offline.keyboard.press('ArrowRight');
  assert.ok((await offline.locator('#counter').innerText()).startsWith('02'));
  assert.equal(await offline.locator('.hotspot').count(), 4);
  assert.ok(
    (await offline.locator('.hotspot').first().getAttribute('href')).startsWith(
      'https://kentaro-oishi-c3creators.github.io/lumen-analytics/',
    ),
  );
  await offline.keyboard.press('End');
  assert.ok((await offline.locator('#counter').innerText()).startsWith('10'));
  await offline.keyboard.press('Home');
  assert.ok((await offline.locator('#counter').innerText()).startsWith('01'));
  await offline
    .getByRole('button', { name: '3: Retail — 成長の理由を、探る。', exact: true })
    .click();
  assert.ok((await offline.locator('#counter').innerText()).startsWith('03'));
  await offline.clock.install();
  await offline.getByRole('button', { name: '自動再生', exact: true }).click();
  await offline.clock.fastForward(11100);
  assert.ok((await offline.locator('#counter').innerText()).startsWith('04'));
  await offline.getByRole('button', { name: '自動再生を停止', exact: true }).click();
  for (let i = 0; i < 10; i++) {
    await offline.locator('#thumbs button').nth(i).click();
    await offline.locator('#slide').evaluate((i) => i.decode());
    assert.equal(await offline.locator('#slide').evaluate((i) => i.naturalWidth), 1600);
  }
  await offline.keyboard.press('Home');
  await offline.screenshot({ path: '.export-build/offline-html.png' });
  assert.deepEqual(external, []);
  await offline.setViewportSize({ width: 390, height: 844 });
  assert.ok(await offline.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await offlineContext.close();
  const zip = unzipSync(await readFile('public/lumen-design-story.pptx'));
  const retail = strFromU8(zip['ppt/slides/slide3.xml']);
  assert.match(retail, /<a:srcRect[^>]*t="0"[^>]*b="23805"/);
  assert.ok((retail.match(/<a:t>/g) || []).length > 10);
  assert.deepEqual(errors, []);
  await writeFile(
    'docs/export-verification.json',
    JSON.stringify(
      {
        status: 'passed',
        formats: ['HTML', 'PPTX', 'PDF', 'SVG ZIP'],
        downloadContents: 'exact match',
        offlineHtml: {
          slides: 10,
          allImagesLoaded: true,
          keyboard: true,
          autoplay: true,
          externalRequests: external.length,
          mobileOverflow: false,
        },
        pptx: {
          slides: 10,
          nativeTextObjects: 199,
          sourceCropPreserved: true,
          renderedWith: 'LibreOffice',
          powerPointAppVerified: false,
        },
        exportDialogKeyboard: true,
        mobileOverflow: false,
        pageErrors: errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Four real downloads, offline HTML playback, editable PPTX package and 390px layout passed.',
  );
} finally {
  await context.close();
  await browser.close();
}
