#!/usr/bin/env node
// The completeness gate: every variant shadcn documents, we document — with a live preview.
//
//   node tooling/upstream/verify-variant-coverage.mjs
//   node tooling/upstream/verify-variant-coverage.mjs --self-test
//
// WHY IT EXISTS (mandate § 6.4, implementation.md § 3.4)
//   "We have that component" and "we have that component's variants" are different claims, and only
//   the second one is what a consumer coming from shadcn's docs actually needs. Drawer must carry
//   Snap Points; Button must carry Rounded and Spinner. Nothing else in this repository can notice
//   a section quietly not being ported, because a missing section is a page that still builds.
//
// THE SOURCE OF TRUTH IS OFFLINE
//   `vendor/<cli>/docs/<name>.json`, written by `pull.mjs` from upstream's own docs markdown. A
//   blocking gate that reaches the network is a gate that fails on a train, so the section list is
//   pinned with the components it describes.
//
// SCOPE
//   The enforced set `verify-parity.mjs` uses, and derived the same way: every component the pinned
//   upstream ships a `ui/<name>.tsx` for, minus the fileless items. There is no list to shorten.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { readJson, relativeToRoot } from "../lib/fs.mjs";
import { exportedPreviewFixtures } from "../affected-tests.mjs";
import {
  VENDOR,
  DOCS_PAGES,
  PREVIEW_BARREL,
  migrated,
  report,
} from "./lib.mjs";

const PREFIX = "upstream:variants";

/**
 * Sections that are not variants. `Installation`, `API Reference` and `Changelog` are named by the
 * plan; `Migrating from *` is upstream's advice to people leaving another library, which has no
 * counterpart on our pages.
 */
const NOT_A_VARIANT = (title) =>
  /^(installation|api reference|changelog)$/i.test(title) ||
  /^migrating from /i.test(title);

/** Compare titles the way a human would: case- and punctuation-insensitive, whitespace-collapsed. */
const normalise = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Our page, split into `## `/`### ` sections with the body that follows each. */
export function pageSections(markdown) {
  const out = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      current = { title: heading[2].trim(), body: [] };
      out.push(current);
      continue;
    }
    if (current) current.body.push(line);
  }
  return out.map((s) => ({ title: s.title, body: s.body.join("\n") }));
}

/** Every `name="…"` a `<ComponentPreview>` on the page requests. */
export function requestedPreviews(markdown) {
  return [
    ...markdown.matchAll(/<ComponentPreview\b[^>]*\bname=["']([^"']+)["']/g),
  ].map((m) => m[1]);
}

/** The union of every export the preview barrel re-exports, resolved through its `export *` lines. */
export function barrelExports(barrelPath, { cwd } = {}) {
  if (!existsSync(barrelPath)) return new Set();
  const modules = [
    ...readFileSync(barrelPath, "utf8").matchAll(
      /export \* from ["']\.\/([^"']+)["']/g,
    ),
  ].map((m) => m[1]);
  const names = new Set();
  const dir = barrelPath.slice(0, barrelPath.lastIndexOf("/"));
  for (const module of modules) {
    for (const name of exportedPreviewFixtures(
      join(dir, `${module}.tsx`),
      cwd ? { cwd } : {},
    )) {
      names.add(name);
    }
  }
  return names;
}

export function checkCoverage({
  docsCacheDir,
  pagesDir,
  barrelPath,
  names,
  cwd,
}) {
  const failures = [];
  const lines = [];
  const exports = barrelExports(barrelPath, { cwd });

  for (const name of [...names].sort()) {
    const cache = join(docsCacheDir, `${name}.json`);
    if (!existsSync(cache)) {
      failures.push(
        `${name}: no upstream docs cache at ${relativeToRoot(cache)} — re-run \`pnpm upstream:pull\``,
      );
      continue;
    }
    const required = readJson(cache).sections.filter((t) => !NOT_A_VARIANT(t));
    const page = join(pagesDir, `${name}.mdx`);
    if (!existsSync(page)) {
      failures.push(
        `${name}: no docs page at ${relativeToRoot(page)} (${required.length} sections required)`,
      );
      continue;
    }
    const markdown = readFileSync(page, "utf8");
    const sections = pageSections(markdown);
    const present = new Map(sections.map((s) => [normalise(s.title), s]));

    const missing = [];
    const withoutPreview = [];
    for (const title of required) {
      const section = present.get(normalise(title));
      if (!section) {
        missing.push(title);
        continue;
      }
      if (!/<ComponentPreview\b/.test(section.body)) withoutPreview.push(title);
    }

    for (const title of missing)
      failures.push(`${name}: missing section "${title}"`);
    for (const title of withoutPreview) {
      failures.push(`${name}: section "${title}" has no <ComponentPreview>`);
    }
    for (const requested of requestedPreviews(markdown)) {
      if (!exports.has(requested)) {
        failures.push(
          `${name}: <ComponentPreview name="${requested}" /> is not exported from the preview barrel`,
        );
      }
    }
    lines.push(
      `${name}: required ${required.length} · present ${required.length - missing.length}` +
        (missing.length ? ` · missing [${missing.join(", ")}]` : ""),
    );
  }

  return { failures, lines };
}

