import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  data,
  configs,
  defaultFilters,
  groups,
  metrics,
  selectRows,
  series,
  sum,
  latest,
} from '../src/data.ts';
test('every filter slice preserves additive measures and group reconciliation', () => {
  for (const id of Object.keys(configs)) {
    assert.equal(data[id].length, 160);
    for (const period of ['ytd', 'quarter', 'month'])
      for (const region of ['すべて', ...configs[id].regions])
        for (const category of ['すべて', ...configs[id].categories]) {
          const rows = selectRows(id, { period, region, category });
          assert.ok(rows.length > 0);
          assert.ok(
            rows.every(
              (r) =>
                (region === 'すべて' || r.region === region) &&
                (category === 'すべて' || r.category === category),
            ),
          );
          const m = metrics(id, rows);
          assert.ok(Number.isFinite(m.actual) && Number.isFinite(m.growth));
          assert.ok(
            Math.abs(groups(rows, 'category', id).reduce((s, g) => s + g.actual, 0) - m.actual) <
              0.00001,
          );
          assert.ok(
            Math.abs(series(rows).reduce((s, p) => s + p.actual, 0) - sum(rows, 'actual')) < 0.1,
          );
        }
  }
});
test('finance balances use period end instead of summing snapshots', () => {
  const rows = selectRows('finance', defaultFilters);
  const m = metrics('finance', rows);
  assert.equal(m.actual, sum(latest(rows), 'actual'));
  assert.ok(m.actual < sum(rows, 'actual'));
  assert.equal(latest(selectRows('finance', { ...defaultFilters, period: 'quarter' }))[0].month, 9);
});
test('OEE reconciles to factors and healthcare waits use visit weighting', () => {
  const factory = metrics('manufacturing', data.manufacturing);
  assert.equal(factory.oee, (factory.availability * factory.performance * factory.quality) / 10000);
  const rows = data.healthcare,
    m = metrics('healthcare', rows);
  const expected = rows.reduce((s, r) => s + r.wait * r.actual, 0) / sum(rows, 'actual');
  assert.equal(m.wait, expected);
  assert.ok(m.volume < m.actual);
});
