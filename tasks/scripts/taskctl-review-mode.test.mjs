import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const script = fileURLToPath(new URL('./taskctl.mjs', import.meta.url));

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, TASKCTL_ROOT: root },
    encoding: 'utf8',
  });
}

function shell(root, ...args) {
  execFileSync(args[0], args.slice(1), { cwd: root, stdio: 'ignore' });
}

function taskIds(root, throughOrder) {
  const output = execFileSync(process.execPath, [script, 'validate'], {
    cwd: root,
    env: { ...process.env, TASKCTL_ROOT: root },
    encoding: 'utf8',
  });
  assert.match(output, /Validated 97 task\/gate files/);
  const ordered = readFileSync(join(root, 'tasks/EXECUTION_ORDER.md'), 'utf8')
    .split('\n')
    .map((line) => line.match(/^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]/))
    .filter(Boolean)
    .map((match) => ({ order: Number(match[1]), id: match[2] }));
  return ordered.filter((item) => item.order < throughOrder).map((item) => item.id);
}

function seedComplete(root, ids) {
  const logs = join(root, 'tasks/execution_logs');
  mkdirSync(logs, { recursive: true });
  for (const id of ids) {
    writeFileSync(join(logs, `${id}.md`), `---\ntask_id: "${id}"\nstatus: "COMPLETE"\nowner: "seed"\nreviewer: "seed"\nreview_agent: "seed"\nreview_mode: "self_ai"\nphase_branch: ""\ntask_branch: ""\nstarted_at: ""\nupdated_at: ""\nblocker: ""\n---\n\n# ${id}\n`);
  }
}

function setup(phaseBranch) {
  const root = mkdtempSync(join(tmpdir(), 'carchief-taskctl-'));
  cpSync(join(repositoryRoot, 'tasks'), join(root, 'tasks'), { recursive: true });
  rmSync(join(root, 'tasks/execution_logs'), { recursive: true, force: true });
  shell(root, 'git', 'init', '-q');
  shell(root, 'git', 'config', 'user.email', 'test@example.invalid');
  shell(root, 'git', 'config', 'user.name', 'Taskctl Test');
  shell(root, 'git', 'add', '.');
  shell(root, 'git', 'commit', '-qm', 'baseline');
  shell(root, 'git', 'branch', 'delivery_01_public_website');
  shell(root, 'git', 'branch', 'delivery_02_customer_application');
  shell(root, 'git', 'checkout', '-qb', phaseBranch);
  return root;
}

