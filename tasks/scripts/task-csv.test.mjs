import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../..', import.meta.url));
const header = ['Phase Number', 'Task Number', 'Task Summary', 'Dependent Task', 'AI Estimation (Luna Medium Hours)'];

function parseCsv(source) {
  const rows = [];
  let cell = '';
  let row = [];
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  return rows;
}

for (const [path, expectedRows] of [
  ['tasks/delivery_01/CarChief-Delivery-01-Tasks.csv', 54],
  ['tasks/delivery_02/CarChief-Delivery-02-Tasks.csv', 53],
]) {
  test(`${path} is an Excel-compatible UTF-8 BOM/LF CSV export`, () => {
    const raw = readFileSync(`${root}/${path}`, 'utf8');
    assert.equal(raw.startsWith('\uFEFF'), true, 'UTF-8 BOM is required for Excel import');
    assert.equal(raw.includes('\r'), false, 'use LF line endings to avoid Git whitespace failures');
    const rows = parseCsv(raw.slice(1));
    assert.deepEqual(rows[0], header);
    assert.equal(rows.length - 1, expectedRows);
    const ids = rows.slice(1).map((row) => row[1]);
    assert.equal(new Set(ids).size, expectedRows, 'task IDs must be unique');
  });
}
