import { existsSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

/** Resolve a generated file path and fail if it is not a descendant of root. */
export function resolveInside(root, ...segments) {
  const rootPath = resolve(root);
  const candidate = resolve(rootPath, ...segments);
  return assertPathInside(rootPath, candidate);
}

/** Assert that candidate is a descendant (not the root itself) of root. */
export function assertPathInside(root, candidate) {
  const rootPath = resolve(root);
  const candidatePath = resolve(candidate);
  const rel = relative(rootPath, candidatePath);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`generated path escapes ${rootPath}: ${candidate}`);
  }
  return candidatePath;
}

/** Resolve symlinks for an existing path before enforcing containment. */
export function assertExistingPathInside(root, candidate) {
  const lexicalRoot = resolve(root);
  const lexicalCandidate = assertPathInside(lexicalRoot, candidate);
  assertNoSymlinkDescendant(lexicalRoot, lexicalCandidate);
  return assertPathInside(
    realpathSync(lexicalRoot),
    realpathSync(lexicalCandidate),
  );
}

/** Reject symlinks in a generated/verified descendant path, even when they resolve inside root. */
function assertNoSymlinkDescendant(root, candidate) {
  const rel = relative(resolve(root), resolve(candidate));
  let cursor = resolve(root);
  for (const segment of rel.split(sep)) {
    cursor = resolve(cursor, segment);
    try {
      if (lstatSync(cursor).isSymbolicLink()) {
        throw new Error(`generated path traverses a symlink: ${cursor}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
}

/**
 * Validate a not-yet-created path by resolving its nearest existing ancestor. This prevents a
 * checked-in directory symlink from turning a lexically safe generated path into an outside write.
 */
export function assertWritablePathInside(root, candidate) {
  const safe = assertPathInside(root, candidate);
  assertNoSymlinkDescendant(root, safe);
  let ancestor = dirname(safe);
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const realRoot = realpathSync(root);
  const realAncestor = realpathSync(ancestor);
  if (realAncestor !== realRoot) assertPathInside(realRoot, realAncestor);
  return safe;
}

/** Names received from an upstream index become filenames, so allow basename syntax only. */
export function assertGeneratedName(name, label = "generated name") {
  if (typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      `${label} must use lowercase kebab-case basename syntax: ${name}`,
    );
  }
  return name;
}
