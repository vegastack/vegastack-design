import { createHash } from "node:crypto";
import { isAbsolute, relative } from "node:path";

import { ROOT } from "./change-set.mjs";

function repoPath(path) {
  const value = isAbsolute(path) ? relative(ROOT, path) : path;
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function parseSelectedFiles(source) {
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`selected files JSON is malformed: ${error.message}`);
  }
  if (!Array.isArray(parsed))
    throw new Error("selected files must be a JSON array");
  if (parsed.length === 0) throw new Error("selected files must be nonempty");
  const files = parsed.map((value, index) => {
    if (typeof value !== "string" || !value.trim())
      throw new Error(`selected file ${index} must be a nonempty string`);
    return repoPath(value.trim());
  });
  if (new Set(files).size !== files.length)
    throw new Error("selected files contain a duplicate path");
  return files;
}

export function vitestEvidenceBoundary({
  diagnostic = false,
  selectedShadow = false,
} = {}) {
  const diagnosticOnly = diagnostic || selectedShadow;
  return {
    diagnosticOnly,
    selectedShadow,
    evidenceWritten: !diagnosticOnly,
    receiptWritten: false,
    evidenceEligibility: diagnosticOnly ? "diagnostic-only" : "gate-candidate",
  };
}

function sameSet(expected, actual, label) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = [...expectedSet].filter((value) => !actualSet.has(value));
  const extra = [...actualSet].filter((value) => !expectedSet.has(value));
  if (missing.length > 0 || extra.length > 0)
    throw new Error(
      `${label}: missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`,
    );
}

function leaf(file, project, name) {
  if (!project)
    throw new Error(`listed/executed leaf has no engine/project: ${file}`);
  if (typeof name !== "string" || !name)
    throw new Error(`listed/executed leaf has no exact test name: ${file}`);
  return `${repoPath(file)}\0${project}\0${name}`;
}

export function reconcileVitestSelection({
  plannedFiles,
  listed,
  executed,
  engine = null,
}) {
  if (!Array.isArray(plannedFiles) || plannedFiles.length === 0)
    throw new Error("planned files must be nonempty");
  if (!Array.isArray(listed) || listed.length === 0)
    throw new Error("selected Vitest invocation listed zero tests/files");
  if (!Array.isArray(executed))
    throw new Error("selected Vitest execution report is malformed");

  const normalizedPlanned = [...new Set(plannedFiles.map(repoPath))].sort();
  if (normalizedPlanned.length !== plannedFiles.length)
    throw new Error("planned files contain a duplicate path");
  const listedFiles = [
    ...new Set(listed.map((entry) => repoPath(entry.file))),
  ].sort();
  sameSet(normalizedPlanned, listedFiles, "planned/listed file mismatch");
  if (engine && listed.some((entry) => entry.projectName !== engine))
    throw new Error(
      `listed project mismatch: expected only ${engine}, got ${[
        ...new Set(listed.map((entry) => entry.projectName ?? "missing")),
      ].join(",")}`,
    );

  const listedLeafArray = listed.map((entry) =>
    leaf(entry.file, entry.projectName, entry.name),
  );
  const executedLeafArray = executed
    .filter((entry) => entry.status !== "skipped")
    .map((entry) => leaf(entry.file, entry.engine, entry.testName));
  const listedLeafSet = new Set(listedLeafArray);
  const executedLeafSet = new Set(executedLeafArray);
  if (listedLeafSet.size !== listedLeafArray.length)
    throw new Error("listed Vitest leaf manifest contains duplicates");
  if (executedLeafSet.size !== executedLeafArray.length)
    throw new Error("executed Vitest leaf manifest contains duplicates");
  if (executedLeafSet.size === 0)
    throw new Error("selected Vitest invocation executed zero tests");
  sameSet(
    [...listedLeafSet].sort(),
    [...executedLeafSet].sort(),
    "listed/executed leaf mismatch",
  );
  const selectorDigest = createHash("sha256")
    .update(
      JSON.stringify({
        plannedFiles: normalizedPlanned,
        listedLeaves: [...listedLeafSet].sort(),
      }),
    )
    .digest("hex");
  return {
    status: "pass",
    selectorDigest,
    plannedFiles: normalizedPlanned,
    listedFiles,
    listedLeaves: listedLeafSet.size,
    executedLeaves: executedLeafSet.size,
    leafManifest: [...listedLeafSet].sort(),
  };
}
