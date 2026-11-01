import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const root = resolve('dist'),
  prefix = '/lumen-analytics/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) throw Error();
    const path = resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html',
    );
    if (path !== root && !path.startsWith(root + '/')) throw Error();
    const file = (await stat(path)).isDirectory() ? resolve(path, 'index.html') : path;
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  }),
  errors = [],
  failed = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => {
  if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() });
});
try {
  const url = `http://127.0.0.1:${server.address().port}${prefix}`;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  for (const route of ['retail', 'manufacturing', 'healthcare', 'finance', 'ai', 'story']) {
    await page.goto(url + '#/' + route);
    await page.locator('main h1').waitFor();
    if (route === 'story') await page.locator('.slide-img').evaluate((i) => i.decode());
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  await writeFile(
    'docs/pages-path-verification.json',
    JSON.stringify(
      {
        status: 'passed',
        basePath: prefix,
        productionBuild: true,
        realGitHubDeployment: false,
        routes: 6,
        pageErrors: errors,
        httpErrors: failed,
      },
      null,
      2,
    ),
  );
  console.log(
    'Production build under /lumen-analytics/: 6 routes, fonts, images and slides passed. No HTTP or page errors.',
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
