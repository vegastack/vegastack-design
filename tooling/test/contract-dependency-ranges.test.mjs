// `version-sync` rewrites the public dependency ranges recorded in component-contracts.json at
// version time, and a release happens rarely enough that a record it fails to reach is not observed
// until the Version Packages PR is already open — which is exactly how PR #152 (2026-09-19) failed
// with 68 problems, one per chart block, after batch 8 added a category the rewrite's enumerated
// loop did not name. The rule is pure, so it is exercised here instead.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { rewriteContractDependencyRanges } from "../lib/contract-dependency-ranges.mjs";
import { ROOT } from "../lib/fs.mjs";

const PUBLIC = [
  { name: "@vegastack/design", range: "^9.9.9" },
  { name: "@vegastack/design-tokens", range: "^9.9.9" },
];

/** Every `npmDependencies` array in a document, found independently of the code under test. */
function collectDependencyArrays(node, found = []) {
  if (Array.isArray(node)) {
    for (const entry of node) collectDependencyArrays(entry, found);
    return found;
  }
  if (!node || typeof node !== "object") return found;
  for (const [key, value] of Object.entries(node)) {
    if (key === "npmDependencies" && Array.isArray(value)) found.push(value);
    else collectDependencyArrays(value, found);
  }
  return found;
}

describe("rewriteContractDependencyRanges", () => {
  it("rewrites a record in a category the rewrite does not name", () => {
    // THE claim. `components` is one of the three categories the old enumerated loop knew; the
    // other two records are the shapes that broke it — a members list under a category key, and a
    // category that does not exist yet. All three must move, or a release ships a contract whose
    // ranges disagree with the registry it was built from.
    const contracts = {
      components: [{ name: "button", npmDependencies: ["@vegastack/design"] }],
      chartBlocks: {
        sharedContract: {
          npmDependencies: ["recharts@^3.10.1", "@vegastack/design@^0.4.1"],
        },
        members: [
          {
            name: "chart-area-axes",
            npmDependencies: [
              "lucide-react@^1.47.0",
              "@vegastack/design-tokens@^0.4.0",
            ],
          },
        ],
      },
      somethingNobodyHasWrittenYet: {
        nested: { deeper: [{ npmDependencies: ["@vegastack/design@^0.4.1"] }] },
      },
    };

    expect(rewriteContractDependencyRanges(contracts, PUBLIC)).toBe(4);
    expect(contracts.components[0].npmDependencies).toEqual([
      "@vegastack/design@^9.9.9",
    ]);
    expect(contracts.chartBlocks.sharedContract.npmDependencies).toEqual([
      "recharts@^3.10.1",
      "@vegastack/design@^9.9.9",
    ]);
    expect(contracts.chartBlocks.members[0].npmDependencies).toEqual([
      "lucide-react@^1.47.0",
      "@vegastack/design-tokens@^9.9.9",
    ]);
    expect(
      contracts.somethingNobodyHasWrittenYet.nested.deeper[0].npmDependencies,
    ).toEqual(["@vegastack/design@^9.9.9"]);
  });

  it("leaves every other dependency alone, prefix included", () => {
    // `@vegastack/design` is a prefix of `@vegastack/design-tokens`; a loose match would rewrite the
    // tokens range to the runtime's version and publish a range no consumer can satisfy.
    const record = {
      npmDependencies: [
        "@base-ui/react@^1.6.0",
        "@vegastack/design-tokens@^0.4.0",
        "@vegastack/design-tokens-experimental@^0.1.0",
      ],
    };
    expect(
      rewriteContractDependencyRanges(record, [
        { name: "@vegastack/design", range: "^9.9.9" },
      ]),
    ).toBe(0);
    expect(record.npmDependencies).toEqual([
      "@base-ui/react@^1.6.0",
      "@vegastack/design-tokens@^0.4.0",
      "@vegastack/design-tokens-experimental@^0.1.0",
    ]);
  });

  it("is idempotent, so a re-run of version-sync produces no diff", () => {
    const contracts = {
      blocks: [{ npmDependencies: ["@vegastack/design-tokens@^0.4.0"] }],
    };
    expect(rewriteContractDependencyRanges(contracts, PUBLIC)).toBe(1);
    expect(rewriteContractDependencyRanges(contracts, PUBLIC)).toBe(0);
  });

  it("leaves no stale public range anywhere in the real contracts document", () => {
    // The real file, so a category added later is covered by this test the day it appears.
    const contracts = JSON.parse(
      readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
    );
    const before = collectDependencyArrays(contracts).flat();
    expect(before.length).toBeGreaterThan(0);

    rewriteContractDependencyRanges(contracts, PUBLIC);

    const stale = collectDependencyArrays(contracts)
      .flat()
      .filter((dependency) =>
        PUBLIC.some(
          ({ name, range }) =>
            (dependency === name || dependency.startsWith(`${name}@`)) &&
            dependency !== `${name}@${range}`,
        ),
      );
    expect(stale).toEqual([]);
  });
});
