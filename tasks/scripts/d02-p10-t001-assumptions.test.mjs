import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const registerPath = new URL('../delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md', import.meta.url);
const trackerPath = new URL('../TASK_EXECUTION_TRACKER.md', import.meta.url);

function tableCells(line) {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

test('every Delivery 02 assumption row has complete evidence fields and reconciliation outcome', async () => {
  const register = await readFile(registerPath, 'utf8');
  const sourceTable = register.split('## Phase 2.10 reconciliation checklist', 1)[0];
  const rows = sourceTable.split('\n').filter((line) => /^\| D02-ASM-\d{3} \|/.test(line));
  assert.equal(rows.length, 7, 'expected the seven registered Delivery 02 assumptions');

  const statuses = new Set(['ASSUMED', 'SKIPPED', 'CONFIRMED', 'SUPERSEDED']);
  for (const row of rows) {
    const cells = tableCells(row);
    assert.equal(cells.length, 9, `unexpected register columns: ${row}`);
    assert.match(cells[0], /^D02-ASM-\d{3}$/);
    assert.ok(statuses.has(cells[1]), `${cells[0]} has an invalid status`);
    for (const [index, field] of [
      [2, 'affected task/requirement'],
      [3, 'date'],
      [4, 'safe default or skipped capability'],
      [5, 'rationale/API impact'],
      [6, 'tests'],
      [7, 'risk'],
      [8, 'Phase 2.10 outcome'],
    ]) {
      assert.ok(cells[index], `${cells[0]} is missing ${field}`);
    }
    assert.match(register, new RegExp(`\\| ${cells[0]} \\|`), `${cells[0]} is missing from reconciliation evidence`);
  }

  assert.match(register, /## Phase 2\.10 reconciliation checklist/);
  assert.match(register, /Business review checklist/);
});

test('all non-empty Phase 2.1–2.9 decision gates are completed gate tasks', async () => {
  const tracker = await readFile(trackerPath, 'utf8');
  const phaseRoot = new URL('../delivery_02/', import.meta.url);
  const phaseNames = (await readdir(phaseRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^phase_0[1-9]$/.test(entry.name))
    .map((entry) => entry.name);

  for (const phaseName of phaseNames) {
    const phaseUrl = new URL(`${phaseName}/`, phaseRoot);
    for (const entry of await readdir(phaseUrl, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const taskId = entry.name.replace(/\.md$/, '');
      const content = await readFile(new URL(entry.name, phaseUrl), 'utf8');
      const match = content.match(/^decision_gates:\s*\[(.+)\]$/m);
      if (!match || !match[1].trim()) continue;
      const trackerRow = tracker.split('\n').find((line) => line.includes(`| [${taskId}]`));
      assert.ok(trackerRow, `${taskId} is missing from the tracker`);
      assert.match(trackerRow, /\| COMPLETE \|/, `${taskId} retains an incomplete decision-gate task`);
    }
  }
});
