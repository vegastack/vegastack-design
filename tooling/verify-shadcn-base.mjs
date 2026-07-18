import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(repoRoot, 'apps/docs');

const result = spawnSync('pnpm', ['--dir', docsDir, 'exec', 'shadcn', 'info', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 60_000,
});

if (result.error) {
  console.error(`Failed to run shadcn info: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

let info;
try {
  info = JSON.parse(result.stdout);
} catch (error) {
  console.error('Failed to parse shadcn info JSON.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const base = info?.config?.base;
const componentDocs = info?.links?.components ?? '';
const uiSource = info?.links?.ui ?? '';

if (base !== 'base') {
  console.error(`Expected apps/docs shadcn base to resolve as "base"; got "${base}".`);
  process.exit(1);
}

if (componentDocs.includes('/radix/') || uiSource.includes('/bases/radix/')) {
  console.error('apps/docs shadcn links still point at Radix upstream sources.');
  process.exit(1);
}

console.log('apps/docs shadcn config resolves as Base UI.');
