import { randomUUID } from "node:crypto";
import { linkSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const MODES = new Set(["full", "affected", "diagnostic"]);
const REQUIRED_LAYOUTS = ["default", "src"];
export const REQUIRED_PUBLIC_PACKAGE_ARTIFACTS = [
  "@vegastack/design-tokens",
  "@vegastack/design",
];

export function packageNameFromSpec(specifier) {
  if (typeof specifier !== "string" || specifier.length === 0) return null;
  if (specifier.startsWith("@")) {
    const versionAt = specifier.indexOf("@", 1);
    return versionAt < 0 ? specifier : specifier.slice(0, versionAt);
  }
  const versionAt = specifier.indexOf("@");
  return versionAt < 0 ? specifier : specifier.slice(0, versionAt);
}

export function declaredVegastackPackages(items) {
  return [
    ...new Set(
      items
        .flatMap((item) => item.dependencies ?? [])
        .map(packageNameFromSpec)
        .filter((name) => name?.startsWith("@vegastack/")),
    ),
  ].sort();
}

export function writeImmutableJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    flag: "wx",
    mode: 0o600,
  });
  try {
    // Linking publishes the completely written inode only when `path` is absent. A concurrent or
    // repeated writer gets EEXIST; unlike rename, it cannot replace the first report.
    linkSync(temporary, path);
  } finally {
    unlinkSync(temporary);
  }
  return path;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values)
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  return [...duplicates].sort();
}

function validateLeaves(label, leaves, roots, layouts, problems) {
  if (!Array.isArray(leaves)) {
    problems.push(`${label}: leaves are missing`);
    return;
  }
  const expected = new Set(
    roots.flatMap((root) => layouts.map((layout) => `${layout}\0${root}`)),
  );
  const actual = leaves.map((leaf) => `${leaf.layout}\0${leaf.root}`);
  for (const duplicate of duplicateValues(actual))
    problems.push(
      `${label}: duplicate root/layout leaf ${duplicate.replace("\0", "/")}`,
    );
  for (const key of expected)
    if (!actual.includes(key))
      problems.push(
        `${label}: missing isolated root/layout leaf ${key.replace("\0", "/")}`,
      );
  for (const key of actual)
    if (!expected.has(key))
      problems.push(
        `${label}: unexpected root/layout leaf ${key.replace("\0", "/")}`,
      );

  const consumers = new Map();
  const targets = new Map();
  for (const leaf of leaves) {
    const identity = `${leaf.layout}/${leaf.root}`;
    if (typeof leaf.consumer !== "string" || leaf.consumer.length === 0)
      problems.push(`${label} ${identity}: isolated consumer path missing`);
    else if (consumers.has(leaf.consumer))
      problems.push(
        `${label}: consumer reused across roots: ${consumers.get(leaf.consumer)} and ${identity}`,
      );
    else consumers.set(leaf.consumer, identity);
    if (leaf.postWriteOk !== true)
      problems.push(`${label} ${identity}: post-write proof missing`);
    if (leaf.tscOk !== true)
      problems.push(`${label} ${identity}: typecheck proof missing`);
    if (!Array.isArray(leaf.outputs) || leaf.outputs.length === 0)
      problems.push(`${label} ${identity}: output manifest is empty`);
    for (const output of leaf.outputs ?? []) {
      if (
        typeof output.target !== "string" ||
        output.target.length === 0 ||
        typeof output.sha256 !== "string" ||
        output.sha256.length === 0
      ) {
        problems.push(`${label} ${identity}: malformed output manifest leaf`);
        continue;
      }
      const targetKey = `${leaf.layout}\0${output.target}`;
      const prior = targets.get(targetKey);
      if (prior && prior.sha256 !== output.sha256)
        problems.push(
          `${label}: conflicting target ${output.target} in ${leaf.layout}: ${prior.root} (${prior.sha256}) versus ${leaf.root} (${output.sha256})`,
        );
      else targets.set(targetKey, { root: leaf.root, sha256: output.sha256 });
    }
  }
}