test('self-AI completion accepts legacy IN_REVIEW after recorded review and tests', () => {
  const root = setup('feat_delivery01_phase_01');
  try {
    seedComplete(root, taskIds(root, 16));
    shell(root, 'git', 'add', '.');
    shell(root, 'git', 'commit', '-qm', 'seed dependencies');
    assert.equal(run(root, 'start', 'D01-P01-T011', '--owner', 'agent').status, 0);
    const logPath = join(root, 'tasks/execution_logs/D01-P01-T011.md');
    let log = readFileSync(logPath, 'utf8');
    log = log.replace('status: "IN_PROGRESS"', 'status: "IN_REVIEW"')
      .replace('- Result: Not recorded.', '- Result: PASS')
      .replace('## Tests executed\n\nNot recorded.', '## Tests executed\n\n- `corepack pnpm test` — passed.');
    writeFileSync(logPath, log);
    const complete = run(root, 'complete', 'D01-P01-T011', '--review-agent', 'agent');
    assert.equal(complete.status, 0, complete.stderr);
    assert.match(complete.stdout, /COMPLETE after AI self-review/);
    assert.match(readFileSync(logPath, 'utf8'), /status: "COMPLETE"/);
    const reopen = run(root, 'reopen', 'D01-P01-T011', '--reason', 'phase finding');
    assert.equal(reopen.status, 0, reopen.stderr);
    assert.match(readFileSync(logPath, 'utf8'), /status: "IN_PROGRESS"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Delivery 02 phase review uses its customer integration branch', () => {
  const root = setup('feat_delivery02_phase_01');
  try {
    seedComplete(root, taskIds(root, 60));
    shell(root, 'git', 'add', '.');
    shell(root, 'git', 'commit', '-qm', 'seed customer phase');
    const start = run(root, 'start', 'D02-P01-CODE_REVIEW', '--owner', 'review-agent');
    assert.equal(start.status, 0, start.stderr);
    assert.equal(run(root, 'submit', 'D02-P01-CODE_REVIEW').status, 0);
    const approve = run(root, 'approve', 'D02-P01-CODE_REVIEW', '--reviewer', 'tech-lead');
    assert.equal(approve.status, 0, approve.stderr);
    assert.match(approve.stdout, /COMPLETE \(reviewer: tech-lead\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the Phase 1.2 final Playwright MCP task cannot complete without MCP and automated-browser evidence', () => {
  const root = setup('feat_delivery01_phase_02');
  try {
    seedComplete(root, taskIds(root, 23));
    shell(root, 'git', 'add', '.');
    shell(root, 'git', 'commit', '-qm', 'seed Phase 1.2 dependencies');
    assert.equal(run(root, 'start', 'D01-P02-T004', '--owner', 'agent').status, 0);
    const logPath = join(root, 'tasks/execution_logs/D01-P02-T004.md');
    let log = readFileSync(logPath, 'utf8')
      .replace('- Result: Not recorded.', '- Result: PASS')
      .replace('## Tests executed\n\nNot recorded.', '## Tests executed\n\n- Automated suite passed.');
    writeFileSync(logPath, log);
    const missing = run(root, 'complete', 'D01-P02-T004', '--review-agent', 'agent');
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /requires recorded Playwright MCP evidence/);

    log = readFileSync(logPath, 'utf8')
      .replace('- AI client: Not recorded.', '- AI client: Codex')
      .replace('- Target URL: Not recorded.', '- Target URL: http://127.0.0.1:3000')
      .replace('- Viewports: Not recorded.', '- Viewports: 390x844; 768x1024; 1440x900')
      .replace('- Themes: Not recorded.', '- Themes: carchief; ocean')
      .replace('- Console/network result: Not recorded.', '- Console/network result: PASS')
      .replace('- Findings and corrections: Not recorded.', '- Findings and corrections: None')
      .replace('- Playwright MCP Result: Not recorded.', '- Playwright MCP Result: PASS')
      .replace('- Automated Playwright Test Result: Not recorded.', '- Automated Playwright Test Result: PASS');
    writeFileSync(logPath, log);
    const complete = run(root, 'complete', 'D01-P02-T004', '--review-agent', 'agent');
    assert.equal(complete.status, 0, complete.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the MCP infrastructure gate cannot complete without a live MCP navigation proof', () => {
  const root = setup('planning');
  try {
    seedComplete(root, taskIds(root, 21));
    shell(root, 'git', 'add', '.');
    shell(root, 'git', 'commit', '-qm', 'seed completed work through Phase 1.2');
    assert.equal(run(root, 'start', 'INF-P00-T006', '--owner', 'agent').status, 0);
    const logPath = join(root, 'tasks/execution_logs/INF-P00-T006.md');
    const log = readFileSync(logPath, 'utf8')
      .replace('- Result: Not recorded.', '- Result: PASS')
      .replace('## Tests executed\n\nNot recorded.', '## Tests executed\n\n- Process checks passed.');
    writeFileSync(logPath, log);
    const complete = run(root, 'complete', 'INF-P00-T006', '--review-agent', 'agent');
    assert.notEqual(complete.status, 0);
    assert.match(complete.stderr, /requires recorded Playwright MCP readiness evidence/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a future task is blocked when an earlier task is incomplete', () => {
  const root = setup('feat_delivery01_phase_01');
  try {
    const result = run(root, 'sequence', 'D01-P01-T004');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Result: BLOCKED/);
    assert.match(result.stdout, /execution frontier is INF-P00-T001/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('phase review is the only task type submitted and approved by a tech lead', () => {
  const root = setup('feat_delivery01_phase_01');
  try {
    seedComplete(root, taskIds(root, 18));
    shell(root, 'git', 'add', '.');
    shell(root, 'git', 'commit', '-qm', 'seed phase');
    assert.equal(run(root, 'start', 'D01-P01-CODE_REVIEW', '--owner', 'review-agent').status, 0);
    const submit = run(root, 'submit', 'D01-P01-CODE_REVIEW');
    assert.equal(submit.status, 0, submit.stderr);
    const approve = run(root, 'approve', 'D01-P01-CODE_REVIEW', '--reviewer', 'tech-lead');
    assert.equal(approve.status, 0, approve.stderr);
    assert.match(approve.stdout, /COMPLETE \(reviewer: tech-lead\)/);
    const wrongMode = run(root, 'submit', 'D01-P01-T011');
    assert.notEqual(wrongMode.status, 0);
    assert.match(wrongMode.stderr, /self_ai task/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
