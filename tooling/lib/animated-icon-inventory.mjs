// The animated-icon partition of the registry, DERIVED — one definition, three consumers.
//
// WHY THIS FILE EXISTS
//   `mirror-animated-icons.mjs`, `verify-animated-icons.mjs` and `verify-component-contracts.mjs`
//   each carried the corpus size as a hand-edited literal (`const EXPECTED_COUNT = 467`). A literal
//   that has to be edited by hand is a literal that can be edited wrong, and adopting 28 upstream
//   icons meant editing four of them in lockstep. G1-b (#99) had already replaced the five
//   inventory literals in `verify-component-contracts.mjs` with a partition read off
//   `packages/ui/registry.json`; MK decided on 2026-09-09 that the animated-icon count follows the
//   same rule rather than staying an exception.
//
// WHY registry.json, AND WHY THAT IS NOT CIRCULAR
//   `packages/ui/registry.json` is the machine authority for inventory and membership (AGENTS.md
//   § Truth hierarchy, rank 2). Nothing generates it — `pnpm registry:build` READS it — so it is a
//   hand-declared statement of what VegaStack ships, independent of every artefact the three gates
//   above validate: the pinned mirror manifest (`packages/ui/animated-icon-sources.json`), the
//   generated modules under `packages/ui/registry/ui/icons/`, the upstream lucide-animated index,
//   and `packages/ui/component-contracts.json`. Each of those checks therefore still compares two
//   different files, and each still fails closed in both directions.
//
//   The one thing this must never become is `x === x`: a gate that derives its expectation from the
//   very file it is validating cannot fail. That is why the manifest is not the authority even
//   though it is the obvious candidate — `verify-animated-icons.mjs` exists to catch a manifest
//   that changed when it should not have.
import { join } from "node:path";

import { ROOT, readJson } from "./fs.mjs";

/** Canonical source directory of the generated animated-icon modules, relative to ROOT. */
export const ANIMATED_ICON_SOURCE_DIR = "packages/ui/registry/ui/icons";

const ICON_SOURCE_PREFIX = `${ANIMATED_ICON_SOURCE_DIR}/`;

/** A registry item's file paths, tolerating both the string and the object spelling. */
export function registryFilePaths(item) {
  return (item.files ?? []).map((file) =>
    typeof file === "string" ? file : file.path,
  );
}

/**
 * An item is a GENERATED animated icon iff it is a single-file `registry:ui` whose one source lives
 * under the mirrored icon directory. Deliberately path-derived rather than name-derived, so the
 * hand-written `icon-button` component can never be mistaken for one of the mirrors.
 */
export function isGeneratedAnimatedIcon(item) {
  const paths = registryFilePaths(item);
  return (
    item.type === "registry:ui" &&
    paths.length === 1 &&
    paths[0].startsWith(ICON_SOURCE_PREFIX)
  );
}

/** Parse `packages/ui/registry.json`. Throws — naming the file — if it is missing or malformed. */
export function readRegistry() {
  return readJson(join(ROOT, "packages/ui/registry.json"));
}

/**
 * The sorted upstream item names (`a-arrow-down`, not `icon-a-arrow-down`) the registry declares as
 * animated icons — the module basenames, which is the vocabulary the mirror manifest speaks.
 */
export function animatedIconNames(registry = readRegistry()) {
  if (!Array.isArray(registry?.items)) {
    throw new Error("packages/ui/registry.json: items must be an array");
  }
  return registry.items
    .filter(isGeneratedAnimatedIcon)
    .map((item) => registryFilePaths(item)[0].slice(ICON_SOURCE_PREFIX.length))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort();
}

/**
 * How many animated icons `packages/ui/registry.json` declares. This is the number that used to be
 * spelled `const EXPECTED_COUNT = 467` in three scripts.
 */
export function animatedIconCount(registry = readRegistry()) {
  return animatedIconNames(registry).length;
}