export function validateConsumeReport(report, { expectedRootCount } = {}) {
  const problems = [];
  if (!report || report.schema !== "vegastack-consume-report/v1")
    return ["consume report schema is missing or unsupported"];
  if (!MODES.has(report.mode))
    problems.push(`unsupported consume mode ${report.mode}`);
  if (report.status !== "pass")
    problems.push(`consume report status is not pass: ${report.status}`);
  if (
    !Number.isInteger(report.exhaustiveRootCount) ||
    report.exhaustiveRootCount <= 0
  )
    problems.push("consume report exhaustive root count is missing");
  if (
    !Array.isArray(report.packageArtifacts) ||
    report.packageArtifacts.length === 0
  )
    problems.push("public package artifact proof is missing");
  const artifactNames = (report.packageArtifacts ?? []).map(
    (artifact) => artifact.name,
  );
  for (const duplicate of duplicateValues(artifactNames))
    problems.push(`duplicate public package artifact ${duplicate}`);
  for (const name of REQUIRED_PUBLIC_PACKAGE_ARTIFACTS)
    if (!artifactNames.includes(name))
      problems.push(`required public package artifact ${name} is missing`);
  for (const name of artifactNames)
    if (!REQUIRED_PUBLIC_PACKAGE_ARTIFACTS.includes(name))
      problems.push(`unexpected public package artifact ${name}`);
  for (const artifact of report.packageArtifacts ?? []) {
    if (typeof artifact.name !== "string" || artifact.name.length === 0)
      problems.push("public package artifact name is missing");
    if (artifact.buildStatus !== "pass")
      problems.push(`${artifact.name ?? "unknown package"} build did not pass`);
    if (artifact.exportsValidated !== true)
      problems.push(
        `${artifact.name ?? "unknown package"} packed exports were not validated`,
      );
    if (
      !Number.isInteger(artifact.packedFileCount) ||
      artifact.packedFileCount <= 0
    )
      problems.push(
        `${artifact.name ?? "unknown package"} packed file manifest is empty`,
      );
  }
  if (
    expectedRootCount !== undefined &&
    report.exhaustiveRootCount !== expectedRootCount
  )
    problems.push(
      `consume report root count ${report.exhaustiveRootCount} does not match independently derived ${expectedRootCount}`,
    );
  const roots = Array.isArray(report.selectedRoots) ? report.selectedRoots : [];
  const layouts = Array.isArray(report.selectedLayouts)
    ? report.selectedLayouts
    : [];
  if (roots.length === 0)
    problems.push("selected proof requires nonempty roots");
  if (layouts.length === 0)
    problems.push("selected proof requires nonempty layouts");
  for (const duplicate of duplicateValues(roots))
    problems.push(`duplicate selected root ${duplicate}`);
  for (const duplicate of duplicateValues(layouts))
    problems.push(`duplicate selected layout ${duplicate}`);
  for (const layout of layouts)
    if (!REQUIRED_LAYOUTS.includes(layout))
      problems.push(`unknown selected layout ${layout}`);

  validateLeaves("real", report.isolatedReal, roots, layouts, problems);
  validateLeaves(
    "simulated",
    report.isolatedSimulated,
    roots,
    layouts,
    problems,
  );
  const allConsumers = [
    ...(report.isolatedReal ?? []),
    ...(report.isolatedSimulated ?? []),
  ].map((leaf) => leaf.consumer);
  for (const consumer of duplicateValues(allConsumers))
    problems.push(`consumer reused across proof phases: ${consumer}`);

  if ((report.collisionProblems ?? []).length > 0)
    problems.push(
      ...report.collisionProblems.map((problem) => `collision: ${problem}`),
    );
  if (report.receiptWritten !== false)
    problems.push(`${report.mode} consume proof must not write a receipt`);
  if (report.reuseEnabled !== false || report.evidenceReusable !== false)
    problems.push(`${report.mode} consume proof must not be reusable`);
  if (report.ciFullOracleRequired !== true)
    problems.push("CI full consume oracle requirement must remain explicit");

  if (report.mode === "full") {
    if (report.shadowOnly !== false)
      problems.push("full consume proof must not claim shadow-only execution");
    if (report.fullOracleExecuted !== true)
      problems.push("full oracle was not executed");
    const consolidatedLayouts = (report.consolidated ?? []).map(
      (entry) => entry.layout,
    );
    for (const duplicate of duplicateValues(consolidatedLayouts))
      problems.push(`duplicate consolidated layout ${duplicate}`);
    for (const layout of consolidatedLayouts)
      if (!REQUIRED_LAYOUTS.includes(layout))
        problems.push(`unknown consolidated layout ${layout}`);
    for (const layout of REQUIRED_LAYOUTS) {
      const entry = (report.consolidated ?? []).find(
        (candidate) => candidate.layout === layout,
      );
      if (!entry) {
        problems.push(`missing consolidated ${layout} layout`);
        continue;
      }
      if (
        entry.totalItems !== report.exhaustiveRootCount ||
        entry.provenItems !== entry.totalItems
      )
        problems.push(`${layout} did not prove its complete item universe`);
      if (entry.postWriteOk !== true)
        problems.push(`${layout} consolidated post-write proof missing`);
      if (entry.tscOk !== true)
        problems.push(`${layout} consolidated typecheck proof missing`);
      if (entry.collisionsOk !== true)
        problems.push(`${layout} consolidated collision proof missing`);
    }
  } else {
    if (report.fullOracleExecuted !== false)
      problems.push(`${report.mode} must not claim the full oracle executed`);
    if ((report.consolidated ?? []).length > 0)
      problems.push(
        `${report.mode} must not emit consolidated full-oracle results`,
      );
    if (report.shadowOnly !== true)
      problems.push(`${report.mode} must remain shadow-only`);
  }
  return [...new Set(problems)];
}

