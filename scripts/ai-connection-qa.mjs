import { chromium } from '@playwright/test';
import { createApi } from '../server/app.mjs';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
let received;
const api = createApi({
  apiKey: 'test-key',
  model: 'test-model',
  accessToken: 'integration-test-token',
  allowedOrigin: 'http://127.0.0.1:5173',
  generate: async (options) => {
    received = options.prompt;
    return { text: 'サーバー経由の接続確認に成功しました。これは検証用のモック応答です。' };
  },
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const endpoint = `http://127.0.0.1:${api.address().port}/api/chat`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/#/ai');
  await page.getByRole('button', { name: '接続設定', exact: true }).click();
  await page.getByLabel('API エンドポイント', { exact: true }).fill(endpoint);
  await page
    .getByLabel('接続用トークン（API_ACCESS_TOKEN）', { exact: true })
    .fill('integration-test-token');
  await page.getByRole('button', { name: '接続設定を保存', exact: true }).click();
  await page.getByRole('button', { name: '売上の状況を要約して', exact: true }).click();
  await page.locator('.message-assistant').waitFor();
  assert.ok((await page.locator('.message-assistant').innerText()).includes('モック応答'));
  assert.ok(received.includes('revenueMillionYen') && received.includes('demandPercent'));
  const localValues = await page.evaluate(() => Object.values(localStorage));
  assert.ok(!localValues.some((v) => v.includes('integration-test-token')));
  await page.getByRole('button', { name: '接続設定', exact: true }).click();
  await page.getByLabel('接続用トークン（API_ACCESS_TOKEN）', { exact: true }).fill('wrong-token');
  await page.getByRole('button', { name: '接続設定を保存', exact: true }).click();
  await page.getByLabel('データについて質問', { exact: true }).fill('リスクを教えて');
  await page.getByRole('button', { name: '質問を送信', exact: true }).click();
  assert.ok((await page.getByRole('alert').innerText()).includes('接続用トークン'));
  await writeFile(
    'docs/api-browser-verification.json',
    JSON.stringify(
      {
        status: 'passed',
        liveClaude: false,
        provider: 'mock',
        boundaries: [
          'Browser settings → local API with CORS',
          'token authentication',
          'current dataset and scenario → generation function',
          'JSON answer → UI',
          'bad token → visible error',
          'token absent from localStorage',
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    'Browser → API → mock generation → UI verified; auth error visible; token never persisted.',
  );
} finally {
  await browser.close();
  await new Promise((r) => api.close(r));
}
