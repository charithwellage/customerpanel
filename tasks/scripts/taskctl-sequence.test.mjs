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
  assert.match(result.stdout, /Validated 42 task\/gate files/);
});

test('next reports the current tracker frontier', () => {
  const result = run('next');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Execution frontier:/);
});

test('a skipped future task is reported as blocked', () => {
  const result = run('sequence', 'D01-P01-T004');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Result: BLOCKED/);
  assert.match(result.stdout, /execution frontier is/);
});

test('taskctl contains strict dependency-order and cycle guards', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  assert.match(source, /dependency .*must have an earlier execution_order/);
  assert.match(source, /dependency cycle:/);
  assert.match(source, /sameGroup/);
});
