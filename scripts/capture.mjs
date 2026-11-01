import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { configs, defaultFilters, metrics, selectRows, csv } from '../src/data.ts';
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  acceptDownloads: true,
});
const page = await context.newPage(),
  errors = [],
  results = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('public/captures', { recursive: true });
await mkdir('docs', { recursive: true });
async function ready() {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1700);
}
async function capture(name, fullPage = false) {
  await page.screenshot({ path: `public/captures/${name}.png`, fullPage });
}
try {
  for (const id of Object.keys(configs)) {
    await page.goto(`${base}/#/${id}`);
    await ready();
    assert.ok((await page.title()).includes(configs[id].en));
    assert.equal(await page.locator('.kpi').count(), 4);
    await capture(id);
    const before = await page.locator('.kpi-value').first().innerText();
    await page.getByLabel('期間', { exact: true }).selectOption('quarter');
    await page
      .getByLabel(configs[id].regionLabel, { exact: true })
      .selectOption(configs[id].regions[0]);
    await page
      .getByLabel(configs[id].categoryLabel, { exact: true })
      .selectOption(configs[id].categories[0]);
    await ready();
    assert.notEqual(await page.locator('.kpi-value').first().innerText(), before);
    assert.equal(await page.locator('tbody tr').count(), 1);
    const expected = selectRows(id, {
      period: 'quarter',
      region: configs[id].regions[0],
      category: configs[id].categories[0],
    });
    assert.equal(expected.length, 3);
    const dlPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV出力', exact: true }).click();
    const dl = await dlPromise;
    let content = '';
    const stream = await dl.createReadStream();
    for await (const b of stream) content += b.toString('utf8');
    assert.equal(content, csv(expected));
    await page.getByRole('button', { name: 'ビューを保存', exact: true }).click();
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await page.getByRole('button', { name: '保存ビューを復元', exact: true }).click();
    assert.equal(
      await page.getByLabel(configs[id].regionLabel, { exact: true }).inputValue(),
      configs[id].regions[0],
    );
    if (id === 'retail') await capture('retail-filtered');
    await page
      .getByRole('button', { name: `${configs[id].categories[0]}の詳細を開く`, exact: true })
      .click();
    assert.equal(await page.getByRole('dialog').count(), 1);
    assert.ok((await page.getByRole('dialog').innerText()).includes('詳細分析'));
    if (id === 'retail') await capture('retail-detail');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await ready();
    if (id === 'retail') {
      await page.getByRole('button', { name: 'ビューティーで絞り込む', exact: true }).click();
      assert.equal(
        await page.getByLabel('カテゴリー', { exact: true }).inputValue(),
        'ビューティー',
      );
      await page.getByRole('button', { name: 'リセット', exact: true }).click();
    }
    results.push({
      story: `${id}: filters, KPIs, CSV integrity, saved view, details`,
      status: 'passed',
      filteredRecords: expected.length,
      expectedActual: metrics(id, expected).actual,
    });
  }
  await page.goto(`${base}/#/ai`);
  await ready();
  await capture('ai');
  const predicted = await page.locator('.ai-kpis .kpi-value').nth(1).innerText();
  await page.getByLabel('需要の変化', { exact: true }).fill('20');
  assert.notEqual(await page.locator('.ai-kpis .kpi-value').nth(1).innerText(), predicted);
  await page.getByRole('button', { name: '現在のシナリオを分析して', exact: true }).click();
  await page.locator('.message-assistant').waitFor();
  assert.ok((await page.locator('.message-assistant').innerText()).includes('20%'));
  await capture('ai-conversation');
  await page.getByRole('button', { name: '会話をクリア', exact: true }).click();
  await page.getByLabel('データについて質問', { exact: true }).fill('注意すべきリスクは？');
  await page.getByRole('button', { name: '質問を送信', exact: true }).click();
  await page.locator('.message-assistant').waitFor();
  assert.ok((await page.locator('.message-assistant').innerText()).includes('リスク'));
  await page.getByRole('button', { name: '接続設定', exact: true }).click();
  await page
    .getByLabel('API エンドポイント', { exact: true })
    .fill('http://unsafe.example/api/chat');
  await page.getByRole('button', { name: '接続設定を保存', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.ok((await page.getByRole('alert').innerText()).includes('https'));
  await page.getByRole('button', { name: 'デモを使う', exact: true }).click();
  results.push({
    story: 'AI scenario calculations, contextual demo answers, free text and endpoint validation',
    status: 'passed',
  });
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${base}/#/retail`);
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.waitForTimeout(1600);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.getByRole('button', { name: 'メニューを開く', exact: true }).click();
  await mobile.getByRole('link', { name: '金融 / 資産運用 04', exact: false }).click();
  await mobile.getByRole('heading', { name: 'Portfolio perspective.', exact: true }).waitFor();
  await mobile.screenshot({ path: 'public/captures/mobile-finance.png', fullPage: true });
  await mobile.goto(`${base}/#/ai`);
  await mobile.waitForTimeout(1000);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: 'public/captures/mobile-ai.png', fullPage: true });
  await mobile.close();
  results.push({ story: '390px mobile layout, navigation and AI overflow', status: 'passed' });
  assert.deepEqual(errors, []);
  await writeFile(
    'docs/browser-verification.json',
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        browser: await browser.version(),
        viewport: { width: 1440, height: 1100 },
        baseUrl: base,
        consoleErrors: errors,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ status: 'passed', results, consoleErrors: errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: 'docs/verification-failure.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
}
