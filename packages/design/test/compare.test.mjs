// Node test (no vitest in this package) for the registry post-write comparator's import handling.
// Run: node test/compare.test.mjs  (wired into `pnpm test` for @vegastack/design).
import assert from 'node:assert/strict';
import {
  compareFile,
  parseImportLine,
  isAliasedSpecifier,
  aliasCanonical,
  isSanctionedAliasRewrite,
  resolveTargetPath,
} from '../bin/verify-registry-item.mjs';
import { resolve } from 'node:path';

let passed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
}

const ALIAS_ROOTS = ['@/components', '#components', '~/components'];

// --- single-line import: alias rewrite is sanctioned (regression) ---
t('single-line import alias rewrite passes for every alias root', () => {
  for (const root of ALIAS_ROOTS) {
    const exp = `import { Button } from '@/components/ui/button';`;
    const act = `import { Button } from '${root}/ui/button';`;
    assert.deepEqual(compareFile(exp, act, 'x.tsx'), [], `root ${root}`);
  }
});

// --- MULTILINE import: closing line `} from '<spec>'` rewrite is sanctioned (Codex R6 bug) ---
const MULTILINE_EXPECTED = [
  `import {`,
  `  Command,`,
  `  CommandInput,`,
  `  CommandList,`,
  `} from '@/components/ui/command';`,
  ``,
  `export const x = 1;`,
].join('\n');

t('multiline import: closing-line specifier rewrite passes for every alias root', () => {
  for (const root of ALIAS_ROOTS) {
    const act = MULTILINE_EXPECTED.replace(`'@/components/ui/command'`, `'${root}/ui/command'`);
    assert.deepEqual(compareFile(MULTILINE_EXPECTED, act, 'command-consumer.tsx'), [], `root ${root}`);
  }
});

t('parseImportLine recognizes a multiline-import closing line', () => {
  const parsed = parseImportLine(`} from '@/components/ui/command';`);
  assert.ok(parsed, 'closing line should parse as an import');
  assert.equal(parsed.spec, '@/components/ui/command');
  assert.ok(isAliasedSpecifier(parsed.spec));
});

// --- CRITICAL (Codex R8): alias retargeting to a DIFFERENT module must FAIL ---
// shadcn rewrites only the alias ROOT SYMBOL (@/ ↔ # ↔ ~/); the category + path after it are
// invariant. A change that keeps an aliased form but repoints to a different target (same root or
// cross root) is tampering, not a rewrite, and must be rejected by the post-write verifier.
t('aliasCanonical strips only the root symbol (category+path preserved)', () => {
  assert.equal(aliasCanonical('@/components/ui/button'), 'components/ui/button');
  assert.equal(aliasCanonical('~/components/ui/button'), 'components/ui/button');
  assert.equal(aliasCanonical('#components/ui/button'), 'components/ui/button');
});

t('isSanctionedAliasRewrite: only root-symbol changes are sanctioned', () => {
  // legitimate — same category+path, different root symbol
  assert.equal(isSanctionedAliasRewrite('@/components/ui/button', '~/components/ui/button'), true);
  assert.equal(isSanctionedAliasRewrite('@/components/ui/button', '#components/ui/button'), true);
  // tampering — same root, different target
  assert.equal(isSanctionedAliasRewrite('@/components/ui/button', '@/components/ui/evil'), false);
  // tampering — cross root, different target
  assert.equal(isSanctionedAliasRewrite('@/components/ui/button', '~/components/ui/evil'), false);
  // tampering — cross category
  assert.equal(isSanctionedAliasRewrite('@/components/ui/button', '@/lib/button'), false);
});

t('SAME-ROOT alias retarget to a different module fails the comparator', () => {
  const exp = `import { Button } from '@/components/ui/button';`;
  const act = `import { Button } from '@/components/ui/evil';`;
  assert.notEqual(compareFile(exp, act, 'x.tsx').length, 0);
});

t('CROSS-ROOT alias retarget to a different module fails the comparator', () => {
  const exp = `import { Button } from '@/components/ui/button';`;
  const act = `import { Button } from '~/components/ui/evil';`;
  assert.notEqual(compareFile(exp, act, 'x.tsx').length, 0);
});

t('multiline closing-line retarget to a different module fails', () => {
  const act = MULTILINE_EXPECTED.replace(`'@/components/ui/command'`, `'~/components/ui/evil'`);
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, 'x.tsx').length, 0);
});

// --- tamper detection still fails (multiline context must not weaken it) ---
t('multiline import repointed to a NON-alias specifier fails', () => {
  const act = MULTILINE_EXPECTED.replace(`'@/components/ui/command'`, `'evil-pkg/command'`);
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, 'x.tsx').length, 0);
});

t('a tampered NON-import line inside a multiline-import file fails', () => {
  const act = MULTILINE_EXPECTED.replace(`export const x = 1;`, `export const x = 2; // exfil`);
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, 'x.tsx').length, 0);
});

t('a smuggled extra binding on the import-open line fails (open line compared literally)', () => {
  const act = MULTILINE_EXPECTED.replace(`  CommandList,`, `  CommandList, evilExfil,`);
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, 'x.tsx').length, 0);
});

t('line-count mismatch fails', () => {
  assert.notEqual(compareFile(MULTILINE_EXPECTED, MULTILINE_EXPECTED + '\nextra', 'x.tsx').length, 0);
});

// --- shadcn @ui/ target placeholder resolves via the consumer's components.json aliases (Codex R12) ---
t('resolveTargetPath: @ui/ placeholder resolves to the DEFAULT consumer ui dir', () => {
  const aliases = { ui: '@/components/ui', components: '@/components', lib: '@/lib', hooks: '@/hooks' };
  const got = resolveTargetPath({ target: '@ui/button.tsx' }, '/consumer', aliases);
  assert.equal(got, resolve('/consumer', 'components/ui', 'button.tsx'));
});

t('resolveTargetPath: @ui/ honors a NON-DEFAULT (src/components/ui) layout', () => {
  const aliases = { ui: 'src/components/ui', components: 'src/components' };
  const got = resolveTargetPath({ target: '@ui/button.tsx' }, '/consumer', aliases);
  assert.equal(got, resolve('/consumer', 'src/components/ui', 'button.tsx'));
});

t('resolveTargetPath: nested @ui/ subpath is preserved', () => {
  const aliases = { ui: '@/components/ui' };
  const got = resolveTargetPath({ target: '@ui/ai/prompt-input.tsx' }, '/c', aliases);
  assert.equal(got, resolve('/c', 'components/ui', 'ai/prompt-input.tsx'));
});

t('resolveTargetPath: falls back to strip-leading-segment when no alias map is known', () => {
  const got = resolveTargetPath({ target: '@ui/button.tsx' }, '/consumer', {});
  assert.equal(got, resolve('/consumer', 'ui/button.tsx'));
});

if (process.exitCode) {
  console.error('\n✗ compare.test.mjs: failures above');
} else {
  console.log(`✓ compare.test.mjs: ${passed} test(s) passed`);
}
