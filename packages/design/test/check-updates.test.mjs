// Node test (no vitest in this package) for `vegastack-design check-updates`.
// Run: node test/check-updates.test.mjs  (wired into `pnpm test` for @vegastack/design).
//
// Stubs global fetch (no network) and builds a throwaway consumer project on disk with copied-in
// component files carrying provenance headers, then drives main() and asserts the comparison,
// output shape, exit codes, env-expansion, index-url derivation, and config precedence.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../bin/check-updates.mjs';

let passed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.stack || e.message}`);
    process.exitCode = 1;
  }
}

process.env.TEST_TOKEN = 's3cr3t';

// ── stub fetch: serve a fixed index, record the last request ───────────────────────────────────
const BTN_OLD = 'sha256-AAAAbbbbCCCCddddEEEE1111++//==';
const BTN_NEW = 'sha256-ZZZZyyyyXXXXwwwwVVVV9999++//==';
const DLG_SAME = 'sha256-DLGdlgDLGdlg0000111122223333==';
const INDEX = {
  items: [
    { name: 'button', meta: { version: '0.2.0', integrity: BTN_NEW } },
    { name: 'dialog', meta: { version: '0.2.0', integrity: DLG_SAME } },
    // 'gone' intentionally absent → "missing"
  ],
};
let lastFetch = null;
globalThis.fetch = async (url, init) => {
  lastFetch = { url, headers: init?.headers ?? {} };
  return { ok: true, status: 200, statusText: 'OK', json: async () => INDEX };
};

// ── build a throwaway consumer project ───────────────────────────────────────────────────────────
function makeProject() {
  const root = mkdtempSync(join(tmpdir(), 'vega-cu-'));
  writeFileSync(
    join(root, 'components.json'),
    JSON.stringify({
      aliases: { ui: '@/components/ui' },
      registries: {
        '@vegastack': { url: 'https://example.test/r/{name}.json', headers: { 'X-Token': '${TEST_TOKEN}' } },
      },
    }),
  );
  const ui = join(root, 'components', 'ui');
  mkdirSync(ui, { recursive: true });
  // button: header hash differs from index → UPDATE
  writeFileSync(join(ui, 'button.tsx'), `// @vegastack button@0.1.0 ${BTN_OLD}\nexport const Button = () => null;\n`);
  // dialog: header hash matches index → CURRENT
  writeFileSync(join(ui, 'dialog.tsx'), `// @vegastack dialog@0.1.0 ${DLG_SAME}\nexport const Dialog = () => null;\n`);
  // gone: not in index → MISSING
  writeFileSync(join(ui, 'gone.tsx'), `// @vegastack gone@0.1.0 sha256-GONEgone000011112222==\nexport const Gone = () => null;\n`);
  // plain: no provenance header → ignored
  writeFileSync(join(ui, 'plain.tsx'), `export const Plain = () => null;\n`);
  return root;
}

// capture console output + return the exit code from main()
async function run(args) {
  const logs = [];
  const errs = [];
  const ol = console.log;
  const oe = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errs.push(a.join(' '));
  let code;
  try {
    code = await main(args);
  } finally {
    console.log = ol;
    console.error = oe;
  }
  return { code, out: logs.join('\n'), err: errs.join('\n') };
}

