#!/usr/bin/env node
// Every script under tooling/ must at least RESOLVE every name it uses.
//
// WHY THIS EXISTS
//   `tooling/` holds ~70 scripts and only some of them run inside `pnpm lint`. The rest run in one
//   place each — `registry:verify-consume` in ci.yml and `gates:ship`, the audit harness by hand,
//   `vrt-review.mjs` at /ship. A script outside the lint chain can be broken outright and every
//   local gate stays green.
//
//   That is not hypothetical. On 2026-09-07 this branch's own fs-lib conversion put
//   `import { ROOT } from "./lib/fs.mjs";` INSIDE the `SIDECAR_SRC` template literal in
//   `verify-shadcn-consume.mjs`. The module was then left referencing an undefined `ROOT` and died
//   on its first line of work, while the sidecar received an import it cannot resolve. `pnpm lint`
//   passed; `pnpm release:preflight` caught it, at the far end of the chain.
//
// WHY NOT `node --check`, AND WHY NOT A DYNAMIC IMPORT
//   `node --check` parses. It reports this file as FINE (verified: the misplaced import is just
//   characters inside a string, and an unresolved module-scope identifier is a runtime
//   ReferenceError, not a syntax error). So a syntax sweep would have missed the exact defect it
//   would have been added for.
//   Importing each module would catch it, but almost every tooling script DOES ITS WORK on import —
//   importing them all would run the gates, spawn browsers and rewrite generated files.
//   So: TypeScript's binder over the same files, reporting only "cannot find name". No type
//   checking beyond identifier resolution — `strict` and `noImplicitAny` are off deliberately, and
//   these are `.mjs` files nobody annotates.
//
// COST
//   Measured 16-19s over the 69 tooling scripts on macOS ARM64, almost all of it TypeScript loading its default
//   library once. It sits in `lint:repo`, whose turbo inputs already include `tooling/**`, so it is
//   paid only when a tooling script actually changes and replays from cache otherwise.
//
// USAGE
//   node tooling/verify-tooling-imports.mjs              # check the tree
//   node tooling/verify-tooling-imports.mjs --self-test  # prove it rejects the 2026-09-07 defect

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

import { relativeToRoot, ROOT, walk } from "./lib/fs.mjs";

/** TS2304 "Cannot find name 'x'." · TS2552 "Cannot find name 'x'. Did you mean 'y'?" */
const UNRESOLVED_NAME = new Set([2304, 2552]);

const COMPILER_OPTIONS = {
  allowJs: true,
  checkJs: true,
  noEmit: true,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  // Identifier resolution only. Everything that would make this a TYPE check is off on purpose:
  // these are unannotated .mjs scripts and the goal is "this name exists", nothing more.
  strict: false,
  noImplicitAny: false,
  skipLibCheck: true,
  types: [],
};

/** Every problem in `files`: a syntax error, or a name nothing declares. */
export function problems(files) {
  const program = ts.createProgram(files, COMPILER_OPTIONS);
  const found = [];
  for (const file of files) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    const report = (diagnostic, kind) => {
      const { line } = source.getLineAndCharacterOfPosition(diagnostic.start);
      found.push(
        `${relativeToRoot(file)}:${line + 1} ${kind} — ` +
          ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      );
    };
    for (const diagnostic of program.getSyntacticDiagnostics(source))
      report(diagnostic, "syntax error");
    for (const diagnostic of program.getSemanticDiagnostics(source))
      if (UNRESOLVED_NAME.has(diagnostic.code))
        report(diagnostic, "unresolved name");
  }
  return found;
}

const toolingScripts = () =>
  walk(join(ROOT, "tooling"), { include: (rel) => rel.endsWith(".mjs") });

if (process.argv.includes("--self-test")) {
  // The 2026-09-07 defect, reduced: the import is inside the sidecar's template literal, so the
  // MODULE never binds ROOT. `node --check` accepts this file; this gate must not.
  const scratch = mkdtempSync(join(tmpdir(), "tooling-imports-"));
  try {
    const broken = join(scratch, "misplaced-import.mjs");
    writeFileSync(
      broken,
      [
        'import { join } from "node:path";',
        'const registryDir = join(ROOT, "apps/docs/public/r");',
        "const SIDECAR_SRC = `",
        'import { ROOT } from "./lib/fs.mjs";',
        "`;",
        "console.log(registryDir, SIDECAR_SRC);",
        "",
      ].join("\n"),
    );
    const found = problems([broken]);
    assert.ok(
      found.some((problem) =>
        /unresolved name — Cannot find name 'ROOT'/.test(problem),
      ),
      `the misplaced-import defect must be rejected, got: ${found.join(" | ") || "(nothing)"}`,
    );

    const clean = join(scratch, "correct-import.mjs");
    writeFileSync(
      clean,
      [
        'import { join } from "node:path";',
        "const ROOT = process.cwd();",
        'console.log(join(ROOT, "x"));',
        "",
      ].join("\n"),
    );
    assert.deepEqual(
      problems([clean]),
      [],
      "a module that declares what it uses must pass",
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  console.log(
    "✓ tooling-imports self-test: an import misplaced into a template literal is rejected, a " +
      "correct module passes",
  );
  process.exit(0);
}

const files = toolingScripts();
const found = problems(files);
if (found.length > 0) {
  console.error(
    `✗ tooling-imports: ${found.length} problem(s) across ${files.length} tooling script(s)`,
  );
  for (const problem of found) console.error(`  - ${problem}`);
  console.error(
    "\n  A tooling script outside the `pnpm lint` chain can be broken while every local gate stays " +
      "green. Fix the name, or import it.",
  );
  process.exit(1);
}
console.log(
  `✓ tooling-imports: ${files.length} tooling scripts parse and resolve every name they use`,
);
