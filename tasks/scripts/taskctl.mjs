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
  const requiredHeadings = [
    '## Agent assignment', '## Authority and context to read', '## Requirements and rules',
    '## Mandatory preflight and blocker protocol', '## Business-visible outcome', '## In scope',
    '## Explicitly excluded', '## Architectural boundaries and owned paths',
    '## Contract and incremental mock work', '## Implementation and UX requirements',
    '## Automated tests to add', '## Validation commands', '## Acceptance criteria',
    '## Completion, handoff and tracker update', '## Required final response',
  ];
  const phaseAcceptanceTasks = new Set([
    'D01-P01-T010', 'D01-P01-T012', 'D01-P02-T002', 'D01-P03-T004', 'D01-P04-T003',
    'D01-P05-T004', 'D01-P06-T005', 'D01-P07-T004', 'D01-P08-T004',
  ]);
  if (tasks.size !== 44) errors.push(`expected 44 task/gate files, found ${tasks.size}`);
  for (const task of tasks.values()) {
    for (const field of ['task_id', 'title', 'delivery', 'phase', 'estimate', 'model_tier', 'parallel_group', 'phase_branch', 'task_branch']) {
      if (!task[field]) errors.push(`${task.task_id || task.file}: missing ${field}`);
    }
    if (!Number.isFinite(task.execution_order)) errors.push(`${task.task_id}: invalid execution_order`);
    if (orders.has(task.execution_order)) errors.push(`${task.task_id}: execution_order duplicates ${orders.get(task.execution_order)}`);
    else orders.set(task.execution_order, task.task_id);
    if (!task.task_id.startsWith('INF-')) {
      const idMatch = task.task_id.match(/^D(\d{2})-P(\d{2})-/);
      const expectedPhaseBranch = idMatch ? `feat_delivery${idMatch[1]}_phase_${idMatch[2]}` : '';
      if (!idMatch || task.phase_branch !== expectedPhaseBranch) {
        errors.push(`${task.task_id}: phase_branch must be ${expectedPhaseBranch || 'derived from a DNN-PNN task ID'}`);
      }
      if (task.task_branch !== task.phase_branch) errors.push(`${task.task_id}: task_branch must equal phase_branch; task work stays on the phase branch`);
    } else if (task.phase_branch !== 'BRANCH_NEUTRAL' || task.task_branch !== 'BRANCH_NEUTRAL') {
      errors.push(`${task.task_id}: Phase 0 must be branch-neutral`);
    }
    if (!['allowed', 'forbidden'].includes(task.product_source_mutation)) errors.push(`${task.task_id}: invalid product_source_mutation`);
    if (task.task_id.startsWith('INF-') && task.product_source_mutation !== 'forbidden') errors.push(`${task.task_id}: Phase 0 must forbid product source mutation`);
    const body = readFileSync(task.file, 'utf8');
    for (const heading of requiredHeadings) if (!body.includes(heading)) errors.push(`${task.task_id}: missing section ${heading}`);
    if (!body.includes('### Blockers\nNone')) errors.push(`${task.task_id}: final response does not require Blockers: None`);
    if (!body.includes('Do not commit, push, create a PR, merge')) errors.push(`${task.task_id}: task must prohibit automatic Git history and remote operations`);
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
      if (!preflightSection.includes('Do not create or switch to a task-specific child branch')) errors.push(`${task.task_id}: preflight must forbid task-specific child branches`);
      if (!preflightSection.includes('git pull --ff-only origin delivery_01_public_website')) errors.push(`${task.task_id}: missing delivery-branch synchronization command`);
    }
    if (phaseAcceptanceTasks.has(task.task_id)) {
      if (!body.includes('## Phase branch and PR handoff')) errors.push(`${task.task_id}: missing phase PR handoff`);
      if (!body.includes('create a PR with base `delivery_01_public_website`')) errors.push(`${task.task_id}: missing delivery PR target`);
    }
    if (task.task_id.startsWith('D01-')) {
      const validationBody = body.match(/## Validation commands\n\n([\s\S]*?)(?=\n## )/)?.[1] || '';
      for (const command of ['- `corepack pnpm lint`', '- `corepack pnpm typecheck`', '- `corepack pnpm -r build`']) {
        if (!validationBody.includes(command)) errors.push(`${task.task_id}: validation commands must include ${command}`);
      }
      if (!body.includes('Root lint, TypeScript typecheck and recursive workspace builds pass')) {
        errors.push(`${task.task_id}: acceptance criteria missing root build/compiler requirement`);
      }
    }
    if (phaseAcceptanceTasks.has(task.task_id) && !body.includes('## Containerized verification')) {
      errors.push(`${task.task_id}: missing required containerized verification section`);
    }
    for (const dependency of task.dependencies) {
      if (!tasks.has(dependency)) errors.push(`${task.task_id}: missing dependency ${dependency}`);
      else if (tasks.get(dependency).execution_order >= task.execution_order) {
        errors.push(`${task.task_id}: dependency ${dependency} must have an earlier execution_order`);
      }
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

function sequenceBlockers(task, tasks) {
  const prior = [...tasks.values()]
    .filter((candidate) => candidate.execution_order < task.execution_order)
    .sort((a, b) => a.execution_order - b.execution_order);
  const unfinished = prior.filter((candidate) => !['COMPLETE', 'SUPERSEDED'].includes(rawStatus(candidate.task_id)));
  if (!unfinished.length) return [];

  const earliest = unfinished[0];
  const sameGroup = task.parallel_group && earliest.parallel_group === task.parallel_group;
  if (sameGroup && unfinished.every((candidate) => candidate.parallel_group === task.parallel_group
    && ['IN_PROGRESS', 'IN_REVIEW'].includes(rawStatus(candidate.task_id)))) {
    return [];
  }

  return [`execution frontier is ${earliest.task_id} (${rawStatus(earliest.task_id)}); complete it before starting ${task.task_id}`];
}

function prerequisiteBlockers(task, tasks, decisions, { includeSequence = true } = {}) {
  const blockers = [];
  const dirty = workingChanges();
  if (dirty.length) blockers.push(`uncommitted changes detected: ${dirty.join(', ')}. Commit the changes first, then rerun this task`);
  for (const dependency of task.dependencies) {
    if (rawStatus(dependency) !== 'COMPLETE') blockers.push(`dependency ${dependency} is ${rawStatus(dependency)}, not COMPLETE`);
  }
  for (const gate of task.decision_gates) {
    if (decisions.get(gate) !== 'RESOLVED') blockers.push(`decision ${gate} is ${decisions.get(gate) || 'MISSING'}, not RESOLVED`);
  }
  if (includeSequence) blockers.push(...sequenceBlockers(task, tasks));
  return blockers;
}

function precheck(id) {
  const { tasks, decisions } = validate({ quiet: true });
  const task = tasks.get(id);
  if (!task) die(`unknown task ${id}`);
  const blockers = prerequisiteBlockers(task, tasks, decisions);
  if (!task.task_id.startsWith('INF-') && !localBranchExists('delivery_01_public_website')) {
    blockers.push("required local delivery branch 'delivery_01_public_website' does not exist");
  }
  if (blockers.length) die(`${id} is blocked before branch preparation:\n- ${blockers.join('\n- ')}\nNo implementation started.`);
  console.log(`${id} prerequisite and clean-tree check passed. Blockers: None.`);
}

function check(id) {
  const { tasks, decisions } = validate({ quiet: true });
  const task = tasks.get(id);
  if (!task) die(`unknown task ${id}`);
  const blockers = prerequisiteBlockers(task, tasks, decisions);
  const branch = currentBranch();
  if (!task.task_id.startsWith('INF-') && branch !== task.phase_branch) {
    blockers.push(`current branch '${branch || '(detached)'}' is not the required phase branch '${task.phase_branch}'`);
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

function frontier(tasks) {
  return [...tasks.values()]
    .filter((task) => !['COMPLETE', 'SUPERSEDED'].includes(rawStatus(task.task_id)))
    .sort((a, b) => a.execution_order - b.execution_order)[0] || null;
}

function printSequence(id) {
  const { tasks, decisions } = validate({ quiet: true });
  const task = tasks.get(id);
  if (!task) die(`unknown task ${id}`);
  const blockers = [];
  for (const dependency of task.dependencies) {
    if (rawStatus(dependency) !== 'COMPLETE') blockers.push(`dependency ${dependency} is ${rawStatus(dependency)}, not COMPLETE`);
  }
  for (const gate of task.decision_gates) {
    if (decisions.get(gate) !== 'RESOLVED') blockers.push(`decision ${gate} is ${decisions.get(gate) || 'MISSING'}, not RESOLVED`);
  }
  blockers.push(...sequenceBlockers(task, tasks));
  const activeParallel = [...tasks.values()]
    .filter((candidate) => candidate.task_id !== task.task_id
      && candidate.parallel_group === task.parallel_group
      && ['IN_PROGRESS', 'IN_REVIEW'].includes(rawStatus(candidate.task_id)))
    .map((candidate) => candidate.task_id);
  console.log(`Task: ${task.task_id}`);
  console.log(`Status: ${rawStatus(task.task_id)}`);
  console.log(`Execution order: ${task.execution_order}`);
  console.log(`Parallel group: ${task.parallel_group}`);
  console.log(`Active same-group tasks: ${activeParallel.join(', ') || 'None'}`);
  console.log(`Result: ${blockers.length ? 'BLOCKED' : 'ELIGIBLE'}`);
  if (blockers.length) blockers.forEach((blocker) => console.log(`- ${blocker}`));
}

function printNext() {
  const { tasks, decisions } = validate({ quiet: true });
  const task = frontier(tasks);
  if (!task) {
    console.log('All tasks are COMPLETE or SUPERSEDED.');
    return;
  }
  console.log(`Execution frontier: ${task.task_id} — ${task.title}`);
  console.log(`Status: ${rawStatus(task.task_id)}`);
  const candidateBlockers = sequenceBlockers(task, tasks);
  const currentStatus = rawStatus(task.task_id);
  const sequentialResult = ['IN_PROGRESS', 'IN_REVIEW'].includes(currentStatus)
    ? 'WAITING_FOR_COMPLETE'
    : (candidateBlockers.length ? 'BLOCKED' : 'ELIGIBLE');
  console.log(`Sequential result: ${sequentialResult}`);
  const parallel = [...tasks.values()]
    .filter((candidate) => candidate.execution_order > task.execution_order
      && candidate.parallel_group === task.parallel_group
      && ['NOT_STARTED', 'READY', 'BLOCKED'].includes(rawStatus(candidate.task_id)))
    .filter((candidate) => sequenceBlockers(candidate, tasks).length === 0);
  console.log(`Optional same-group parallel tasks: ${parallel.map((candidate) => candidate.task_id).join(', ') || 'None'}`);
  if (candidateBlockers.length) candidateBlockers.forEach((blocker) => console.log(`- ${blocker}`));
  if (task.decision_gates.some((gate) => decisions.get(gate) !== 'RESOLVED')) console.log('- Decision gate is unresolved.');
}

function render() {
  const { tasks, decisions } = validate({ quiet: true });
  const currentFrontier = frontier(tasks);
  const frontierLabel = currentFrontier ? `${currentFrontier.task_id} — ${currentFrontier.title} (${rawStatus(currentFrontier.task_id)})` : 'All tasks are COMPLETE or SUPERSEDED';
  const optionalParallel = currentFrontier ? [...tasks.values()]
    .filter((candidate) => candidate.execution_order > currentFrontier.execution_order && candidate.parallel_group === currentFrontier.parallel_group && ['NOT_STARTED', 'READY', 'BLOCKED'].includes(rawStatus(candidate.task_id)))
    .filter((candidate) => sequenceBlockers(candidate, tasks).length === 0)
    .map((candidate) => candidate.task_id) : [];
  const ordered = [...tasks.values()].sort((a, b) => a.execution_order - b.execution_order || a.task_id.localeCompare(b.task_id));
  const rows = ordered.map((task) => {
    const log = loadLog(task.task_id);
    const link = relative(tasksRoot, task.file);
    const phaseBranch = task.task_id.startsWith('INF-') ? 'Branch-neutral' : `\`${task.phase_branch}\``;
    return `| [${task.task_id}](${link}) | ${task.title} | ${displayStatus(task, tasks, decisions)} | ${log?.owner || '—'} | ${phaseBranch} | ${task.dependencies.join(', ') || 'None'} | ${task.parallel_group} | ${log?.updated_at || '—'} |`;
  });
  const text = `# CarChief Task Execution Tracker\n\n> Generated by \`node tasks/scripts/taskctl.mjs render\`. Do not edit the task rows manually.\n\n## Status meanings\n\n- \`NOT_STARTED\`: prerequisites or decisions are incomplete.\n- \`READY\`: dependencies and decision gates are complete.\n- \`IN_PROGRESS\`: claimed by an implementer.\n- \`IN_REVIEW\`: implementation and automated tests await independent review.\n- \`COMPLETE\`: independently approved.\n- \`BLOCKED\`: work stopped and the execution log names the blocker.\n- \`SUPERSEDED\`: intentionally replaced by another approved task.\n\n## Tracker\n\n| ID | Task | Status | Owner | Phase branch | Dependencies | Parallel group | Last update |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Continuation rule\n\nThe next developer starts with this tracker, then reads the latest phase summary and the execution log for the task being continued. A task may start only after the clean-tree \`taskctl precheck\`, branch preparation and final \`taskctl check\` succeed.\n`;
  const frontierSection = `\n## Current execution frontier\n\n- Sequential next: ${frontierLabel}\n- Optional same-group parallel tasks: ${optionalParallel.join(', ') || 'None'}\n- Downstream work waits for COMPLETE or SUPERSEDED; IN_REVIEW is not complete.\n- Later tasks cannot be bypassed; use taskctl sequence TASK-ID for the exact blocker.\n\n`;
  const enrichedText = text.replace('## Continuation rule', `${frontierSection}## Continuation rule`)
    .replace('A task may start only after', 'Sequential execution is the default; optional parallel work is limited to an approved same-group task after the group frontier is active. Blocked tasks cannot be bypassed. The working tree must be clean before a task starts; commit any previous task changes manually before continuing. Agents never commit, push, create PRs or merge. A task may start only after');
  writeFileSync(trackerPath, enrichedText);
  console.log(`Rendered ${trackerPath}`);
}

const [command, id] = process.argv.slice(2);
if (!command) die('usage: taskctl.mjs <validate|next|sequence|precheck|check|start|block|submit|approve|render> [TASK-ID]');

if (command === 'validate') validate();
else if (command === 'next') printNext();
else if (command === 'sequence') printSequence(id);
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