const root = makeProject();
try {
  await t('default run: reports update/current/missing, exit 0', async () => {
    lastFetch = null;
    const { code, out } = await run(['--cwd', root, '--no-color']);
    assert.equal(code, 0);
    assert.match(out, /button\s+0\.1\.0 → 0\.2\.0\s+update available/);
    // dialog's hash matches the index (content identical) → up to date, even though the GLOBAL
    // version bumped to 0.2.0. It shows the local version (0.1.0) — re-pulling yields identical bytes.
    assert.match(out, /dialog\s+0\.1\.0\s+up to date/);
    assert.match(out, /gone\s+0\.1\.0\s+not in registry/);
    assert.doesNotMatch(out, /plain/); // no header → ignored
    assert.match(out, /1 update\(s\) available/);
  });

  await t('index url derived ({name}->registry) + ${ENV} header expanded', async () => {
    await run(['--cwd', root, '--no-color']);
    assert.equal(lastFetch.url, 'https://example.test/r/registry.json');
    assert.equal(lastFetch.headers['X-Token'], 's3cr3t');
  });

  await t('--json: shape + counts + statuses', async () => {
    const { code, out } = await run(['--cwd', root, '--json']);
    assert.equal(code, 0);
    const j = JSON.parse(out);
    assert.equal(j.checked, 3);
    assert.equal(j.updates, 1);
    const by = Object.fromEntries(j.items.map((i) => [i.name, i.status]));
    assert.equal(by.button, 'update');
    assert.equal(by.dialog, 'current');
    assert.equal(by.gone, 'missing');
  });

  await t('--fail-on-update: exit 1 when stale', async () => {
    const { code } = await run(['--cwd', root, '--json', '--fail-on-update']);
    assert.equal(code, 1);
  });

  await t('--filter narrows the set', async () => {
    const { out } = await run(['--cwd', root, '--json', '--filter', 'button']);
    const j = JSON.parse(out);
    assert.equal(j.checked, 1);
    assert.equal(j.items[0].name, 'button');
  });

  await t('--registry overrides components.json (precedence)', async () => {
    await run(['--cwd', root, '--no-color', '--registry', 'https://other.test/r/{name}.json']);
    assert.equal(lastFetch.url, 'https://other.test/r/registry.json');
  });

  await t('no components found → exit 0 with message', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'vega-cu-empty-'));
    writeFileSync(join(empty, 'components.json'), JSON.stringify({ aliases: { ui: '@/components/ui' }, registries: { '@vegastack': 'https://example.test/r/{name}.json' } }));
    try {
      const { code, out } = await run(['--cwd', empty, '--no-color']);
      assert.equal(code, 0);
      assert.match(out, /No VegaStack components found/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  await t('.env.local is loaded for ${ENV} expansion (G1)', async () => {
    const p = mkdtempSync(join(tmpdir(), 'vega-cu-env-'));
    mkdirSync(join(p, 'components', 'ui'), { recursive: true });
    writeFileSync(join(p, '.env.local'), '# token\nCF_FROM_FILE="filevalue"\n');
    writeFileSync(
      join(p, 'components.json'),
      JSON.stringify({ aliases: { ui: '@/components/ui' }, registries: { '@vegastack': { url: 'https://example.test/r/{name}.json', headers: { 'X-Tok': '${CF_FROM_FILE}' } } } }),
    );
    writeFileSync(join(p, 'components', 'ui', 'button.tsx'), `// @vegastack button@0.1.0 ${BTN_OLD}\nx\n`);
    try {
      await run(['--cwd', p, '--json']);
      assert.equal(lastFetch.headers['X-Tok'], 'filevalue'); // expanded from .env.local, not process.env
    } finally {
      rmSync(p, { recursive: true, force: true });
    }
  });

  await t('src/ components dir fallback (G2)', async () => {
    const p = mkdtempSync(join(tmpdir(), 'vega-cu-src-'));
    mkdirSync(join(p, 'src', 'components', 'ui'), { recursive: true });
    writeFileSync(join(p, 'components.json'), JSON.stringify({ aliases: { ui: '@/components/ui' }, registries: { '@vegastack': 'https://example.test/r/{name}.json' } }));
    writeFileSync(join(p, 'src', 'components', 'ui', 'button.tsx'), `// @vegastack button@0.1.0 ${BTN_OLD}\nx\n`);
    try {
      const { out } = await run(['--cwd', p, '--json']);
      const j = JSON.parse(out);
      assert.equal(j.checked, 1); // found under src/ even though aliases.ui = @/components/ui
      assert.equal(j.items[0].name, 'button');
    } finally {
      rmSync(p, { recursive: true, force: true });
    }
  });

  await t('missing components.json without --registry/--dir → exit 2', async () => {
    const bare = mkdtempSync(join(tmpdir(), 'vega-cu-bare-'));
    try {
      const { code, err } = await run(['--cwd', bare]);
      assert.equal(code, 2);
      assert.match(err, /no components\.json/);
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(`check-updates.test: ${passed} passed`);
