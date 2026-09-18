import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  collectWorkingTreeChanges,
  collectRangeChanges,
  createAffectedPlan,
  exportedPreviewFixtures,
  parseNameStatus,
  reverseClosure,
  validateAffectedPolicy,
} from "../affected-tests.mjs";
import { ROOT, readJson } from "../lib/fs.mjs";

const contracts = readJson(join(ROOT, "packages/ui/component-contracts.json"));
const registry = readJson(join(ROOT, "packages/ui/registry.json"));
const scratches = [];

afterEach(() => {
  for (const path of scratches.splice(0))
    rmSync(path, { recursive: true, force: true });
});

const change = (path, status = "M") => [{ status, paths: [path] }];
const plan = (changes, overrides = {}) =>
  createAffectedPlan({
    changes,
    contracts,
    registry,
    cwd: ROOT,
    ...overrides,
  });

describe("affected component closure", () => {
  it("selects a leaf and every transitive reverse dependent", () => {
    const result = plan(change("packages/ui/registry/ui/code-block.tsx"));
    expect(result.errors).toEqual([]);
    expect(result.seedItems).toEqual(["code-block"]);
    expect(result.affectedItems).toEqual(["code-block", "markdown-view"]);
    expect(result.componentTestFiles).toEqual([
      "packages/ui/registry/ui/code-block.test.tsx",
      "packages/ui/registry/ui/markdown-view.test.tsx",
    ]);
    expect(result.previewModules).toEqual(["code-block", "markdown-view"]);
    expect(result.geometryFixtures).toContain("codeBlock");
    expect(result.geometryFixtures).toContain("markdownView");
  });

  it("expands a shared primitive without selecting unrelated components", () => {
    const result = plan(change("packages/ui/registry/ui/copy-button.tsx"));
    expect(result.affectedItems).toEqual([
      "code-block",
      "copy-button",
      "markdown-view",
      "terminal",
    ]);
    expect(result.affectedItems).not.toContain("provider");
  });

  it("terminates dependency cycles", () => {
    const graph = new Map([
      ["a", ["c"]],
      ["b", ["a"]],
      ["c", ["b"]],
      ["outside", []],
    ]);
    expect(reverseClosure(["a"], graph)).toEqual(["a", "b", "c"]);
  });

  it("unions multiple seeds", () => {
    const result = plan([
      ...change("packages/ui/registry/ui/code-block.tsx"),
      ...change("packages/ui/registry/ui/provider.tsx"),
    ]);
    expect(result.seedItems).toEqual(["code-block", "provider"]);
    expect(result.affectedItems).toEqual([
      "code-block",
      "markdown-view",
      "provider",
    ]);
  });

  it("routes hooks, libs, and blocks through the same graph", () => {
    expect(
      plan(change("packages/ui/registry/ui/use-announcer.ts")).affectedItems,
    ).toContain("code-block");
    expect(
      plan(change("packages/ui/registry/lib/geo-data.ts")).affectedItems,
    ).toEqual(["country-select", "geo-data", "region-select"]);
    expect(
      plan(change("packages/ui/registry/blocks/dashboard-01/page.tsx"))
        .affectedItems,
    ).toEqual(["dashboard-01"]);
  });
});

