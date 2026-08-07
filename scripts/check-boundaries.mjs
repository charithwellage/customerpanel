import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsDir = join(root, 'apps');
const packagesDir = join(root, 'packages');

const errors = [];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.next') continue;
      files.push(...walk(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const frontendApps = ['public-web', 'customer-app', 'salesperson-app'];
const forbiddenImports = [
  'mock-api',
  'prisma',
  '@prisma/client',
  'firebase',
  'firebase/app',
  'firebase/auth',
  'firebase/firestore',
  '@google-cloud/firestore',
  '@supabase/supabase-js',
  'supabase',
];

function checkFrontendFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(root, filePath);

  for (const forbidden of forbiddenImports) {
    const importRegex = new RegExp(`from\\s+['"]([^'"]*${forbidden}[^'"]*)['"]`, 'g');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      errors.push(`${relPath}: forbidden import of '${match[1]}'`);
    }
  }

  // Check generated client import in features
  if (relPath.includes('/features/') && /from\s+['"].*generated\/schema.*['"]/.test(content)) {
    errors.push(`${relPath}: features must not import generated client directly; use service layer`);
  }

  // Check direct service import in routes
  if (relPath.includes('/routes/') && /from\s+['"].*services\/.*['"]/.test(content)) {
    errors.push(`${relPath}: routes must not import service modules directly; use feature hooks`);
  }

  // Check service import in ui package
  if (relPath.startsWith('packages/ui/') && /from\s+['"].*services\/.*['"]/.test(content)) {
    errors.push(`${relPath}: presentational ui components must not import service modules`);
  }
}

// 1. Check all frontend app source files
for (const appName of frontendApps) {
  const appPath = join(appsDir, appName, 'src');
  const files = walk(appPath);
  for (const file of files) {
    checkFrontendFile(file);
  }
}

// 2. Check all package source files
if (existsSync(packagesDir)) {
  const packageEntries = readdirSync(packagesDir, { withFileTypes: true });
  for (const pkgEntry of packageEntries) {
    if (pkgEntry.isDirectory()) {
      const pkgSrc = join(packagesDir, pkgEntry.name, 'src');
      const files = walk(pkgSrc);
      for (const file of files) {
        checkFrontendFile(file);
      }
    }
  }
}

// 3. Check env files for safe exposure
function checkEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(root, filePath);
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (/(SECRET|PRIVATE_KEY|PASS|PASSWORD|TOKEN)=.+/i.test(trimmed) && /NEXT_PUBLIC_|VITE_/.test(trimmed)) {
      errors.push(`${relPath}: sensitive key exposed under public env variable '${trimmed.split('=')[0]}'`);
    }
  }
}

checkEnvFile(join(appsDir, 'public-web', '.env.example'));
checkEnvFile(join(appsDir, 'customer-app', '.env.example'));
checkEnvFile(join(appsDir, 'salesperson-app', '.env.example'));

if (errors.length > 0) {
  console.error('Architecture Boundary Violations Detected:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
} else {
  console.log('All architecture boundary checks passed cleanly (0 violations found).');
}
