#!/usr/bin/env node
// Author a patch: the recorded difference between pinned upstream and our canonical file.
//
//   pnpm upstream:diff <name>     (re)generate packages/ui/upstream/patches/<name>.patch and print it
//   pnpm upstream:diff --all      regenerate every existing patch, after an intentional edit sweep
//   pnpm upstream:diff --self-test
//
// THE HEADER IS THE POINT
//   A patch with no `# decisions:` line is refused, because a hunk nobody can trace to a row MK
//   marked **ours** is drift wearing a patch's clothes. On a first generation the header is written
//   with a `TODO` marker and the script exits 1 so the author fills it in; on a regeneration the
//   existing header is preserved verbatim and only the body is refreshed.
//
// THE DIFF FORMAT
//   `git diff --no-index --no-prefix --unified=3` over two temp directories named `a/` and `b/`,
//   which produces exactly the `a/<name>.tsx` / `b/<name>.tsx` paths `git apply` reverses with its
//   default `-p1`. Git owns unified diff; nothing here reimplements it.
//
// THE GENERATED PROVENANCE HEADER IS NOT DIFFED
//   `// @vegastack <name>@<version> sha256-<hash>` is written onto the canonical file by
//   `tooling/registry-header.mjs` and RE-WRITTEN on every release, because `version-packages` runs
//   `version-sync`. Encoding it in a patch made every patch churn on every version bump, and made
//   byte parity impossible to satisfy on a Version Packages PR. The canonical side is therefore
//   stripped before diffing, exactly as `verify-parity.mjs` strips both sides before comparing,
//   and `tooling/verify-headers.mjs` stays the one authority for the header itself.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

import { walk, relativeToRoot, fatal } from "../lib/fs.mjs";
import { stripProvenanceHeader } from "../registry-hash.mjs";
import {
  VENDOR,
  PATCHES,
  canonicalPath,
  patchPath,
  vendorComponent,
  parsePatch,
  unifiedDiff,
} from "./lib.mjs";

const PREFIX = "upstream:diff";

const TODO =
  "TODO — name the decision IDs from docs/plans/2026-09-18-shadcn-reset/decisions.md";

function generate(name) {
  const canonical = canonicalPath(name);
  if (!existsSync(join(VENDOR, "ui", `${name}.tsx`))) {
    fatal(
      PREFIX,
      `upstream ships no ui/${name}.tsx — this component is ours, not shared`,
    );
  }
  if (!existsSync(canonical))
    fatal(PREFIX, `${relativeToRoot(canonical)} does not exist`);

  const body = unifiedDiff(
    name,
    vendorComponent(name),
    stripProvenanceHeader(readFileSync(canonical, "utf8")),
  );
  const target = patchPath(name);

  if (body === "") {
    if (existsSync(target)) {
      rmSync(target);
      console.log(
        `${PREFIX}: ${name} now equals upstream — removed ${relativeToRoot(target)}`,
      );
    } else {
      console.log(`${PREFIX}: ${name} equals upstream — no patch needed`);
    }
    return 0;
  }

  const existing = existsSync(target)
    ? parsePatch(readFileSync(target, "utf8"))
    : null;
  const header = existing?.decisions?.length
    ? readFileSync(target, "utf8")
        .split("\n")
        .filter((l) => l.startsWith("#"))
        .join("\n") + "\n"
    : `# component: ${name}\n# decisions: ${TODO}\n# hunks:\n#   1: ${TODO}\n`;

  mkdirSync(PATCHES, { recursive: true });
  writeFileSync(target, header + body);
  console.log(header + body);

  if (!existing?.decisions?.length) {
    console.error(
      `${PREFIX}: wrote ${relativeToRoot(target)} with a placeholder header. ` +
        `Fill in \`# decisions:\` before committing — \`upstream:check\` refuses it as written.`,
    );
    return 1;
  }
  console.log(
    `${PREFIX}: OK — regenerated ${relativeToRoot(target)} (header preserved)`,
  );
  return 0;
}

function selfTest() {
  const failures = [];
  const claim = (label, ok) => {
    console.log(
      `${PREFIX}:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) failures.push(label);
  };

  const before = "one\ntwo\nthree\n";
  const after = "one\nTWO\nthree\n";
  const diff = unifiedDiff("demo", before, after);
  claim(
    "two identical files produce an empty diff",
    unifiedDiff("demo", before, before) === "",
  );
  claim(
    "a difference produces a unified diff",
    /^diff --git a\/demo\.tsx b\/demo\.tsx$/m.test(diff),
  );
  claim(
    "the diff carries the change",
    diff.includes("-two") && diff.includes("+TWO"),
  );
  claim(
    "the same inputs produce the same bytes",
    unifiedDiff("demo", before, after) === diff,
  );
  claim(
    "a header with no `# decisions:` line is not accepted as a header",
    parsePatch("# component: demo\n" + diff).decisions === null,
  );

  if (failures.length) {
    console.error(
      `${PREFIX}:selftest FAILED — ${failures.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log(`${PREFIX}:selftest OK — 5 claims observed`);
  return 0;
}

const argv = process.argv.slice(2);
if (argv.includes("--self-test")) {
  process.exit(selfTest());
} else if (argv.includes("--all")) {
  const names = existsSync(PATCHES)
    ? walk(PATCHES, { include: (rel) => rel.endsWith(".patch") }).map((p) =>
        basename(p, ".patch"),
      )
    : [];
  if (names.length === 0) console.log(`${PREFIX}: no patches to regenerate`);
  let code = 0;
  for (const name of names) code = generate(name) || code;
  process.exit(code);
} else {
  const name = argv.find((a) => !a.startsWith("-"));
  if (!name)
    fatal(PREFIX, "usage: pnpm upstream:diff <name> | --all | --self-test");
  process.exit(generate(name));
}
