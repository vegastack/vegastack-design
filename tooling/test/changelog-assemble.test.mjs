// The assembler's idempotency contract, proved on fixtures.
//
// Idempotency used to be VERSION-keyed: "a `## [x.y.z]` heading exists, so exit 0". That is
// indistinguishable from the dangerous case — a HAND-WRITTEN entry for the version about to be
// released — where exiting 0 lets `changeset version` delete every pending changeset whose prose
// was never placed. The key is now the assembled marker, and these tests are the difference.
import { describe, expect, test } from "vitest";
import {
  inspectChangelog,
  fingerprint,
  ASSEMBLED_MARKER_RE,
} from "../changelog-assemble.mjs";

const changesets = [
  { file: "a.md", body: "🔧 **Button** — two axes." },
  {
    file: "b.md",
    body: "🐛 **Progress** — indeterminate no longer reads as complete.",
  },
];
const FP = fingerprint(changesets);

const assembled = (fp, count = 2) => `# Changelog

## [0.7.0] — September 7, 2026

<!-- assembled from ${count} changesets: ${fp} -->

### 🔧 Changed components

- **Button** — two axes.

## [0.6.0] — August 31, 2026
`;

const handWritten = `# Changelog

## [0.7.0] — September 7, 2026

### 🔧 Changed components

- **Button** — two axes.

## [0.6.0] — August 31, 2026
`;

describe("fingerprint", () => {
  test("is stable for the same pending set and moves when a body changes", () => {
    expect(fingerprint(changesets)).toBe(FP);
    expect(
      fingerprint([
        changesets[0],
        { file: "b.md", body: "🐛 something else." },
      ]),
    ).not.toBe(FP);
  });

  test("moves when a changeset is added or removed", () => {
    expect(fingerprint([changesets[0]])).not.toBe(FP);
    expect(
      fingerprint([
        ...changesets,
        { file: "c.md", body: "📚 **Docs** — a page." },
      ]),
    ).not.toBe(FP);
  });

  test("is twelve hex characters, the width the marker declares", () => {
    expect(FP).toMatch(/^[0-9a-f]{12}$/);
    expect(
      ASSEMBLED_MARKER_RE.test(`<!-- assembled from 2 changesets: ${FP} -->`),
    ).toBe(true);
  });
});

describe("inspectChangelog", () => {
  test("no heading for the version at all → absent", () => {
    expect(inspectChangelog(handWritten, "0.8.0", FP).state).toBe("absent");
  });

  test("a heading with THIS pending set's marker → assembled (a re-run is a no-op)", () => {
    expect(inspectChangelog(assembled(FP), "0.7.0", FP).state).toBe(
      "assembled",
    );
  });

  test("a heading with SOME OTHER marker → stale, never a silent overwrite", () => {
    const result = inspectChangelog(assembled("0123456789ab"), "0.7.0", FP);
    expect(result.state).toBe("stale");
    expect(result.fingerprint).toBe("0123456789ab");
  });

  test("a heading with NO marker → handwritten, which is always an error", () => {
    // This is the exact shape `main` carried: an entry the audit train wrote by hand for the very
    // version the pending changesets are about to produce.
    expect(inspectChangelog(handWritten, "0.7.0", FP).state).toBe(
      "handwritten",
    );
  });

  test("a marker under a DIFFERENT version's heading does not launder this one", () => {
    const source = `# Changelog

## [0.7.0] — September 7, 2026

### 🔧 Changed components

- **Button** — two axes.

## [0.6.0] — August 31, 2026

<!-- assembled from 2 changesets: ${FP} -->
`;
    expect(inspectChangelog(source, "0.7.0", FP).state).toBe("handwritten");
  });
});
