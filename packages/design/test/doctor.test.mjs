// doctor — the retired-vocabulary scan must fail on what the shadcn reset deleted, and only on that.
//
// A retired utility compiles to nothing, so this scan is the only thing between a consumer and a
// page of headings silently rendered as body text (the Regent app carried 338 of them past every
// other check). The tests that matter are both halves: each retired spelling is reported with its
// file:line, and the look-alikes that are still legal — `--tag-*-subtle`, a project's OWN custom
// property, the ui alias directory `check-updates` owns, build output — are not.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const { main, scanRetiredVocabulary, uiAliasDirs } = await import(
  join(PKG, "bin/doctor.mjs")
);

let failures = 0;
const tmpRoots = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`  ✗ ${name}\n    ${error.message}`);
  }
}

function project(files) {
  const root = mkdtempSync(join(tmpdir(), "vegastack-doctor-test-"));
  tmpRoots.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(args) {
  const out = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => out.push(a.join(" "));
  try {
    return { code: main(args), output: out.join("\n") };
  } finally {
    console.log = log;
    console.error = err;
  }
}

const matches = (root, skipDirs = []) =>
  scanRetiredVocabulary(root, { skipDirs }).findings.map(
    (f) => `${f.file}:${f.line} ${f.match}`,
  );

console.log("doctor — retired vocabulary");

test("every retired utility, token and component import is reported with file:line", () => {
  const root = project({
    "src/page.tsx": [
      `import { IconButton } from "@/components/ui/icon-button";`,
      `import { Toaster } from "@/components/ui/sonner";`,
      `const Segmented = await import("../ui/segmented");`,
      `<h1 className="text-h1">Title</h1>`,
      `<p className="text-label text-label-sm text-mono-label text-strong">x</p>`,
      `<p className="md:text-display-lg">x</p>`,
      `<div className="bg-destructive-subtle hover:bg-success-subtle-hover border-warning-subtle" />`,
      `<div className="bg-foreground/(--alpha-hover) opacity-(--opacity-dim) z-(--z-toast)" />`,
      `<div className="shadow-overlay backdrop-blur-glass" />`,
    ].join("\n"),
    "src/app.css": `.x { box-shadow: var(--shadow-overlay); }`,
  });
  const found = matches(root);
  for (const expected of [
    "src/page.tsx:1 import …/icon-button",
    "src/page.tsx:2 import …/sonner",
    "src/page.tsx:3 import …/segmented",
    "src/page.tsx:4 text-h1",
    "src/page.tsx:5 text-label",
    "src/page.tsx:5 text-label-sm",
    "src/page.tsx:5 text-mono-label",
    "src/page.tsx:5 text-strong",
    "src/page.tsx:6 text-display-lg",
    "src/page.tsx:7 bg-destructive-subtle",
    "src/page.tsx:7 bg-success-subtle-hover",
    "src/page.tsx:7 border-warning-subtle",
    "src/page.tsx:8 --alpha-hover",
    "src/page.tsx:8 --opacity-dim",
    "src/page.tsx:8 --z-toast",
    "src/page.tsx:9 shadow-overlay",
    "src/page.tsx:9 backdrop-blur-glass",
    "src/app.css:1 --shadow-overlay",
  ]) {
    assert.ok(
      found.includes(expected),
      `missing ${expected} in\n${found.join("\n")}`,
    );
  }
  assert.equal(found.length, 18, found.join("\n"));
});

test("each finding carries the migration guide's replacement", () => {
  const root = project({
    "a.tsx": `<h2 className="text-h2 bg-info-subtle opacity-(--opacity-hint)" />`,
  });
  const hints = Object.fromEntries(
    scanRetiredVocabulary(root).findings.map((f) => [f.match, f.hint]),
  );
  assert.match(hints["text-h2"], /text-2xl font-semibold/);
  assert.match(hints["bg-info-subtle"], /bg-info\/10/);
  assert.equal(hints["--opacity-hint"], "opacity-70");
  assert.match(
    scanRetiredVocabulary(
      project({
        "b.css": `.x { z-index: var(--z-toast); color: var(--alpha-hover); }`,
      }),
    )
      .findings.map((f) => f.hint)
      .join("\n"),
    /^the literal \/7, e\.g\. bg-foreground\/7\nnothing — the Toast viewport sets its own z-60/,
  );
});

test("the look-alikes that are still legal are not reported", () => {
  const root = project({
    "src/ok.tsx": [
      `import { toast } from "sonner";`, // the npm package, not the retired registry item
      `import { Button } from "@/components/ui/button";`,
      `<div className="bg-tag-blue-subtle text-tag-blue-text text-3xl font-semibold" />`, // --tag-*-subtle is kept
      `<div className="context-h1 subtext-label" />`, // not a utility boundary
      `<div className="z-50 opacity-50 bg-foreground/10 shadow-md" />`,
    ].join("\n"),
    // A custom property the project DECLARES is the project's own, not a retired one.
    "src/theme.css": `:root { --z-header: 30; --alpha-brand: 0.4; }\n.h { z-index: var(--z-header); }`,
  });
  assert.deepEqual(matches(root), []);
});

test("the ui alias dir, node_modules and build output are skipped", () => {
  const retired = `<h1 className="text-h1" />`;
  const root = project({
    "components.json": JSON.stringify({ aliases: { ui: "@/components/ui" } }),
    "src/components/ui/card.tsx": retired,
    "node_modules/x/index.js": retired,
    ".next/static/chunk.js": retired,
    "dist/index.js": retired,
    "src/app/page.tsx": retired,
  });
  const skip = uiAliasDirs({ aliases: { ui: "@/components/ui" } }, root);
  assert.equal(skip.length, 1);
  assert.deepEqual(matches(root, skip), ["src/app/page.tsx:1 text-h1"]);
});

test("`doctor` fails with file:line when retired vocabulary is present, passes when clean", () => {
  const base = {
    "package.json": JSON.stringify({
      dependencies: { "@vegastack/design": "^0.7.0" },
    }),
    "postcss.config.mjs": `export default { plugins: { "@tailwindcss/postcss": {} } };`,
    "components.json": JSON.stringify({
      aliases: { ui: "@/components/ui" },
      registries: {
        "@vegastack": "https://design.vegastack.com/r/{name}.json",
      },
    }),
    "src/app/globals.css": `@import "@vegastack/design/preset.css";`,
    "src/components/ui/legacy.tsx": `<h1 className="text-h1" />`,
  };
  const clean = project({
    ...base,
    "src/app/page.tsx": `<h1 className="text-3xl font-semibold" />`,
  });
  const cleanRun = run(["--dir", clean]);
  assert.equal(cleanRun.code, 0, cleanRun.output);
  assert.match(cleanRun.output, /✓ no retired vocabulary/);

  const dirty = project({
    ...base,
    "src/app/page.tsx": `\n<h1 className="text-h1" />`,
  });
  const dirtyRun = run(["--dir", dirty]);
  assert.equal(dirtyRun.code, 1, dirtyRun.output);
  assert.match(
    dirtyRun.output,
    /✗ no retired vocabulary — 1 occurrence\(s\) in 1 file\(s\)/,
  );
  assert.match(
    dirtyRun.output,
    /src\/app\/page\.tsx:2 {2}text-h1 {2}→ {2}text-3xl font-semibold/,
  );
});

for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n✗ doctor: ${failures} test(s) failed`);
  process.exit(1);
}
console.log("\n✓ doctor: all tests passed");