/**
 * Validate an affected diagnostic as a complete, isolated attempt rather than reusable passing
 * evidence. A selected failure may truthfully retain post-write/typecheck/collision failures, but
 * it still needs the exact root×layout universe, unique consumers, nonempty content manifests,
 * immutable package artifacts, and the diagnostic-only boundary. Missing/partial output remains
 * unknown, never an observed failure.
 */
export function validateAffectedConsumeReport(
  report,
  { expectedRootCount } = {},
) {
  const all = validateConsumeReport(report, { expectedRootCount });
  if (!report || report.mode !== "affected")
    return [
      ...new Set([...all, "selected consume report is not affected mode"]),
    ];
  if (!new Set(["pass", "fail"]).has(report.status))
    return [
      ...new Set([
        ...all,
        `affected consume terminal status is invalid: ${report.status}`,
      ]),
    ];
  const allowedFailureFact = (problem) =>
    report.status === "fail" &&
    (/^consume report status is not pass: fail$/.test(problem) ||
      /: post-write proof missing$/.test(problem) ||
      /: typecheck proof missing$/.test(problem) ||
      /^collision: /.test(problem));
  const problems = all.filter((problem) => !allowedFailureFact(problem));
  if (report.status === "fail") {
    if (!Array.isArray(report.problems) || report.problems.length === 0)
      problems.push("failed affected consume report has no structured problem");
    const observedFailure = [
      ...(report.problems ?? []),
      ...(report.collisionProblems ?? []),
      ...(report.isolatedReal ?? []).flatMap((leaf) =>
        leaf.postWriteOk !== true || leaf.tscOk !== true
          ? [`${leaf.layout}/${leaf.root}`]
          : [],
      ),
      ...(report.isolatedSimulated ?? []).flatMap((leaf) =>
        leaf.postWriteOk !== true || leaf.tscOk !== true
          ? [`${leaf.layout}/${leaf.root}`]
          : [],
      ),
    ];
    if (observedFailure.length === 0)
      problems.push(
        "failed affected consume report contains no observable failed leaf",
      );
  }
  return [...new Set(problems)];
}
