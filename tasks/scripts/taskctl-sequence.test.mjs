import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./taskctl.mjs', import.meta.url));

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

test('task metadata and dependency graph validate', () => {
  const result = run('validate');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 98 task\/gate files/);
});

test('next reports the current tracker frontier', () => {
  const result = run('next');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Execution frontier:/);
});

test('sequence reports an eligibility decision for the current tracker state', () => {
  const result = run('sequence', 'D01-P01-T004');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Result: (BLOCKED|ELIGIBLE)/);
});

test('taskctl contains strict dependency-order and cycle guards', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  assert.match(source, /dependency .*must have an earlier execution_order/);
  assert.match(source, /dependency cycle:/);
  assert.match(source, /sameGroup/);
  assert.match(source, /command === 'complete'/);
  assert.match(source, /command === 'reopen'/);
  assert.match(source, /phase_manual/);
  assert.match(source, /delivery_02_customer_application/);
  assert.match(source, /Delivery 02 task set does not assign/);
  assert.match(source, /Playwright MCP Result: PASS/);
  assert.match(source, /MCP browser navigation: PASS/);
  assert.match(source, /ui_validation/);
});

test('the late MCP infrastructure gate precedes the Phase 1.2 UI correction and review', () => {
  const source = readFileSync(new URL('../EXECUTION_ORDER.md', import.meta.url), 'utf8');
  assert.match(source, /\| 21 \| \[INF-P00-T006\]/);
  assert.match(source, /\| 22 \| \[D01-P02-T003\]/);
  assert.match(source, /\| 23 \| \[D01-P02-T004\]/);
  assert.match(source, /\| 24 \| \[D01-P02-T005\]/);
  assert.match(source, /\| 25 \| \[D01-P02-CODE_REVIEW\]/);
});

test('Delivery 02 starts only after the final Delivery 01 review gate', () => {
  const result = run('sequence', 'D02-P01-G001');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dependency D01-P08-CODE_REVIEW|execution frontier/);
});
