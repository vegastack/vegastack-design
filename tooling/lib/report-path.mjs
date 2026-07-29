import { existsSync, lstatSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { ROOT } from "./change-set.mjs";

const DIAGNOSTICS_ROOT = join(ROOT, ".gates", "diagnostics");

function inside(parent, child) {
  const path = relative(parent, child);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`));
}

/**
 * User-selectable diagnostic reports live only under the dedicated .gates/diagnostics subtree.
 * They may never alias a tracked file, receipt, evidence store, canonical gate report, or
 * last-failure record through `..` or a symlink.
 */
export function validateDiagnosticReportPath(
  path,
  label = "diagnostic report",
) {
  const absolute = resolve(path);
  if (!inside(DIAGNOSTICS_ROOT, absolute))
    throw new Error(`${label} must be under .gates/diagnostics`);
  if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink())
    throw new Error(`${label} must not be a symlink`);
  if (inside(DIAGNOSTICS_ROOT, absolute)) {
    let cursor = ROOT;
    const suffix = relative(ROOT, absolute).split(sep).filter(Boolean);
    for (const part of suffix) {
      cursor = join(cursor, part);
      if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink())
        throw new Error(`${label} path must not traverse a symlink`);
    }
  }
  return absolute;
}
