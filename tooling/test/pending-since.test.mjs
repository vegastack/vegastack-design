// A component's `since` is pinned data on `packages/ui/component-contracts.json`, and a component
// authored between releases carries the author's guess at the next bump. `tooling/version-sync.mjs`
// corrects that guess at version time. A release happens rarely enough that the rule would never be
// observed working — or failing — until it shipped a wrong `since` into permanent published docs,
// so it is a pure function and it is exercised here.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ROOT } from "../lib/fs.mjs";
import { releasedVersions, stampPendingSince } from "../lib/pending-since.mjs";

describe("releasedVersions", () => {
  it("reads the released versions out of the real CHANGELOG", () => {
    const found = releasedVersions(
      readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"),
    );
    // The first and the most recent entries, from the file itself.
    expect(found.has("0.1.0")).toBe(true);
    expect(found.has("0.4.1")).toBe(true);
    // A version with no entry has not been released, whatever a contract record claims.
    expect(found.has("99.0.0")).toBe(false);
  });

  it("ignores headings that are not release entries", () => {
    expect([
      ...releasedVersions("## [0.2.0] — July 19\n## Unreleased\n"),
    ]).toEqual(["0.2.0"]);
  });
});

describe("stampPendingSince", () => {
  const released = new Set(["0.1.0", "0.2.0"]);

  it("rewrites a pending stamp to the version actually being released", () => {
    // The exact failure this exists to prevent: seven components stamped 0.7.0 while a `major`
    // changeset makes the release 1.0.0 instead.
    const components = [
      { name: "button", since: "0.1.0" },
      { name: "toast", since: "0.7.0" },
      { name: "chip", since: "0.7.0" },
    ];
    expect(stampPendingSince(components, released, "1.0.0")).toBe(2);
    expect(components.map((record) => record.since)).toEqual([
      "0.1.0",
      "1.0.0",
      "1.0.0",
    ]);
  });

  it("is a no-op once every stamp names a released version", () => {
    const components = [{ name: "button", since: "0.1.0" }];
    expect(
      stampPendingSince(components, new Set(["0.1.0", "0.3.0"]), "0.3.0"),
    ).toBe(0);
    expect(components[0].since).toBe("0.1.0");
  });

  it("leaves a stamp that already names the version being released", () => {
    const components = [{ name: "toast", since: "0.7.0" }];
    // `changelog-assemble` has written the [0.7.0] entry by the time version-sync runs, but the
    // rule must not depend on that having happened.
    expect(stampPendingSince(components, released, "0.7.0")).toBe(0);
    expect(components[0].since).toBe("0.7.0");
  });
});
