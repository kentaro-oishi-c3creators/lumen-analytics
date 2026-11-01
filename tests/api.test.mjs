import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../server/app.mjs';
const origin = 'https://example.github.io';
async function withServer(options, run) {
  const server = createApi(options);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}
const config = {
  apiKey: 'test-key-never-sent',
  model: 'test-model',
  accessToken: 'test-access-token',
  allowedOrigin: origin,
};
const request = (url, overrides = {}) =>
  fetch(url + '/api/chat', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-access-token',
    },
    body: JSON.stringify({ message: '売上を要約して', context: { revenue: 1200, region: '関東' } }),
    ...overrides,
  });
test('authenticated context reaches provider and answer returns', () =>
  withServer(
    {
      ...config,
      generate: async (options) => {
        assert.ok(options.prompt.includes('関東'));
        assert.ok(options.prompt.includes('1200'));
        assert.equal(options.model.modelId, 'test-model');
        assert.ok(options.maxOutputTokens <= 1400);
        return { text: '売上は1,200百万円です。' };
      },
    },
    async (url) => {
      const res = await request(url);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { answer: '売上は1,200百万円です。', source: 'claude' });
    },
  ));
test('origin and token protections prevent provider execution', () =>
  withServer(
    {
      ...config,
      generate: () => {
        throw new Error('must not call');
      },
    },
    async (url) => {
      const badOrigin = await request(url, { headers: { Origin: 'https://evil.example' } });
      assert.equal(badOrigin.status, 403);
      const badToken = await request(url, {
        headers: { Origin: origin, 'Content-Type': 'application/json' },
      });
      assert.equal(badToken.status, 401);
      const options = await request(url, { method: 'OPTIONS', body: undefined });
      assert.equal(options.status, 204);
      assert.equal(options.headers.get('access-control-allow-origin'), origin);
    },
  ));
test('missing config returns 503 and health does not expose credentials', () =>
  withServer({ apiKey: '', model: '', accessToken: '', allowedOrigin: origin }, async (url) => {
    assert.equal((await request(url)).status, 503);
    assert.deepEqual(await (await fetch(url + '/api/health')).json(), {
      status: 'ok',
      configured: false,
    });
  }));
test('invalid input and oversized payload never invoke provider', () =>
  withServer(
    {
      ...config,
      generate: () => {
        throw new Error('must not call');
      },
    },
    async (url) => {
      assert.equal((await request(url, { body: '{' })).status, 400);
      assert.equal(
        (await request(url, { body: JSON.stringify({ message: '', context: {} }) })).status,
        400,
      );
      assert.equal(
        (
          await request(url, {
            body: JSON.stringify({ message: 'x', context: { data: 'a'.repeat(22000) } }),
          })
        ).status,
        413,
      );
      assert.equal((await request(url, { method: 'GET', body: undefined })).status, 405);
    },
  ));
test('rate limit bounds calls and provider errors are sanitized', () =>
  withServer(
    {
      ...config,
      rateLimit: 1,
      generate: () => {
        throw new Error('secret-key-do-not-echo');
      },
    },
    async (url) => {
      const first = await request(url);
      assert.equal(first.status, 502);
      assert.ok(!(await first.text()).includes('secret-key'));
      const second = await request(url);
      assert.equal(second.status, 429);
      assert.ok(second.headers.get('retry-after'));
    },
  ));