describe("path classification", () => {
  it("runs only the owning test for a test-only change", () => {
    const result = plan(change("packages/ui/registry/ui/provider.test.tsx"));
    expect(result.affectedItems).toEqual([]);
    expect(result.componentTestFiles).toEqual([
      "packages/ui/registry/ui/provider.test.tsx",
    ]);
  });

  it("runs preview geometry without component tests for a preview-only change", () => {
    const result = plan(change("apps/docs/components/preview/code-block.tsx"));
    expect(result.componentTestFiles).toEqual([]);
    expect(result.geometryFixtures).toEqual(["codeBlock", "codeBlockOverflow"]);
  });

  it("runs no browser tests for prose", () => {
    const result = plan(
      change("apps/docs/content/docs/components/code-block.mdx"),
    );
    expect(result.errors).toEqual([]);
    expect(result.browserTestFiles).toEqual([]);
  });

  it("selects dedicated contracts and fixed canaries for token changes", () => {
    const result = plan(change("packages/design-tokens/src/base.css"));
    expect(result.broadImpactGroups).toEqual(["tokens"]);
    expect(result.geometryFixtures).toEqual(
      [...contracts.affectedTestPolicy.geometryCanaries].sort(),
    );
    expect(result.crossCuttingTestFiles).toContain(
      "packages/ui/test/contrast.browser.test.tsx",
    );
    expect(result.crossCuttingTestFiles).not.toContain(
      "packages/ui/test/accessible-name.browser.test.tsx",
    );
    expect(result.broadImpactWarning).toMatch(/manual full-component audit/);
  });

  it("treats token generators and the shipped preset as broad product inputs", () => {
    expect(
      plan(change("packages/design-tokens/build-tokens.mjs")).broadImpactGroups,
    ).toEqual(["tokens"]);
    expect(
      plan(change("packages/design/preset.css")).broadImpactGroups,
    ).toEqual(["shared-runtime"]);
  });

  it("selects every cross-cutting suite for test-infrastructure changes", () => {
    const result = plan(change("packages/ui/vitest.config.ts"));
    expect(result.crossCuttingTestFiles).toEqual(
      contracts.affectedTestPolicy.crossCuttingTests
        .map((entry) => entry.file)
        .sort(),
    );
  });

  it("fails an unknown path instead of skipping or running everything", () => {
    const result = plan(change("unowned/new-surface.ts"));
    expect(result.errors).toEqual([
      "unclassified path: unowned/new-surface.ts",
    ]);
    expect(result.browserTestFiles).toEqual([]);
  });

  it("fails new unowned registry and browser files", () => {
    const result = plan([
      { status: "?", paths: ["packages/ui/registry/ui/new-widget.tsx"] },
      {
        status: "?",
        paths: ["packages/ui/test/new-contract.browser.test.tsx"],
      },
    ]);
    expect(result.errors).toEqual([
      "unowned cross-cutting browser test: packages/ui/test/new-contract.browser.test.tsx",
      "unowned registry path: packages/ui/registry/ui/new-widget.tsx",
    ]);
  });

  it("rejects a hand-edited generated copy", () => {
    const result = plan(change("apps/docs/components/ui/code-block.tsx"));
    expect(result.errors).toContain(
      "generated registry item code-block changed without its canonical source or contract",
    );
  });

  it("accepts generated output alongside its canonical source", () => {
    const result = plan([
      ...change("packages/ui/registry/ui/code-block.tsx"),
      ...change("apps/docs/components/ui/code-block.tsx"),
      ...change("apps/docs/public/r/code-block.json"),
    ]);
    expect(result.errors).toEqual([]);
    expect(result.registryCheck).toBe(true);
  });

  it("semantically discovers changed contract records", () => {
    const previousContracts = structuredClone(contracts);
    const current = structuredClone(contracts);
    current.components.find((item) => item.name === "code-block").summary +=
      " changed";
    const result = createAffectedPlan({
      changes: change("packages/ui/component-contracts.json"),
      contracts: current,
      previousContracts,
      registry,
      cwd: ROOT,
    });
    expect(result.seedItems).toEqual(["code-block"]);
    expect(result.affectedItems).toContain("markdown-view");
  });

  it("semantically discovers changed registry records", () => {
    const previousRegistry = structuredClone(registry);
    const current = structuredClone(registry);
    current.items.find((item) => item.name === "code-block").description +=
      " changed";
    const result = createAffectedPlan({
      changes: change("packages/ui/registry.json"),
      contracts,
      registry: current,
      previousRegistry,
      cwd: ROOT,
    });
    expect(result.seedItems).toEqual(["code-block"]);
    expect(result.affectedItems).toContain("markdown-view");
  });

  it("retains base ownership for deleted source records", () => {
    const previousContracts = structuredClone(contracts);
    const current = structuredClone(contracts);
    current.components = current.components.filter(
      (item) => item.name !== "code-block",
    );
    const result = createAffectedPlan({
      changes: change("packages/ui/registry/ui/code-block.tsx", "D"),
      contracts: current,
      previousContracts,
      registry,
      previousRegistry: registry,
      cwd: ROOT,
    });
    expect(result.seedItems).toEqual(["code-block"]);
    expect(result.componentTestFiles).toContain(
      "packages/ui/registry/ui/code-block.test.tsx",
    );
  });

  it("classifies the deletion of a registry path no contract ever owned", () => {
    // Batch 4 of the shadcn reset deleted `command.characterization.test.tsx`, which no contract
    // record listed — so neither the current nor the base indexes could own it, and it reached the
    // unowned-path error on a file that is GONE. A deletion has no tests of its own left to run.
    const result = createAffectedPlan({
      changes: change(
        "packages/ui/registry/ui/never-owned.characterization.test.tsx",
        "D",
      ),
      contracts,
      registry,
      cwd: ROOT,
    });
    expect(result.errors).toEqual([]);
    expect(result.classifications).toContainEqual({
      path: "packages/ui/registry/ui/never-owned.characterization.test.tsx",
      kind: "registry-deletion",
    });
    expect(result.registryCheck).toBe(true);
  });

  it("still rejects an ADDED registry path no contract owns", () => {
    const result = createAffectedPlan({
      changes: change("packages/ui/registry/ui/never-owned.tsx", "A"),
      contracts,
      registry,
      cwd: ROOT,
    });
    expect(result.errors).toContain(
      "unowned registry path: packages/ui/registry/ui/never-owned.tsx",
    );
  });
});

