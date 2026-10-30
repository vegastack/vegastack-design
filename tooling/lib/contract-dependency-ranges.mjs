/**
 * `packages/ui/component-contracts.json` records, per item, the npm dependency ranges that item's
 * registry entry declares — and `verify-component-contracts` compares the two. So when a release
 * moves `@vegastack/design` or `@vegastack/design-tokens`, the contract side has to move in the
 * same step as the registry side, or the gate fails once per record left behind.
 *
 * This walks the whole contracts document and rewrites EVERY `npmDependencies` array it finds,
 * wherever it sits and however deeply nested. It is a traversal rather than a list of categories
 * because a list is what broke Version Packages PR #152 (2026-09-19): `version-sync` step 2b
 * iterated `components`, `hooks` and `blocks`, batch 8 of the shadcn reset added a fourth category
 * (`chartBlocks.members`, 68 records each carrying `@vegastack/design-tokens`), nothing told the
 * loop about it, and the required check failed with exactly 68 problems at the bumped version.
 * `libs` and `animatedIcons.sharedContract` sit outside those three arrays too. Adding a fourth
 * name would only re-arm the trap for the fifth category, so the document is the list — do not
 * "simplify" this back into an enumeration.
 */

/** Does caret range `^a.b.c` admit version `x.y.z` (npm's caret rules for 0.x included)? */
export function caretAdmits(range, version) {
  const r = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  const v = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!r || !v) return false;
  const [a, b, c] = r.slice(1).map(Number);
  const [x, y, z] = v.slice(1).map(Number);
  const atLeast = x > a || (x === a && (y > b || (y === b && z >= c)));
  if (!atLeast) return false;
  if (a > 0) return x === a;
  if (b > 0) return x === 0 && y === b;
  return x === 0 && y === 0 && z === c;
}

/**
 * `@vegastack/design` must not match `@vegastack/design-tokens@…`, hence the exact `name@` test.
 * A range that already admits the version being published is LEFT ALONE (30-10-2026): `^0.9.1`
 * installs 0.9.2 already, and rewriting it would change every dependent item — and so its version,
 * header and integrity — on every patch release. Only a bump the range excludes (a 0.x minor) moves it.
 */
export function rewriteRange(dependency, publicDependencies) {
  for (const { name, range } of publicDependencies) {
    if (dependency === name || dependency.startsWith(`${name}@`)) {
      const current = dependency.slice(name.length + 1);
      if (current && caretAdmits(current, range.replace(/^\^/, "")))
        return dependency;
      return `${name}@${range}`;
    }
  }
  return dependency;
}

/**
 * Rewrite, in place, every public dependency range recorded anywhere in `node`.
 *
 * @param {unknown} node contracts document, or any subtree of one
 * @param {Array<{ name: string, range: string }>} publicDependencies the versions being published
 * @returns {number} how many recorded dependency strings changed
 */
export function rewriteContractDependencyRanges(node, publicDependencies) {
  if (Array.isArray(node)) {
    let changed = 0;
    for (const entry of node) {
      changed += rewriteContractDependencyRanges(entry, publicDependencies);
    }
    return changed;
  }
  if (!node || typeof node !== "object") return 0;

  let changed = 0;
  for (const [key, value] of Object.entries(node)) {
    if (key === "npmDependencies" && Array.isArray(value)) {
      node[key] = value.map((dependency) => {
        const next = rewriteRange(dependency, publicDependencies);
        if (next !== dependency) changed++;
        return next;
      });
      continue;
    }
    changed += rewriteContractDependencyRanges(value, publicDependencies);
  }
  return changed;
}
