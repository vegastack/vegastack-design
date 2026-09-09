// The changeset → CHANGELOG section contract, proved on fixtures.
//
// The gate is only worth having if it FAILS on the four shapes below; a linter that has never
// been observed rejecting anything is an assumption (AGENTS.md § Verification).
import { describe, expect, test } from "vitest";
import {
  resolveSection,
  splitChangeset,
  SECTIONS,
} from "../changelog-assemble.mjs";
import { lintChangesets } from "../changeset-lint.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** A changeset file as it exists on disk, parsed the way the linter parses it. */
const changeset = (file, source) => ({ file, ...splitChangeset(source) });

const VALID = `---
"@vegastack/ui": minor
---

🔧 **Button** — \`variant\` × \`tone\` replaces fifteen hand-maintained variants.
The second line continues the same bullet.
`;

const NO_SECTION = `---
"@vegastack/ui": minor
---

Button becomes two axes: \`variant\` × \`tone\`.
`;

const TWO_SECTIONS = `---
"@vegastack/ui": minor
---

🔧 **Button** — two axes.
⚠️ **Breaking** — \`glass\` is deleted.
`;

const EMPTY_BODY = `---
"@vegastack/ui": patch
---
`;

// An EMPTY CHANGESET — no package bump — with body text. Valid by design: a tooling or CI change
// publishes nothing but still owes the changelog a line.
const EMPTY_CHANGESET_WITH_BODY = `---
---

🛠 **\`changelog-assemble\`** — the release entry is assembled from the pending changesets.
`;

describe("resolveSection", () => {
  test("a body opening with a marker resolves to its section, marker stripped", () => {
    const resolved = resolveSection(splitChangeset(VALID).body);
    expect(resolved.problem).toBeUndefined();
    expect(resolved.section).toBe("🔧 Changed components");
    expect(resolved.text.startsWith("**Button**")).toBe(true);
    expect(resolved.text).toContain(
      "The second line continues the same bullet.",
    );
  });

  test("every marker in the vocabulary resolves", () => {
    for (const [marker, section] of SECTIONS) {
      expect(resolveSection(`${marker} text`).section).toBe(section);
    }
  });

  test("the ⚠️ marker resolves with or without its variation selector", () => {
    expect(resolveSection("⚠️ text").section).toBe("⚠️ Breaking");
    expect(resolveSection("⚠ text").section).toBe("⚠️ Breaking");
  });

  test("an empty changeset with body text is valid", () => {
    const parsed = splitChangeset(EMPTY_CHANGESET_WITH_BODY);
    expect(parsed.frontmatter?.trim() ?? "").toBe("");
    expect(resolveSection(parsed.body).section).toBe("🛠 CLI & tooling");
  });

  test("a body with no marker is rejected", () => {
    expect(resolveSection(splitChangeset(NO_SECTION).body).problem).toMatch(
      /does not start with a section marker/,
    );
  });

  test("a body with two markers is rejected", () => {
    expect(resolveSection(splitChangeset(TWO_SECTIONS).body).problem).toMatch(
      /2 section markers/,
    );
  });

  test("a marker that does not open the body is rejected", () => {
    expect(
      resolveSection("Some preamble.\n🔧 **Button** — text.").problem,
    ).toMatch(/must open the body/);
  });

  test("an empty body is rejected", () => {
    expect(resolveSection(splitChangeset(EMPTY_BODY).body).problem).toBe(
      "body is empty",
    );
  });

  test("a marker with nothing after it is rejected", () => {
    expect(resolveSection("🔧").problem).toMatch(/nothing follows/);
  });
});

// The changeset body becomes a CHANGELOG bullet verbatim, so it is held to the assembled file's
// prose rules — a dead docs link and an unknown commit sha are caught at PR time.
const DEAD_DOCS_LINK = `---
"@vegastack/ui": patch
---

\ud83d\udcda **Docs** — see [the page](/docs/components/does-not-exist).
`;

// A sha that IS reachable from HEAD — this repository's own root commit. The predecessor rule
// accepted it; the ban does not, because "does this commit exist" was never the question a
// changeset link fails.
const ROOT_SHA = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], {
  cwd: fileURLToPath(new URL("../..", import.meta.url)),
})
  .toString()
  .trim()
  .slice(0, 7);

const REACHABLE_SHA = `---
"@vegastack/ui": patch
---

\u{1F41B} **Fixed** — [\`${ROOT_SHA}\`](https://github.com/VegaStack/vegastack-design/commit/${ROOT_SHA}).
`;

const UNKNOWN_SHA = `---
"@vegastack/ui": patch
---

\ud83d\udc1b **Fixed** — [\`0000000\`](https://github.com/VegaStack/vegastack-design/commit/0000000).
`;

describe("lintChangesets", () => {
  const fixtures = [
    changeset("valid.md", VALID),
    changeset("no-section.md", NO_SECTION),
    changeset("two-sections.md", TWO_SECTIONS),
    changeset("empty-body.md", EMPTY_BODY),
    changeset("empty-changeset.md", EMPTY_CHANGESET_WITH_BODY),
  ];

  test("reports one problem per non-conforming changeset, named by file", () => {
    const { problems, linted } = lintChangesets({
      changesets: fixtures,
      skip: new Set(),
    });
    expect(linted).toBe(5);
    expect(problems).toHaveLength(3);
    expect(problems.map((problem) => problem.split(":")[0]).sort()).toEqual([
      "empty-body.md",
      "no-section.md",
      "two-sections.md",
    ]);
  });

  test("skipped changesets are neither linted nor counted", () => {
    const { problems, linted } = lintChangesets({
      changesets: fixtures,
      skip: new Set(["no-section.md", "two-sections.md", "empty-body.md"]),
    });
    expect(problems).toEqual([]);
    expect(linted).toBe(2);
  });

  test("a body whose docs link resolves to no page is rejected", () => {
    const { problems } = lintChangesets({
      changesets: [changeset("dead-link.md", DEAD_DOCS_LINK)],
    });
    expect(problems).toEqual([
      "dead-link.md: docs link resolves to no content page: /docs/components/does-not-exist",
    ]);
  });

  test("a body carrying ANY commit link is rejected, reachable or not", () => {
    // The ban is unconditional. A changeset is written before its own commit exists, so the only
    // sha it can name is a pre-merge one that the squash/rebase orphans — the predecessor rule
    // (does the object exist?) passed such a link for its author and 404'd for every reader.
    // Both fixtures below are commit links; both must be rejected, and the message must be the
    // ban rather than a reachability complaint.
    for (const [file, source] of [
      ["unknown-sha.md", UNKNOWN_SHA],
      ["reachable-sha.md", REACHABLE_SHA],
    ]) {
      const { problems } = lintChangesets({
        changesets: [changeset(file, source)],
      });
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain("a changeset must not link a commit");
    }
  });

  test("the prose rules are changelog-lint's own, not a second copy", () => {
    // The gate is only worth having if it is the SAME rule the assembled file is held to.
    const seen = [];
    lintChangesets({
      changesets: [changeset("valid.md", VALID)],
      prose: (text) => (seen.push(text), []),
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].startsWith("**Button**")).toBe(true);
  });

  test("the repo's own pending changesets pass the gate as it is wired", () => {
    // `pnpm lint` runs the linter over every pending changeset; this is that run.
    expect(lintChangesets().problems).toEqual([]);
  });
});
