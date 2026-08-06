#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tasksRoot = join(root, 'tasks');
const logsRoot = join(tasksRoot, 'execution_logs');
const trackerPath = join(tasksRoot, 'TASK_EXECUTION_TRACKER.md');
const decisionPath = join(tasksRoot, 'DECISION_REGISTER.md');
const validStatuses = new Set([
  'NOT_STARTED', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETE', 'BLOCKED', 'SUPERSEDED',
]);

function die(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseList(value = '') {
  const text = value.trim();
  if (!text || text === '[]') return [];
  if (!text.startsWith('[') || !text.endsWith(']')) return [text.replace(/^['"]|['"]$/g, '')];
  return text.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function parseFrontmatter(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) die(`${file} has no YAML frontmatter`);
  const data = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const index = line.indexOf(':');
    if (index < 1) die(`${file} has unsupported frontmatter line: ${line}`);
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    data[key] = raw.startsWith('[') ? parseList(raw) : raw.replace(/^['"]|['"]$/g, '');
  }
  return data;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['templates', 'execution_logs', 'phase_summaries', 'scripts'].includes(entry.name)) return [];
      return walk(path);
    }
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

function loadTasks() {
  const tasks = new Map();
  const taskFiles = [
    ...walk(join(tasksRoot, 'infra_check')),
    ...walk(join(tasksRoot, 'delivery_01')),
  ];
  for (const file of taskFiles) {
    const data = parseFrontmatter(readFileSync(file, 'utf8'), file);
    if (!data.task_id) continue;
    if (tasks.has(data.task_id)) die(`duplicate task ID ${data.task_id}`);
    data.file = file;
    data.dependencies = Array.isArray(data.dependencies) ? data.dependencies : parseList(data.dependencies);
    data.decision_gates = Array.isArray(data.decision_gates) ? data.decision_gates : parseList(data.decision_gates);
    data.execution_order = Number(data.execution_order);
    tasks.set(data.task_id, data);
  }
  return tasks;
}

function loadDecisions() {
  if (!existsSync(decisionPath)) return new Map();
  const decisions = new Map();
  for (const line of readFileSync(decisionPath, 'utf8').split('\n')) {
    const match = line.match(/^\|\s*(DEC-[A-Z0-9-]+)\s*\|\s*(OPEN|RESOLVED|DEFERRED)\s*\|/);
    if (match) decisions.set(match[1], match[2]);
  }
  return decisions;
}

function loadLog(id) {
  const path = join(logsRoot, `${id}.md`);
  if (!existsSync(path)) return null;
  return { path, ...parseFrontmatter(readFileSync(path, 'utf8'), path), text: readFileSync(path, 'utf8') };
}

function rawStatus(id) {
  const log = loadLog(id);
  return log?.status || 'NOT_STARTED';
}

function displayStatus(task, tasks, decisions) {
  const status = rawStatus(task.task_id);
  if (status !== 'NOT_STARTED') return status;
  const depsReady = task.dependencies.every((id) => rawStatus(id) === 'COMPLETE');
  const gatesReady = task.decision_gates.every((id) => decisions.get(id) === 'RESOLVED');
  return depsReady && gatesReady ? 'READY' : 'NOT_STARTED';
}

function currentBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function workingChanges() {
  try {
    const output = execFileSync(
      'git',
      ['status', '--porcelain=v1', '--untracked-files=all'],
      { cwd: root, encoding: 'utf8' },
    );
    return output.split('\n').filter(Boolean).map((line) => line.slice(3).trim());
  } catch {
    return ['unable to inspect Git working tree'];
  }
}

function localBranchExists(branch) {
  try {
    execFileSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

function validate({ quiet = false } = {}) {
  const tasks = loadTasks();
  const decisions = loadDecisions();
  const errors = [];
  const orders = new Map();
  const branches = new Map();
  const requiredHeadings = [
    '## Agent assignment', '## Authority and context to read', '## Requirements and rules',
    '## Mandatory preflight and blocker protocol', '## Business-visible outcome', '## In scope',
    '## Explicitly excluded', '## Architectural boundaries and owned paths',
    '## Contract and incremental mock work', '## Implementation and UX requirements',
    '## Automated tests to add', '## Validation commands', '## Acceptance criteria',
    '## Completion, handoff and tracker update', '## Required final response',
  ];
  const phaseAcceptanceTasks = new Set([
    'D01-P01-T010', 'D01-P02-T002', 'D01-P03-T004', 'D01-P04-T003',
    'D01-P05-T004', 'D01-P06-T005', 'D01-P07-T004', 'D01-P08-T004',
  ]);
  if (tasks.size !== 42) errors.push(`expected 42 task/gate files, found ${tasks.size}`);
  for (const task of tasks.values()) {
    for (const field of ['task_id', 'title', 'delivery', 'phase', 'estimate', 'model_tier', 'parallel_group', 'phase_branch', 'task_branch']) {
      if (!task[field]) errors.push(`${task.task_id || task.file}: missing ${field}`);
    }
    if (!Number.isFinite(task.execution_order)) errors.push(`${task.task_id}: invalid execution_order`);
    if (orders.has(task.execution_order)) errors.push(`${task.task_id}: execution_order duplicates ${orders.get(task.execution_order)}`);
    else orders.set(task.execution_order, task.task_id);
    if (!task.task_id.startsWith('INF-')) {
      if (branches.has(task.task_branch)) errors.push(`${task.task_id}: task_branch duplicates ${branches.get(task.task_branch)}`);
      else branches.set(task.task_branch, task.task_id);
      const idMatch = task.task_id.match(/^D(\d{2})-P(\d{2})-/);
      const expectedPhaseBranch = idMatch ? `feat_delivery${idMatch[1]}_phase_${idMatch[2]}` : '';
      if (!idMatch || task.phase_branch !== expectedPhaseBranch) {
        errors.push(`${task.task_id}: phase_branch must be ${expectedPhaseBranch || 'derived from a DNN-PNN task ID'}`);
      }
    } else if (task.phase_branch !== 'BRANCH_NEUTRAL' || task.task_branch !== 'BRANCH_NEUTRAL') {
      errors.push(`${task.task_id}: Phase 0 must be branch-neutral`);
    }
    if (!['allowed', 'forbidden'].includes(task.product_source_mutation)) errors.push(`${task.task_id}: invalid product_source_mutation`);
    if (task.task_id.startsWith('INF-') && task.product_source_mutation !== 'forbidden') errors.push(`${task.task_id}: Phase 0 must forbid product source mutation`);
    const body = readFileSync(task.file, 'utf8');
    for (const heading of requiredHeadings) if (!body.includes(heading)) errors.push(`${task.task_id}: missing section ${heading}`);
    if (!body.includes('### Blockers\nNone')) errors.push(`${task.task_id}: final response does not require Blockers: None`);
    const preflightSection = body.match(/## Mandatory preflight and blocker protocol\n\n([\s\S]*?)(?=## Business-visible outcome)/)?.[1] || '';
    if (!preflightSection.trimStart().startsWith('1. **Before doing anything else**, run:')) errors.push(`${task.task_id}: clean-tree check is not the first preflight step`);
    if (!preflightSection.includes('git status --porcelain=v1 --untracked-files=all')) errors.push(`${task.task_id}: missing full clean-tree command`);
    if (!preflightSection.includes(`taskctl.mjs precheck ${task.task_id}`)) errors.push(`${task.task_id}: missing read-only precheck command`);
    if (!preflightSection.includes('Uncommitted changes detected. Commit the changes first, then rerun this task.\n   No implementation started.')) errors.push(`${task.task_id}: missing exact dirty-tree response`);
    if (task.task_id.startsWith('INF-')) {
      if (preflightSection.includes('git switch')) errors.push(`${task.task_id}: branch-neutral Phase 0 preflight must not switch branches`);
    } else {
      if (!preflightSection.includes(`refs/heads/${task.phase_branch}`)) errors.push(`${task.task_id}: missing conditional phase-branch lookup`);
      if (!preflightSection.includes(`git switch -c ${task.phase_branch}`)) errors.push(`${task.task_id}: missing phase-branch creation command`);
      if (!preflightSection.includes(`refs/heads/${task.task_branch}`)) errors.push(`${task.task_id}: missing conditional child-branch lookup`);
      if (!preflightSection.includes('git pull --ff-only origin delivery/01-public')) errors.push(`${task.task_id}: missing delivery-branch synchronization command`);
    }
    if (phaseAcceptanceTasks.has(task.task_id)) {
      if (!body.includes('## Phase branch and PR handoff')) errors.push(`${task.task_id}: missing phase PR handoff`);
      if (!body.includes('create a PR with base `delivery/01-public`')) errors.push(`${task.task_id}: missing delivery PR target`);
    }
    for (const dependency of task.dependencies) {
      if (!tasks.has(dependency)) errors.push(`${task.task_id}: missing dependency ${dependency}`);
    }
    for (const gate of task.decision_gates) {
      if (!decisions.has(gate)) errors.push(`${task.task_id}: unknown decision gate ${gate}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail = []) {
    if (visiting.has(id)) {
      errors.push(`dependency cycle: ${[...trail, id].join(' -> ')}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of tasks.get(id)?.dependencies || []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of tasks.keys()) visit(id);
  const corpus = [...tasks.values()].map((task) => readFileSync(task.file, 'utf8')).join('\n');
  for (let number = 1; number <= 24; number += 1) {
    const id = `PUB-${String(number).padStart(2, '0')}`;
    if (!corpus.includes(id)) errors.push(`task set does not assign or explicitly defer ${id}`);
  }
  for (const id of ['RULE-05', 'RULE-08', 'RULE-09', 'RULE-10', 'UV-3', 'UV-4']) {
    if (!corpus.includes(id)) errors.push(`task set is missing required rule/gate ${id}`);
  }
  for (const task of tasks.values()) {
    const status = rawStatus(task.task_id);
    if (!validStatuses.has(status)) errors.push(`${task.task_id}: invalid status ${status}`);
  }
  if (errors.length) die(errors.join('\n'));
  if (!quiet) console.log(`Validated ${tasks.size} task/gate files; dependency graph is complete and acyclic.`);
  return { tasks, decisions };
}

function prerequisiteBlockers(task, decisions) {
  const blockers = [];
  for (const dependency of task.dependencies) {
    if (rawStatus(dependency) !== 'COMPLETE') blockers.push(`dependency ${dependency} is ${rawStatus(dependency)}, not COMPLETE`);
  }
  for (const gate of task.decision_gates) {
    if (decisions.get(gate) !== 'RESOLVED') blockers.push(`decision ${gate} is ${decisions.get(gate) || 'MISSING'}, not RESOLVED`);
  }
  const dirty = workingChanges();
  if (dirty.length) {
    blockers.push(`uncommitted changes detected: ${dirty.join(', ')}. Commit the changes first, then rerun this task`);
  }
  return blockers;
}

function precheck(id) {
  const { tasks, decisions } = validate({ quiet: true });
  const task = tasks.get(id);
  if (!task) die(`unknown task ${id}`);
  const blockers = prerequisiteBlockers(task, decisions);
  if (!task.task_id.startsWith('INF-') && !localBranchExists('delivery/01-public')) {
    blockers.push("required local delivery branch 'delivery/01-public' does not exist");
  }
  if (blockers.length) die(`${id} is blocked before branch preparation:\n- ${blockers.join('\n- ')}\nNo implementation started.`);
  console.log(`${id} prerequisite and clean-tree check passed. Blockers: None.`);
}

function check(id) {
  const { tasks, decisions } = validate({ quiet: true });
  const task = tasks.get(id);
  if (!task) die(`unknown task ${id}`);
  const blockers = prerequisiteBlockers(task, decisions);
  const branch = currentBranch();
  if (!task.task_id.startsWith('INF-') && branch !== task.phase_branch && branch !== task.task_branch) {
    blockers.push(`current branch '${branch || '(detached)'}' is neither '${task.phase_branch}' nor '${task.task_branch}'`);
  }
  if (blockers.length) die(`${id} is blocked:\n- ${blockers.join('\n- ')}`);
  console.log(`${id} preflight metadata check passed. Blockers: None.`);
}

function replaceFrontmatterField(text, field, value) {
  const expression = new RegExp(`^${field}:.*$`, 'm');
  if (!expression.test(text)) die(`execution log is missing ${field}`);
  return text.replace(expression, `${field}: "${String(value).replaceAll('"', '\\"')}"`);
}

function writeLog(id, status, fields = {}) {
  mkdirSync(logsRoot, { recursive: true });
  const path = join(logsRoot, `${id}.md`);
  const task = loadTasks().get(id);
  let text;
  if (existsSync(path)) {
    text = readFileSync(path, 'utf8');
    text = replaceFrontmatterField(text, 'status', status);
    for (const [field, value] of Object.entries(fields)) text = replaceFrontmatterField(text, field, value);
  } else {
    text = `---\ntask_id: "${id}"\nstatus: "${status}"\nowner: "${fields.owner || ''}"\nreviewer: "${fields.reviewer || ''}"\nphase_branch: "${task?.phase_branch || ''}"\ntask_branch: "${task?.task_branch || ''}"\nstarted_at: "${status === 'IN_PROGRESS' ? new Date().toISOString() : ''}"\nupdated_at: "${new Date().toISOString()}"\nblocker: "${fields.blocker || ''}"\n---\n\n# ${id} Execution Log\n\n## Preflight\n\n- Blockers: None\n- Clean-tree command/result: Passed\n- Phase branch: ${task?.phase_branch || 'Not recorded'}\n- Child task branch: ${task?.task_branch || 'Not recorded'}\n- Baseline commands: Not recorded\n\n## Completed work\n\nNot recorded.\n\n## Tests executed\n\nNot recorded.\n\n## Decisions and deviations\n\nNone recorded.\n\n## Blockers\n\nNone.\n`;
  }
  if (status === 'BLOCKED' && fields.blocker) {
    const event = `\n## Blocker event — ${new Date().toISOString()}\n\n${fields.blocker}\n`;
    text = text.replace(/\n## Blockers\n\n[\s\S]*$/, `${event}\n## Blockers\n\n${fields.blocker}\n`);
    text = text.replace('- Blockers: None', `- Blockers: ${fields.blocker}`);
  } else if (status === 'IN_PROGRESS') {
    text = text.replace(/\n## Blockers\n\n[\s\S]*$/, '\n## Blockers\n\nNone.\n');
    text = text.replace(/- Blockers: .*$/m, '- Blockers: None');
  }
  text = replaceFrontmatterField(text, 'updated_at', new Date().toISOString());
  writeFileSync(path, text);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function render() {
  const { tasks, decisions } = validate({ quiet: true });
  const ordered = [...tasks.values()].sort((a, b) => a.execution_order - b.execution_order || a.task_id.localeCompare(b.task_id));
  const rows = ordered.map((task) => {
    const log = loadLog(task.task_id);
    const link = relative(tasksRoot, task.file);
    const phaseBranch = task.task_id.startsWith('INF-') ? 'Branch-neutral' : `\`${task.phase_branch}\``;
    return `| [${task.task_id}](${link}) | ${task.title} | ${displayStatus(task, tasks, decisions)} | ${log?.owner || '—'} | ${phaseBranch} | ${task.dependencies.join(', ') || 'None'} | ${task.parallel_group} | ${log?.updated_at || '—'} |`;
  });
  const text = `# CarChief Task Execution Tracker\n\n> Generated by \`node tasks/scripts/taskctl.mjs render\`. Do not edit the task rows manually.\n\n## Status meanings\n\n- \`NOT_STARTED\`: prerequisites or decisions are incomplete.\n- \`READY\`: dependencies and decision gates are complete.\n- \`IN_PROGRESS\`: claimed by an implementer.\n- \`IN_REVIEW\`: implementation and automated tests await independent review.\n- \`COMPLETE\`: independently approved.\n- \`BLOCKED\`: work stopped and the execution log names the blocker.\n- \`SUPERSEDED\`: intentionally replaced by another approved task.\n\n## Tracker\n\n| ID | Task | Status | Owner | Phase branch | Dependencies | Parallel group | Last update |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Continuation rule\n\nThe next developer starts with this tracker, then reads the latest phase summary and the execution log for the task being continued. A task may start only after the clean-tree \`taskctl precheck\`, branch preparation and final \`taskctl check\` succeed.\n`;
  writeFileSync(trackerPath, text);
  console.log(`Rendered ${trackerPath}`);
}

const [command, id] = process.argv.slice(2);
if (!command) die('usage: taskctl.mjs <validate|precheck|check|start|block|submit|approve|render> [TASK-ID]');

if (command === 'validate') validate();
else if (command === 'precheck') precheck(id);
else if (command === 'check') check(id);
else if (command === 'render') render();
else if (command === 'start') {
  check(id);
  if (!['NOT_STARTED', 'READY', 'BLOCKED'].includes(rawStatus(id))) die(`${id} cannot start from ${rawStatus(id)}`);
  const owner = option('--owner');
  if (!owner) die('start requires --owner <name>');
  writeLog(id, 'IN_PROGRESS', { owner, blocker: '' });
  render();
  console.log(`${id} is IN_PROGRESS (owner: ${owner}).`);
} else if (command === 'block') {
  const { tasks } = validate({ quiet: true });
  const reason = option('--reason');
  if (!id || !tasks.has(id) || !reason) die('block requires a valid TASK-ID --reason <text>');
  writeLog(id, 'BLOCKED', { blocker: reason });
  render();
  console.log(`${id} is BLOCKED: ${reason}`);
} else if (command === 'submit') {
  if (!id || !loadLog(id)) die('submit requires a started task with an execution log');
  if (rawStatus(id) !== 'IN_PROGRESS') die(`${id} cannot submit from ${rawStatus(id)}`);
  writeLog(id, 'IN_REVIEW');
  render();
  console.log(`${id} is IN_REVIEW.`);
} else if (command === 'approve') {
  const reviewer = option('--reviewer');
  const log = loadLog(id);
  if (!id || !log) die('approve requires a submitted task with an execution log');
  if (log.status !== 'IN_REVIEW') die(`${id} is ${log.status}, not IN_REVIEW`);
  if (!reviewer) die('approve requires --reviewer <name>');
  if (reviewer === log.owner) die('the task owner cannot approve their own task');
  writeLog(id, 'COMPLETE', { reviewer });
  render();
  console.log(`${id} is COMPLETE (reviewer: ${reviewer}).`);
} else die(`unknown command ${command}`);
