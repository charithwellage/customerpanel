#!/usr/bin/env node

/**
 * Read-only local diagnostic for the Playwright MCP UI-validation prerequisite.
 * It deliberately cannot prove that an already-created AI session received MCP
 * tools; the agent must perform the smoke check described in its output.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const pinnedPackage = '@playwright/mcp@0.0.79';
const expectedArgs = ['-y', pinnedPackage, '--browser', 'chromium'];
const checks = [];

function pass(label, detail) {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail) {
  checks.push({ ok: false, label, detail });
}

function command(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    throw new Error(detail || error.message);
  }
}

function readJson(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath} is missing`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function configuredServer(source, config) {
  const server = config?.mcpServers?.playwright;
  if (!server) {
    fail(source, 'Playwright server definition is missing.');
    return;
  }
  const args = server.args || [];
  if (server.command !== 'npx' || JSON.stringify(args) !== JSON.stringify(expectedArgs)) {
    fail(source, `Expected npx ${expectedArgs.join(' ')}; found ${server.command || 'missing'} ${(args || []).join(' ')}`);
    return;
  }
  pass(source, `Pinned ${pinnedPackage} Chromium server definition is aligned.`);
}

try {
  const codexVersion = command('codex', ['--version']);
  pass('Codex CLI', codexVersion);
} catch (error) {
  fail('Codex CLI', `${error.message}. Start a local Codex session only after the CLI is available on PATH.`);
}

try {
  const listing = command('codex', ['mcp', 'list']);
  const playwright = listing.split('\n').find((line) => /^playwright\s/.test(line));
  if (playwright?.includes('enabled')) pass('Codex MCP registration', playwright.replace(/\s+/g, ' ').trim());
  else fail('Codex MCP registration', 'No enabled playwright entry. With user approval run: codex mcp remove playwright; codex mcp add playwright -- npx -y @playwright/mcp@0.0.79 --browser chromium');
} catch (error) {
  fail('Codex MCP registration', error.message);
}

try {
  configuredServer('.mcp.json', readJson('.mcp.json'));
} catch (error) {
  fail('.mcp.json', error.message);
}

try {
  configuredServer('.agents/mcp_config.json', readJson('.agents/mcp_config.json'));
} catch (error) {
  fail('.agents/mcp_config.json', error.message);
}

const codexConfig = join(homedir(), '.codex', 'config.toml');
if (!existsSync(codexConfig)) {
  fail('Workspace trust', `${codexConfig} is missing; approve the workspace in a local Codex client.`);
} else {
  const escapedRoot = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trustPattern = new RegExp(`\\[projects\\.\\"${escapedRoot}\\"\\][\\s\\S]*?trust_level\\s*=\\s*\\"trusted\\"`);
  if (trustPattern.test(readFileSync(codexConfig, 'utf8'))) pass('Workspace trust', 'Current repository is trusted in ~/.codex/config.toml.');
  else fail('Workspace trust', 'Current repository is not marked trusted in ~/.codex/config.toml. Approve it in the local Codex client.');
}

try {
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor >= 22) pass('Node', process.version);
  else fail('Node', `${process.version}; CarChief requires Node 22 or later.`);
  const pnpmVersion = command('corepack', ['pnpm', '--version']);
  if (Number.parseInt(pnpmVersion.split('.')[0], 10) >= 9) pass('pnpm', pnpmVersion);
  else fail('pnpm', `${pnpmVersion}; CarChief requires pnpm 9 or later.`);
  pass('Playwright Test', command('corepack', ['pnpm', 'exec', 'playwright', '--version']));
  const browser = command('node', ['-e', "const { chromium } = require('@playwright/test'); const { existsSync } = require('node:fs'); const path = chromium.executablePath(); if (!existsSync(path)) process.exit(2); process.stdout.write(path);"]);
  pass('Chromium', browser);
} catch (error) {
  fail('Local browser tooling', `${error.message}. Run: corepack pnpm exec playwright install chromium`);
}

console.log('Playwright MCP readiness diagnostic');
console.log(`Workspace: ${root}`);
for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'} — ${check.label}: ${check.detail}`);
console.log('\nSession capability is intentionally not inferred from configuration.');
console.log('In a brand-new local Codex session from this workspace, perform all seven actions before claiming a UI task:');
console.log('navigate; accessibility snapshot; viewport resize; click/input; screenshot; console inspection; network inspection.');
console.log('If any browser tool is absent, do not start the UI task. Record the failed capability and resolve MCP registration/session loading first.');

if (checks.some((check) => !check.ok)) process.exitCode = 1;
