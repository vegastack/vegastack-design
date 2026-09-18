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
// COUNTED BY OCCURRENCE, AND EACH ONE NEEDS ITS OWN PREVIEW (2026-09-18, Codex review of
// `main..HEAD`)
//   The first version keyed our sections by normalised title in a `Map`, so upstream's TWO distinct
//   `Custom Items` sections on `combobox` — one about `itemToStringValue` on object items, one about
//   rendering a custom component inside `ComboboxItem` — both matched our ONE heading and the gate
//   reported `required 15 · present 15` over a real gap. And "has a preview" meant the body
//   contained the TEXT `<ComponentPreview`, which a tag with no `name` satisfies as happily as a
//   working one. So: required titles are matched occurrence by occurrence in document order, a
//   section must carry a `<ComponentPreview>` with a `name` the barrel actually exports, and two
//   required occurrences may not answer with the same preview — a second copy of one example is
//   not a second variant.
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

/**
 * Every `<ComponentPreview>` opening tag in one section, as the name it requests or `null` when the
 * tag carries no `name` prop. `null` is the hollow preview the old text match accepted: a tag that
 * renders nothing is not a demonstration of a variant.
 */
export function sectionPreviews(body) {
  return [...body.matchAll(/<ComponentPreview\b[^>]*>/g)].map((match) => {
    const name = /\bname=["']([^"']+)["']/.exec(match[0]);
    return name ? name[1] : null;
  });
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

    // Our sections grouped by normalised title, in document order, so the Nth required occurrence
    // of a title is answered by the Nth section carrying it.
    const ours = new Map();
    for (const section of pageSections(markdown)) {
      const key = normalise(section.title);
      if (!ours.has(key)) ours.set(key, []);
      ours.get(key).push(section);
    }

    const consumed = new Map();
    const claimedBy = new Map();
    const missing = [];
    for (const title of required) {
      const key = normalise(title);
      const occurrence = consumed.get(key) ?? 0;
      consumed.set(key, occurrence + 1);
      const where = occurrence > 0 ? ` (occurrence ${occurrence + 1})` : "";
      const section = (ours.get(key) ?? [])[occurrence];

      if (!section) {
        missing.push(title + where);
        failures.push(`${name}: missing section "${title}"${where}`);
        continue;
      }

      const previews = sectionPreviews(section.body);
      if (previews.length === 0) {
        failures.push(
          `${name}: section "${title}"${where} has no <ComponentPreview>`,
        );
        continue;
      }
      if (previews.every((preview) => preview === null)) {
        failures.push(
          `${name}: section "${title}"${where} has a <ComponentPreview> with no name prop, ` +
            `which renders nothing`,
        );
        continue;
      }

      const own = previews.find(
        (preview) => preview !== null && !claimedBy.has(preview),
      );
      if (own === undefined) {
        failures.push(
          `${name}: section "${title}"${where} shows only previews another required section ` +
            `already shows (${previews
              .filter(Boolean)
              .map(
                (preview) => `"${preview}" under "${claimedBy.get(preview)}"`,
              )
              .join(", ")}) — each upstream section needs its own example`,
        );
        continue;
      }
      claimedBy.set(own, title + where);
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
    GOOD.replace(
      '<ComponentPreview name="demoSnap" />',
      "<ComponentPreview />",
    ),
  );
  claim(
    "a <ComponentPreview> with no name prop is rejected as hollow",
    run().some((f) => f.includes("no name prop")),
  );

  // ---- a REPEATED upstream section is counted by occurrence, and needs its own example ----
  //
  // This is the combobox shape: upstream's page carries `Custom Items` twice, about two different
  // things. A `Map` keyed by title collapsed them onto one heading and reported full coverage.
  writeFileSync(
    join(docsCacheDir, "twice.json"),
    JSON.stringify({
      component: "twice",
      sections: ["Installation", "Custom Items", "Usage", "Custom Items"],
    }),
  );
  writeFileSync(
    join(previewDir, "twice.tsx"),
    "export function twiceOne() { return null }\n" +
      "export function twiceTwo() { return null }\n" +
      "export function twiceUsage() { return null }\n",
  );
  writeFileSync(
    join(previewDir, "index.tsx"),
    'export * from "./demo";\nexport * from "./twice";\n',
  );
  const twice = { ...base, names: new Set(["twice"]) };
  const runTwice = () => checkCoverage(twice).failures;
  const ONE_HEADING = [
    "## Custom Items",
    '<ComponentPreview name="twiceOne" />',
    "",
    "## Usage",
    '<ComponentPreview name="twiceUsage" />',
    "",
  ].join("\n");

  writeFileSync(join(pagesDir, "twice.mdx"), ONE_HEADING);
  claim(
    "one heading cannot answer TWO upstream sections of the same title",
    runTwice().some((f) =>
      f.includes('missing section "Custom Items" (occurrence 2)'),
    ),
  );

  writeFileSync(
    join(pagesDir, "twice.mdx"),
    `${ONE_HEADING}\n## Custom Items\n<ComponentPreview name="twiceOne" />\n`,
  );
  claim(
    "a second heading that reuses the FIRST one's preview is rejected",
    runTwice().some((f) =>
      f.includes("each upstream section needs its own example"),
    ),
  );

  writeFileSync(
    join(pagesDir, "twice.mdx"),
    `${ONE_HEADING}\n## Custom Items\n<ComponentPreview name="twiceTwo" />\n`,
  );
  claim(
    "…and PASSES once the second heading shows its own example",
    runTwice().length === 0,
  );

  writeFileSync(join(previewDir, "index.tsx"), 'export * from "./demo";\n');

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
  console.log(`${PREFIX}:selftest OK — 10 claims observed`);
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
