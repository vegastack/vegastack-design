#!/usr/bin/env node
// sync-changelog — the docs Changelog page is GENERATED from the root CHANGELOG.md.
// Injects the transformed changelog body between the CHANGELOG:START/END markers in
// apps/docs/content/docs/changelog.mdx. Edit CHANGELOG.md, never the injected region.
//
//   node tooling/sync-changelog.mjs           # write (idempotent)
//   node tooling/sync-changelog.mjs --check   # exit 1 if the page is out of sync (CI drift gate)
//
// Transform: drop the root file's H1 + intro (the page has its own frontmatter/intro);
// site-absolute links (https://design.vegastack.com/docs/...) become root-relative so
// lint-links validates them; commit links stay absolute.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'CHANGELOG.md');
const PAGE = join(ROOT, 'apps/docs/content/docs/changelog.mdx');
const START = '{/* CHANGELOG:START — generated from /CHANGELOG.md by tooling/sync-changelog.mjs. DO NOT EDIT. */}';
const END = '{/* CHANGELOG:END */}';

const check = process.argv.includes('--check');

const src = readFileSync(SRC, 'utf8');
// body = everything from the first "## [" heading (skip H1 + intro prose)
const firstEntry = src.indexOf('\n## [');
if (firstEntry === -1) {
  console.error('✗ sync-changelog: no "## [x.y.z]" entries found in CHANGELOG.md');
  process.exit(1);
}
let body = src.slice(firstEntry + 1).trim();
// site-absolute → root-relative (so lint-links checks them as internal pages)
body = body.replaceAll('https://design.vegastack.com/docs/', '/docs/');

const page = readFileSync(PAGE, 'utf8');
const s = page.indexOf(START);
const e = page.indexOf(END);
if (s === -1 || e === -1 || e < s) {
  console.error(`✗ sync-changelog: markers missing/misordered in ${PAGE}\n  expected "${START}" then "${END}"`);
  process.exit(1);
}
const next = page.slice(0, s + START.length) + '\n\n' + body + '\n\n' + page.slice(e);

if (check) {
  if (next !== page) {
    console.error('✗ sync-changelog --check: docs changelog page is OUT OF SYNC with /CHANGELOG.md.');
    console.error('  Fix: node tooling/sync-changelog.mjs   (then commit the page)');
    process.exit(1);
  }
  console.log('✓ sync-changelog: docs changelog page matches /CHANGELOG.md');
} else {
  if (next !== page) {
    writeFileSync(PAGE, next);
    console.log('✓ sync-changelog: docs changelog page regenerated from /CHANGELOG.md');
  } else {
    console.log('✓ sync-changelog: already in sync');
  }
}
