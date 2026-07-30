// Exact authority for runtime-reported Vitest exclusions that are absent from `vitest list`.
//
// This is intentionally an allowlist, not a pattern. A new `test.skip`/`skipIf`, a renamed test, a
// different engine, or another file must fail receipt freezing until the capability exception is
// reviewed here and in `verify-vitest-runtime-exclusions.mjs`. The source binding covers the exact
// capability probe plus the direct `pasteTest` declaration. The source verifier separately proves
// that all five reviewed registrations are direct top-level calls. The gate tree binds every byte,
// and receipt freeze requires each applicable leaf exactly once: excluded, or listed and passed.

export const VITEST_RUNTIME_EXCLUSION_SOURCE =
  "packages/ui/registry/ui/dropzone.test.tsx";

export const VITEST_RUNTIME_EXCLUSION_SOURCE_BINDING =
  "2a6004df860c0fc0f25dc4e4ccbc48c0a91025fea081cb2f27eff3da7a5b5b98";

const pasteTests = [
  "pasting files inside the surface acquires them (the composer path)",
  "paste enforces accept: a PDF pasted into an image-only dropzone is refused with the reason",
  "single-file paste refuses the surplus as too-many-files instead of dropping it silently",
  "paste enforces minSize: an undersized file is refused as file-too-small",
  "maxFiles={0} means unlimited on paste, matching the drop path",
];

export const VITEST_RUNTIME_EXCLUSIONS = Object.freeze(
  pasteTests.map((testName) =>
    Object.freeze({
      file: VITEST_RUNTIME_EXCLUSION_SOURCE,
      engine: "firefox",
      testName,
      capability: "synthetic-clipboard-files",
      lanes: Object.freeze(["smoke", "all-browsers"]),
    }),
  ),
);

export function vitestRuntimeExclusionLeaf({ file, engine, testName }) {
  return `${file}\0${engine}\0${testName}`;
}

export function vitestRuntimeExclusionsForGate(gate, { files, engines } = {}) {
  const fileUniverse = Array.isArray(files) ? new Set(files) : null;
  const engineUniverse = Array.isArray(engines) ? new Set(engines) : null;
  return VITEST_RUNTIME_EXCLUSIONS.filter(
    ({ lanes, file, engine }) =>
      lanes.includes(gate) &&
      (!fileUniverse || fileUniverse.has(file)) &&
      (!engineUniverse || engineUniverse.has(engine)),
  );
}

export function reconcileVitestRuntimeExclusions({
  gate,
  executedLeaves,
  selectedLeaves = [],
}) {
  if (!Array.isArray(executedLeaves))
    throw new Error(
      "runtime exclusion reconciliation requires executed leaves",
    );
  const authority = new Map(
    vitestRuntimeExclusionsForGate(gate).map((entry) => [
      vitestRuntimeExclusionLeaf(entry),
      entry,
    ]),
  );
  const selected = new Set(selectedLeaves);
  const executedPairs = new Set(
    executedLeaves
      .filter(
        ({ file, engine }) =>
          typeof file === "string" && typeof engine === "string",
      )
      .map(({ file, engine }) => `${file}\0${engine}`),
  );
  const leaves = executedLeaves
    .filter(({ status }) => status === "skipped")
    .map((entry) => {
      const leaf = vitestRuntimeExclusionLeaf(entry);
      if (selected.has(leaf))
        throw new Error(
          `pre-listed required Vitest leaf was skipped at runtime: ${leaf}`,
        );
      const approved = authority.get(leaf);
      if (!approved)
        throw new Error(`unapproved runtime-excluded Vitest leaf: ${leaf}`);
      return { leaf, capability: approved.capability };
    })
    .sort((left, right) => left.leaf.localeCompare(right.leaf));
  if (new Set(leaves.map(({ leaf }) => leaf)).size !== leaves.length)
    throw new Error("runtime exclusion manifest contains duplicate leaves");
  const accounted = new Set([...selected, ...leaves.map(({ leaf }) => leaf)]);
  for (const entry of authority.values()) {
    if (!executedPairs.has(`${entry.file}\0${entry.engine}`)) continue;
    const leaf = vitestRuntimeExclusionLeaf(entry);
    if (!accounted.has(leaf))
      throw new Error(
        `approved runtime exclusion leaf is absent from the required-or-excluded universe: ${leaf}`,
      );
  }
  return { status: "pass", count: leaves.length, leaves };
}
