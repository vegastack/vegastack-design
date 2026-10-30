#!/usr/bin/env node
// Bound what the generated release commit may change (30-10-2026). release.yml runs this on the
// staged `version-packages` output BEFORE it mints the App token that bypasses the main ruleset, so a
// generator regression can never ride a release commit (which skips CI) into main.
//
//   node tooling/verify-release-commit.mjs     checks `git diff --cached`
//
// A path must match ALLOWED, and in source files every changed line must be a provenance header
// (`// @vegastack <item>@<version> sha256-…`); in docs pages only the `since:` frontmatter line.
import { spawnSync } from "node:child_process";

const ALLOWED = [
  /^\.changeset\/[^/]+\.md$/,
  /^(packages\/[^/]+\/)?CHANGELOG\.md$/,
  /^packages\/[^/]+\/package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^packages\/ui\/(registry|component-contracts)\.json$/,
  /^apps\/docs\/public\/r\/[^/]+\.json$/,
  /^apps\/docs\/content\/docs\/changelog\.mdx$/,
  /^docs\/ledger\/component-matrix\.md$/,
  /^docs\/research\/design-md-audit\/(audit-register|audits\/coverage)\.json$/,
  /^README\.md$/,
  /^skills\/public\/vegastack-design-system\/references\/components\.md$/,
  /^packages\/design\/skills\/vegastack-design-system\/references\/components\.md$/,
];
const HEADER_ONLY = [
  /^packages\/ui\/registry\/.+\.(tsx?|css)$/,
  /^apps\/docs\/components\/ui\/.+\.(tsx?|css)$/,
  /^apps\/docs\/lib\/[^/]+\.ts$/,
];
const SINCE_ONLY = [
  /^apps\/docs\/content\/docs\/(components|blocks)\/[^/]+\.mdx$/,
];
const HEADER_LINE = /^\/\/ @vegastack \S+@\d+\.\d+\.\d+ sha256-\S+$/;

const git = (...args) => {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  if (result.status !== 0)
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout;
};

const problems = [];
const files = git("diff", "--cached", "--name-only")
  .split("\n")
  .filter(Boolean);
for (const file of files) {
  const lineRule = HEADER_ONLY.some((re) => re.test(file))
    ? HEADER_LINE
    : SINCE_ONLY.some((re) => re.test(file))
      ? /^since: /
      : null;
  if (!lineRule) {
    if (!ALLOWED.some((re) => re.test(file)))
      problems.push(`${file}: not a release output`);
    continue;
  }
  const changed = git("diff", "--cached", "--unified=0", "--", file)
    .split("\n")
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line))
    .map((line) => line.slice(1));
  const bad = changed.find((line) => !lineRule.test(line));
  if (bad !== undefined)
    problems.push(
      `${file}: changes more than its release stamp (${JSON.stringify(bad.slice(0, 80))})`,
    );
}

if (problems.length) {
  console.error(
    `✗ verify-release-commit: ${problems.length} unexpected change(s)`,
  );
  for (const problem of problems.slice(0, 50)) console.error(`  ✗ ${problem}`);
  process.exit(1);
}
console.log(
  `✓ verify-release-commit: ${files.length} file(s), all release outputs`,
);
