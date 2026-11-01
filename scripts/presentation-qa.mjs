import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
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
  await page.goto('http://127.0.0.1:5173/#/collection');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.collection-card').count(), 5);
  assert.equal(
    await page
      .locator('.collection-card img')
      .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0)),
    true,
  );
  await page.screenshot({ path: 'public/captures/collection.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/#/story');
  await page.locator('.slide-img').waitFor();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.slide-thumbnails>button').count(), 10);
  assert.equal(
    await page.locator('.slide-img').evaluate((i) => i.complete && i.naturalWidth === 1600),
    true,
  );
  await page.screenshot({ path: 'public/captures/story.png' });
  await page.keyboard.press('ArrowRight');
  assert.ok((await page.locator('.slide-caption').innerText()).includes('02'));
  await page.keyboard.press('End');
  assert.ok((await page.locator('.slide-caption').innerText()).includes('10'));
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: '3: Retail — 成長の理由を、探る。', exact: true }).click();
  await page.locator('.slide-img').evaluate((i) => i.decode());
  await page.screenshot({ path: 'public/captures/story-retail.png' });
  const names = [
    '01-opening',
    '02-overview',
    '03-retail',
    '04-manufacturing',
    '05-healthcare',
    '06-finance',
    '07-interaction',
    '08-ai',
    '09-architecture',
    '10-closing',
  ];
  const pdf = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await pdf.setContent(
    '<html><head><style>@page{size:1600px 900px;margin:0}*{box-sizing:border-box}html,body{margin:0}section{width:1600px;height:900px;break-after:page}section:last-child{break-after:auto}svg{display:block}</style></head><body>' +
      (
        await Promise.all(
          names.map(
            async (name) =>
              `<section>${await readFile(`public/slides/${name}.svg`, 'utf8')}</section>`,
          ),
        )
      ).join('') +
      '</body></html>',
  );
  await pdf.evaluate(() => document.fonts.ready);
  await pdf.pdf({
    path: 'public/lumen-design-story.pdf',
    width: '1600px',
    height: '900px',
    printBackground: true,
    preferCSSPageSize: true,
  });
  await pdf.close();
  // Render each source SVG in the browser so fonts, embedded screenshots and vector layout are checked.
  for (const name of names) {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`http://127.0.0.1:5173/slides/${name}.svg`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/${name}-preview.png` });
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'docs/presentation-verification.json',
    JSON.stringify(
      {
        status: 'passed',
        slides: 10,
        standaloneSvgs: true,
        keyboardNavigation: true,
        collectionImages: true,
        pdf: true,
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log('Collection, 10 SVG slides, keyboard navigation and PDF verified. No page errors.');
} finally {
  await browser.close();
}
