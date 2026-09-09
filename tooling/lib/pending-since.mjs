/**
 * A component's `since` is pinned data on `packages/ui/component-contracts.json` and is written
 * onto its docs page by `tooling/sync-component-derived.mjs`. A component authored between releases
 * has to carry a version that has not happened yet — the author's best guess at the next bump. If
 * the bump turns out different (one `major` changeset lands and 0.7.0 becomes 1.0.0), that guess
 * would ship as a permanent wrong answer in the published docs and in `llms-full.txt`.
 *
 * `tooling/version-sync.mjs` runs at version time, after `changeset version`, and is the one place
 * that knows the real answer. These two helpers are the whole rule, kept pure so they can be
 * exercised without running a release.
 */

/** Every version /CHANGELOG.md records as released — its `## [x.y.z]` headings. */
export function releasedVersions(changelog) {
  return new Set(
    [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map(
      (match) => match[1],
    ),
  );
}

/**
 * Rewrite, in place, every component `since` that does not name a released version to `version` —
 * the version actually being released. `changelog-assemble` has already written that version's
 * entry by the time `version-sync` runs, so it is in `released` too; the explicit add makes the
 * function correct on its own terms and the rewrite idempotent afterwards.
 *
 * Returns the number of records changed.
 */
export function stampPendingSince(components, released, version) {
  const known = new Set(released);
  known.add(version);
  let stamped = 0;
  for (const record of components) {
    if (record.since && !known.has(record.since)) {
      record.since = version;
      stamped++;
    }
  }
  return stamped;
}