describe("affected policy integrity", () => {
  it("rejects missing suite ownership", () => {
    const changed = structuredClone(contracts);
    changed.affectedTestPolicy.crossCuttingTests.pop();
    expect(validateAffectedPolicy(changed)).toContain(
      "crossCuttingTests does not exactly own every browser suite",
    );
  });

  it("rejects stale owners and canaries", () => {
    const changed = structuredClone(contracts);
    changed.affectedTestPolicy.crossCuttingTests[0].owners.push("missing-item");
    changed.affectedTestPolicy.geometryCanaries.push("missingFixture");
    expect(validateAffectedPolicy(changed)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unknown owner missing-item"),
        "unknown geometry canary missingFixture",
      ]),
    );
  });

  it("reconciles cross-cutting owners against direct registry imports", () => {
    const changed = structuredClone(contracts);
    const suite = changed.affectedTestPolicy.crossCuttingTests.find((entry) =>
      entry.file.endsWith("button-states.browser.test.tsx"),
    );
    suite.owners = suite.owners.filter((owner) => owner !== "button");
    expect(validateAffectedPolicy(changed)).toContain(
      "packages/ui/test/button-states.browser.test.tsx: imported registry owner button is undeclared",
    );
  });
});

describe("git input handling", () => {
  it("parses rename records with both paths", () => {
    expect(parseNameStatus("R100\0old.tsx\0new.tsx\0M\0other.ts\0")).toEqual([
      { status: "R100", paths: ["old.tsx", "new.tsx"] },
      { status: "M", paths: ["other.ts"] },
    ]);
  });

  it("includes tracked and untracked working-tree changes", () => {
    const repo = mkdtempSync(join(tmpdir(), "affected-tests-git-"));
    scratches.push(repo);
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: repo,
    });
    execFileSync("git", ["config", "user.name", "test"], { cwd: repo });
    mkdirSync(join(repo, "src"));
    writeFileSync(join(repo, "src/tracked.ts"), "one\n");
    execFileSync("git", ["add", "."], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: repo });
    writeFileSync(join(repo, "src/tracked.ts"), "two\n");
    writeFileSync(join(repo, "src/new.ts"), "new\n");
    expect(collectWorkingTreeChanges({ cwd: repo })).toEqual([
      { status: "M", paths: ["src/tracked.ts"] },
      { status: "?", paths: ["src/new.ts"] },
    ]);
  });

  it("uses the merge base so unrelated new base commits are not PR changes", () => {
    const repo = mkdtempSync(join(tmpdir(), "affected-tests-range-"));
    scratches.push(repo);
    const git = (...args) => execFileSync("git", args, { cwd: repo });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "test");
    writeFileSync(join(repo, "base.ts"), "base\n");
    git("add", ".");
    git("commit", "-qm", "base");
    git("switch", "-qc", "feature");
    writeFileSync(join(repo, "feature.ts"), "feature\n");
    git("add", ".");
    git("commit", "-qm", "feature");
    const head = String(git("rev-parse", "HEAD")).trim();
    git("switch", "-q", "main");
    writeFileSync(join(repo, "main-only.ts"), "main\n");
    git("add", ".");
    git("commit", "-qm", "main moved");
    const base = String(git("rev-parse", "HEAD")).trim();
    expect(collectRangeChanges(base, head, { cwd: repo })).toEqual([
      { status: "A", paths: ["feature.ts"] },
    ]);
  });
});

it("extracts preview fixture functions without executing the module", () => {
  expect(
    exportedPreviewFixtures("apps/docs/components/preview/code-block.tsx"),
  ).toEqual(["codeBlock", "codeBlockOverflow"]);
});
