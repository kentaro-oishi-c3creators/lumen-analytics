import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyExports } from '../scripts/check-slide-exports.mjs';
test('HTML/PPTX exports match every source SVG and retain editable slide content', async () => {
  const result = await verifyExports();
  assert.equal(result.slideCount, 10);
  assert.equal(result.nativeTextCounts.length, 10);
  assert.ok(result.nativeTextCounts.every((n) => n >= 5));
  assert.ok(result.nativeTextCounts.reduce((a, b) => a + b, 0) >= 190);
  assert.ok(result.nativeShapeCounts.every((n) => n >= 5));
  assert.ok(result.files.html.bytes > 1000000);
  assert.ok(result.files.pptx.bytes > 100000);
});
