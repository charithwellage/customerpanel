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
  assert.match(result.stdout, /Validated 110 task\/gate files/);
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
  assert.match(source, /COMMON_FRONTEND_RULES\.md/);
  assert.match(source, /must not retain an unresolved requirement decision gate/);
});

test('future frontend tasks use the shared frontend convention source', () => {
  const rules = readFileSync(new URL('../COMMON_FRONTEND_RULES.md', import.meta.url), 'utf8');
  const phaseTask = readFileSync(new URL('../delivery_01/phase_03/D01-P03-T002.md', import.meta.url), 'utf8');
  const customerTask = readFileSync(new URL('../delivery_02/phase_01/D02-P01-T001.md', import.meta.url), 'utf8');
  assert.match(rules, /Static styles do not belong/);
  assert.match(rules, /Do not use static `style=\{\{\.\.\.\}\}`/);
  assert.match(phaseTask, /COMMON_FRONTEND_RULES\.md/);
  assert.match(customerTask, /COMMON_FRONTEND_RULES\.md/);
});

test('the late MCP infrastructure gate precedes the Phase 1.2 UI correction and review', () => {
  const source = readFileSync(new URL('../EXECUTION_ORDER.md', import.meta.url), 'utf8');
  assert.match(source, /\| 21 \| \[INF-P00-T006\]/);
  assert.match(source, /\| 22 \| \[D01-P02-T003\]/);
  assert.match(source, /\| 23 \| \[D01-P02-T004\]/);
  assert.match(source, /\| 24 \| \[D01-P02-T005\]/);
  assert.match(source, /\| 25 \| \[D01-P02-T006\]/);
  assert.match(source, /\| 26 \| \[D01-P02-CODE_REVIEW\]/);
});

test('Delivery 02 starts only after the final Delivery 01 review gate', () => {
  const result = run('sequence', 'D02-P01-G001');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dependency D01-P08-CODE_REVIEW|execution frontier/);
});

test('Delivery 02 assumption reconciliation follows Customer acceptance', () => {
  const source = readFileSync(new URL('../EXECUTION_ORDER.md', import.meta.url), 'utf8');
  assert.match(source, /\[D02-P10-T001\].*D02-P09-CODE_REVIEW/);
  assert.match(source, /\[D02-P10-CODE_REVIEW\]/);
});

test('Delivery 01 requirement gaps are documented rather than used as unresolved execution gates', () => {
  const register = readFileSync(new URL('../delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md', import.meta.url), 'utf8');
  assert.match(register, /D01-ASM-001/);
  assert.match(register, /Requirement uncertainty alone is never a `taskctl` blocker/);
  // A Finance-owned figure must never be presented as a safe default.
  assert.match(register, /never `ASSUMED`/);

  // Every Phase 1.5 task carries the gap instead of a hard decision gate.
  for (const file of ['D01-P05-G001', 'D01-P05-T001', 'D01-P05-T002', 'D01-P05-T003', 'D01-P05-T004']) {
    const body = readFileSync(new URL(`../delivery_01/phase_05/${file}.md`, import.meta.url), 'utf8');
    assert.match(body, /decision_gates: \[\]/, `${file} must not retain a hard decision gate`);
    assert.match(body, /REQUIREMENT_GAPS_AND_ASSUMPTIONS\.md/, `${file} must reference the gap register`);
  }
});

test('Delivery 01 assumption reconciliation follows Public acceptance and precedes Delivery 02', () => {
  const order = (id, phase) => {
    const body = readFileSync(new URL(`../delivery_01/phase_${phase}/${id}.md`, import.meta.url), 'utf8');
    return Number(body.match(/^execution_order: (\S+)$/m)[1]);
  };
  const publicReview = order('D01-P09-CODE_REVIEW', '09');
  const reconcileStart = order('D01-P10-T001', '10');
  const reconcileReview = order('D01-P10-CODE_REVIEW', '10');
  const customerStart = Number(
    readFileSync(new URL('../delivery_02/phase_01/D02-P01-G001.md', import.meta.url), 'utf8')
      .match(/^execution_order: (\S+)$/m)[1],
  );

  assert.ok(publicReview < reconcileStart, 'Phase 1.10 must follow Phase 1.9 acceptance');
  assert.ok(reconcileStart < reconcileReview, 'Phase 1.10 review must be last in its phase');
  assert.ok(reconcileReview < customerStart, 'Phase 1.10 must gate the start of Delivery 02');
});

test('Delivery 02 requirement gaps are documented rather than used as unresolved execution gates', () => {
  const dashboard = readFileSync(new URL('../delivery_02/phase_02/D02-P02-G001.md', import.meta.url), 'utf8');
  const documents = readFileSync(new URL('../delivery_02/phase_07/D02-P07-CODE_REVIEW.md', import.meta.url), 'utf8');
  const register = readFileSync(new URL('../delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md', import.meta.url), 'utf8');
  assert.match(dashboard, /decision_gates: \[\]/);
  assert.match(documents, /decision_gates: \[\]/);
  assert.match(register, /D02-ASM-001/);
  assert.match(register, /Requirement uncertainty alone is never a `taskctl` blocker/);
});