// ---------------------------------------------------------------------------------------------

function selfTest() {
  const failures = [];
  const claim = (label, ok) => {
    console.log(
      `${PREFIX}:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) failures.push(label);
  };

  const dir = mkdtempSync(join(tmpdir(), "vs-variants-"));
  const docsCacheDir = join(dir, "docs");
  const pagesDir = join(dir, "pages");
  const previewDir = join(dir, "components", "preview");
  for (const d of [docsCacheDir, pagesDir, previewDir])
    mkdirSync(d, { recursive: true });

  writeFileSync(
    join(docsCacheDir, "demo.json"),
    JSON.stringify({
      component: "demo",
      sections: [
        "Installation",
        "Usage",
        "Snap Points",
        "API Reference",
        "Migrating from Vaul",
      ],
    }),
  );
  writeFileSync(
    join(previewDir, "demo.tsx"),
    "export function demoUsage() { return null }\nexport function demoSnap() { return null }\n",
  );
  writeFileSync(join(previewDir, "index.tsx"), 'export * from "./demo";\n');
  const barrelPath = join(previewDir, "index.tsx");

  const GOOD = [
    "## Usage",
    '<ComponentPreview name="demoUsage" />',
    "",
    "## Snap Points",
    '<ComponentPreview name="demoSnap" />',
    "",
  ].join("\n");
  const base = {
    docsCacheDir,
    pagesDir,
    barrelPath,
    names: new Set(["demo"]),
    cwd: dir,
  };
  const run = () => checkCoverage(base).failures;

  writeFileSync(join(pagesDir, "demo.mdx"), GOOD);
  claim("a page carrying every upstream section PASSES", run().length === 0);

  writeFileSync(
    join(pagesDir, "demo.mdx"),
    GOOD.replace("## Snap Points", "## Something Else"),
  );
  claim(
    "a page missing an upstream section is rejected",
    run().some((f) => f.includes("Snap Points")),
  );

  writeFileSync(
    join(pagesDir, "demo.mdx"),
    GOOD.replace('<ComponentPreview name="demoSnap" />', "prose only"),
  );
  claim(
    "a section with no <ComponentPreview> is rejected",
    run().some((f) => f.includes("no <ComponentPreview>")),
  );

  writeFileSync(
    join(pagesDir, "demo.mdx"),
    GOOD.replace("demoSnap", "demoMissing"),
  );
  claim(
    "a preview the barrel does not export is rejected",
    run().some((f) => f.includes("not exported from the preview barrel")),
  );

  writeFileSync(
    join(pagesDir, "demo.mdx"),
    GOOD.replace("## Snap Points", "## snap-points"),
  );
  claim(
    "section titles compare case- and punctuation-insensitively",
    run().length === 0,
  );

  rmSync(join(pagesDir, "demo.mdx"));
  claim(
    "a migrated component with no docs page is rejected",
    run().some((f) => f.includes("no docs page")),
  );

  rmSync(dir, { recursive: true, force: true });

  if (failures.length) {
    console.error(
      `${PREFIX}:selftest FAILED — ${failures.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log(`${PREFIX}:selftest OK — 6 claims observed`);
  return 0;
}

if (process.argv.slice(2).includes("--self-test")) {
  process.exit(selfTest());
} else {
  const names = migrated();
  const { failures, lines } = checkCoverage({
    docsCacheDir: join(VENDOR, "docs"),
    pagesDir: DOCS_PAGES,
    barrelPath: PREVIEW_BARREL,
    names,
  });
  for (const line of lines) console.log(`${PREFIX}: ${line}`);
  process.exit(
    report(
      PREFIX,
      failures,
      `${names.size} migrated component(s) carry every upstream docs section`,
    ),
  );
}
