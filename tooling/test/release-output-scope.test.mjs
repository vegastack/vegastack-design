import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";

import { validateReleaseOutput } from "../verify-release-output-scope.mjs";

const scratches = [];
afterEach(() => {
  for (const path of scratches.splice(0))
    rmSync(path, { recursive: true, force: true });
});

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "release-output-scope-"));
  scratches.push(cwd);
  const write = (path, value) => {
    mkdirSync(join(cwd, path, ".."), { recursive: true });
    writeFileSync(join(cwd, path), value);
  };
  const git = (...args) => execFileSync("git", args, { cwd });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  write(".changeset/a.md", '---\n"@vegastack/ui": patch\n---\ntext\n');
  write(
    "packages/ui/registry/ui/button.tsx",
    "// @vegastack button@1 sha256-old\n\nexport const Button = 1;\n",
  );
  write(
    "packages/ui/package.json",
    '{"name":"@vegastack/ui","version":"1.0.0","dependencies":{"@vegastack/design":"^1"}}\n',
  );
  write(
    "AGENTS.md",
    "before\n<!-- NUMBERS:START -->\nold\n<!-- NUMBERS:END -->\nafter\n",
  );
  write("CHANGELOG.md", "old\n");
  write(
    "pnpm-lock.yaml",
    [
      "importers:",
      "  packages/design:",
      "    dependencies:",
      "      '@vegastack/design-tokens':",
      "        specifier: ^1.0.0",
      "        version: link:../design-tokens",
      "      lodash:",
      "        specifier: ^4.17.0",
      "        version: 4.17.21",
      "",
    ].join("\n"),
  );
  git("add", ".");
  git("commit", "-qm", "base");
  return { cwd, write, git, base: String(git("rev-parse", "HEAD")).trim() };
}

it("accepts only consumed changesets, versions, headers, numbers and changelogs", () => {
  const { cwd, write, git, base } = fixture();
  git("rm", "-q", ".changeset/a.md");
  write(
    "packages/ui/registry/ui/button.tsx",
    "// @vegastack button@2 sha256-new\n\nexport const Button = 1;\n",
  );
  write(
    "packages/ui/package.json",
    '{"name":"@vegastack/ui","version":"1.0.1","dependencies":{"@vegastack/design":"^2"}}\n',
  );
  write(
    "AGENTS.md",
    "before\n<!-- NUMBERS:START -->\nnew\n<!-- NUMBERS:END -->\nafter\n",
  );
  write("CHANGELOG.md", "new\n");
  expect(validateReleaseOutput({ base, cwd })).toEqual([]);
});

it("rejects runtime, package-policy, rulebook and non-deletion changes", () => {
  const { cwd, write, base } = fixture();
  write(".changeset/a.md", "edited\n");
  write(
    "packages/ui/registry/ui/button.tsx",
    "// @vegastack button@2 sha256-new\n\nexport const Button = 2;\n",
  );
  write(
    "packages/ui/package.json",
    '{"name":"@vegastack/ui","version":"1.0.1","private":false,"dependencies":{"@vegastack/design":"^2"}}\n',
  );
  write(
    "AGENTS.md",
    "changed\n<!-- NUMBERS:START -->\nnew\n<!-- NUMBERS:END -->\nafter\n",
  );
  write("tooling/evil.mjs", "export default true\n");
  write("apps/docs/public/r/evil.json", "{}\n");
  expect(validateReleaseOutput({ base, cwd })).toEqual([
    ".changeset/a.md: release may only delete consumed changesets",
    "AGENTS.md: release changed content outside the generated Numbers block",
    "apps/docs/public/r/evil.json: allowed release output must be modified in place, not ?",
    "packages/ui/package.json: release changed package metadata beyond versions/internal ranges",
    "packages/ui/registry/ui/button.tsx: release changed content beyond the provenance header",
    "tooling/evil.mjs: not an allowed generated release output",
  ]);
});

it("rejects a non-increasing version and deletion of the Changesets readme", () => {
  const { cwd, write, git, base } = fixture();
  write(".changeset/README.md", "authority\n");
  git("add", ".changeset/README.md");
  git("commit", "-qm", "add changeset readme");
  const nextBase = String(git("rev-parse", "HEAD")).trim();
  git("rm", "-q", ".changeset/a.md", ".changeset/README.md");
  write(
    "packages/ui/package.json",
    '{"name":"@vegastack/ui","version":"1.0.0","dependencies":{"@vegastack/design":"^2"}}\n',
  );
  expect(validateReleaseOutput({ base: nextBase, cwd })).toEqual([
    ".changeset/README.md: release must preserve the Changesets authority readme",
    "packages/ui/package.json: release version must increase by semver",
  ]);
  expect(base).not.toBe(nextBase);
});

it("rejects file-mode changes even when content is unchanged", () => {
  const { cwd, git, base } = fixture();
  chmodSync(join(cwd, "packages/ui/registry/ui/button.tsx"), 0o755);
  expect(validateReleaseOutput({ base, cwd })).toEqual([
    "release may not change file modes: mode change 100644 => 100755 packages/ui/registry/ui/button.tsx",
  ]);
});

it("accepts a lockfile refreshed only in its internal @vegastack ranges", () => {
  // `version-sync` rewrites `@vegastack/design`'s range on the Version PR, and
  // `version-packages` regenerates the lockfile so `--frozen-lockfile` still installs. That diff
  // is legitimate release output (docs/ledger/bugs.md, 2026-09-22).
  const { cwd, write, git, base } = fixture();
  git("rm", "-q", ".changeset/a.md");
  write(
    "pnpm-lock.yaml",
    [
      "importers:",
      "  packages/design:",
      "    dependencies:",
      "      '@vegastack/design-tokens':",
      "        specifier: ^2.0.0",
      "        version: link:../design-tokens",
      "      lodash:",
      "        specifier: ^4.17.0",
      "        version: 4.17.21",
      "",
    ].join("\n"),
  );
  git("add", ".");
  expect(validateReleaseOutput({ base, cwd })).toEqual([]);
});

it("rejects a lockfile that moved anything but its internal @vegastack ranges", () => {
  // The lockfile is where a new runtime path could hide, so allowing it wholesale would have been
  // the weakening. A third-party version that moves during a release is rejected.
  const { cwd, write, git, base } = fixture();
  git("rm", "-q", ".changeset/a.md");
  write(
    "pnpm-lock.yaml",
    [
      "importers:",
      "  packages/design:",
      "    dependencies:",
      "      '@vegastack/design-tokens':",
      "        specifier: ^2.0.0",
      "        version: link:../design-tokens",
      "      lodash:",
      "        specifier: ^4.17.0",
      "        version: 4.99.99",
      "",
    ].join("\n"),
  );
  git("add", ".");
  expect(validateReleaseOutput({ base, cwd })).toEqual([
    "pnpm-lock.yaml: release changed the lockfile beyond the internal @vegastack/* ranges",
  ]);
});
