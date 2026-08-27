import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
  assert.match(result.stdout, /Validated 136 task\/gate files/);
});

test('next reports the current tracker frontier', () => {
  const result = run('next');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Execution frontier \[/);
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

test('completion evidence is a validate-time invariant, not only a complete-time check', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  // The evidence check must be callable without exiting, so validate can report it.
  assert.match(source, /function collectSelfReviewEvidenceErrors/);
  // ...and must actually be invoked from validate for every COMPLETE self_ai task,
  // so a hand-written COMPLETE log cannot bypass the gate the CLI would have applied.
  assert.match(source, /status === 'COMPLETE' && task\.review_mode === 'self_ai'/);
  // A marker string alone is not evidence: provenance must identify the runtime.
  assert.match(source, /Runtime provenance line naming a PID/);
  // The legacy grandfather set must stay explicit and frozen rather than open-ended.
  assert.match(source, /const legacyLogFormatTasks = new Set\(\[/);

  // The invariant must currently hold across the whole task set.
  const result = run('validate');
  assert.equal(result.status, 0, result.stderr);
});

test('a phase review cannot be submitted without a real review record', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  assert.match(source, /function requirePhaseReviewRecord/);
  assert.match(source, /requirePhaseReviewRecord\(id\);/);
  // The specific holes that let an empty record reach tech-lead approval.
  assert.match(source, /## Findings/);
  assert.match(source, /Result: Not recorded/);
  assert.match(source, /Full suite result:/);
});

test('the phase-review record accepts every documented Result form and rejects placeholders', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  const pattern = source.match(/if \(!\((\/\^\[#[^\n]*?)\)\.test\(log\.text\)\)/)?.[1]
    || source.match(/(\/\^\[#\\-\*\\s\][^\n]*?\/mi)/)?.[1];
  assert.ok(pattern, 'expected the Result: matcher to be present in taskctl.mjs');
  const body = pattern.replace(/^\//, '').replace(/\/mi$/, '');
  const re = new RegExp(body, 'mi');
  for (const accepted of ['- Result: PASS', '## Result: PASS', 'Result: FAIL', '**Result:** PASS']) {
    assert.ok(re.test(accepted), `expected the matcher to accept ${JSON.stringify(accepted)}`);
  }
  for (const rejected of ['- Result: Not recorded.', 'Results were mixed']) {
    assert.ok(!re.test(rejected), `expected the matcher to reject ${JSON.stringify(rejected)}`);
  }
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

test('Delivery 02 starts after Phase 1.9 acceptance while Phase 1.10 may reconcile independently', () => {
  // D02-P01-G001's dependency on Phase 1.9 acceptance is a static, state-independent
  // fact recorded in its frontmatter. The live `sequence` blocker text for it can no
  // longer appear once D01-P09-CODE_REVIEW reaches COMPLETE (as it now legitimately
  // has), so the durable fact is asserted directly rather than through a blocker
  // string that only exists while the dependency remains unmet.
  const foundationGate = readFileSync(new URL('../delivery_02/phase_01/D02-P01-G001.md', import.meta.url), 'utf8');
  assert.match(foundationGate, /dependencies: \["D01-P09-CODE_REVIEW"\]/);

  const result = run('sequence', 'D02-P01-G001');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Result: (BLOCKED|ELIGIBLE)/);
});

test('Delivery 02 uses protected lane frontiers and converges only after both lane reviews', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  const commerce = readFileSync(new URL('../delivery_02/phase_03/D02-P03-T001.md', import.meta.url), 'utf8');
  const logistics = readFileSync(new URL('../delivery_02/phase_07/D02-P07-G001.md', import.meta.url), 'utf8');
  const convergence = readFileSync(new URL('../delivery_02/phase_09/D02-P09-T001.md', import.meta.url), 'utf8');
  const foundation = readFileSync(new URL('../delivery_02/phase_01/D02-P01-T004.md', import.meta.url), 'utf8');

  assert.match(source, /D02-DASHBOARD-LOGISTICS/);
  assert.match(source, /D02-COMMERCE/);
  assert.match(source, /function laneDependencies/);
  assert.match(source, /D02-P06-CODE_REVIEW.*D02-P08-CODE_REVIEW/);
  assert.match(commerce, /dependencies: \["D02-P01-CODE_REVIEW"\]/);
  assert.match(logistics, /dependencies: \["D02-P01-CODE_REVIEW"\]/);
  assert.match(convergence, /D02-P06-CODE_REVIEW.*D02-P08-CODE_REVIEW/);
  assert.match(foundation, /Only this foundation task may modify shared route registration/);
});

test('Delivery 02 Phase 2.11 is optional and normal feature work has a focused matrix', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  const matrix = readFileSync(new URL('../delivery_02/D02_TEST_MATRIX.md', import.meta.url), 'utf8');
  const optional = readFileSync(new URL('../delivery_02/phase_11/D02-P11-T001.md', import.meta.url), 'utf8');

  assert.match(source, /D02-OPTIONAL-THEME/);
  assert.match(source, /--opt-in theme/);
  assert.match(matrix, /--workers=50%/);
  assert.match(matrix, /P2\.11 optional theme/);
  assert.match(optional, /optional: true|explicit start opt-in/);
  assert.match(optional, /D02_TEST_MATRIX\.md/);
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

test('Delivery 01 assumption reconciliation follows Public acceptance and may run in parallel with Delivery 02', () => {
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
  assert.ok(reconcileReview < customerStart, 'Phase 1.10 remains ordered after Public acceptance');
  const customerStartBody = readFileSync(new URL('../delivery_02/phase_01/D02-P01-G001.md', import.meta.url), 'utf8');
  assert.match(customerStartBody, /dependencies: \["D01-P09-CODE_REVIEW"\]/);
  assert.ok(reconcileReview < customerStart, 'execution-order presentation remains stable even though dependency-based lanes may overlap');
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

test('Delivery 01 assumption register rows are structurally complete and auditable', () => {
  const result = run('validate');
  assert.equal(result.status, 0, result.stderr);

  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  assert.match(source, /function validateAssumptionRegister/);
  assert.match(source, /validateAssumptionRegister\(errors\);/);

  // Independent structural check (not routed through taskctl's own parser): every
  // register row must carry all nine documented columns with no empty cell, and a
  // status taken from the register's own documented vocabulary.
  const registerPath = new URL('../delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md', import.meta.url);
  const registerSection = readFileSync(registerPath, 'utf8').match(/## Register\n([\s\S]*?)(?=\n## )/)?.[1] || '';
  const rows = registerSection.split('\n').filter((line) => /^\|\s*D01-ASM-\d{3}\s*\|/.test(line));
  assert.ok(rows.length >= 6, 'expected at least the six known D01-ASM-* rows');
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 9, `expected 9 columns in ${cells[0]}`);
    for (const cell of cells) assert.ok(cell.length > 0, `expected no empty cell in ${cells[0]}`);
    assert.match(cells[1], /^(ASSUMED|SKIPPED|CONFIRMED|SUPERSEDED)$/, `expected a valid status in ${cells[0]}`);
  }
});

test('no Delivery 01 Phase 1.5-1.9 task retains an unresolved requirement decision gate', () => {
  const source = readFileSync(new URL('./taskctl.mjs', import.meta.url), 'utf8');
  // The dynamic decision-gate guard now spans Phase 1.5 through Phase 1.10, not just
  // 1.5 and 1.10 in isolation.
  assert.match(source, /D01-P\(0\[5-9\]\|10\)-/);

  for (const phase of ['05', '06', '07', '08', '09']) {
    const dir = new URL(`../delivery_01/phase_${phase}/`, import.meta.url);
    const files = readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'CONTEXT.md');
    assert.ok(files.length, `expected task files in phase_${phase}`);
    for (const file of files) {
      const body = readFileSync(new URL(file, dir), 'utf8');
      assert.match(body, /decision_gates: \[\]/, `${file} must not retain a hard decision gate in Phase 1.5-1.9`);
    }
  }
});
