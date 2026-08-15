import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const matrixPath = new URL('../delivery_02/DELIVERY_02_COVERAGE_MATRIX.md', import.meta.url);

test('Delivery 02 Phase 2.9 disposition covers every CUST-01 through CUST-25 requirement', async () => {
  const matrix = await readFile(matrixPath, 'utf8');
  const disposition = matrix.slice(matrix.indexOf('## Phase 2.9 disposition'));
  for (let number = 1; number <= 25; number += 1) {
    const id = `CUST-${String(number).padStart(2, '0')}`;
    assert.match(disposition, new RegExp(`\\| ${id} \\| (DELIVERED|DEFERRED|REJECTED|OPEN)`), `${id} is missing a Phase 2.9 disposition`);
  }
  assert.match(disposition, /Business sign-off status: `OPEN`/);
  assert.match(disposition, /Compiled-only and negative-evidence disposition/);
  assert.match(disposition, /Delivery 03 prerequisites/);
});
