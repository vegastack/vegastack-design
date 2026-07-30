import { posix } from "node:path";

function normalizedPackageTarget(value, { requireDotPrefix }) {
  if (typeof value !== "string") return null;
  if (requireDotPrefix && !value.startsWith("./")) return null;
  if (value.includes("\\")) return null;
  const stripped = value.replace(/^\.\//, "");
  const normalized = posix.normalize(stripped);
  if (
    stripped.length === 0 ||
    normalized !== stripped ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    posix.isAbsolute(normalized)
  )
    return null;
  return normalized;
}

function collectExportTargets(value, targets, invalid) {
  if (typeof value === "string") {
    const normalized = normalizedPackageTarget(value, {
      requireDotPrefix: true,
    });
    if (normalized) targets.add(normalized);
    else invalid.add(value);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const nested of Object.values(value))
    collectExportTargets(nested, targets, invalid);
}

function packedTargetInventory(manifest) {
  const targets = new Set(["package.json"]);
  const invalid = new Set();
  collectExportTargets(manifest.exports, targets, invalid);
  for (const target of Object.values(
    typeof manifest.bin === "string"
      ? { [manifest.name]: manifest.bin }
      : (manifest.bin ?? {}),
  )) {
    const normalized = normalizedPackageTarget(target, {
      requireDotPrefix: false,
    });
    if (normalized) targets.add(normalized);
    else invalid.add(String(target));
  }
  return { targets: [...targets].sort(), invalid: [...invalid].sort() };
}

export function requiredPackedPaths(manifest) {
  return packedTargetInventory(manifest).targets;
}

export function validatePackedPackageFiles(manifest, packedFiles) {
  const inventory = packedTargetInventory(manifest);
  const actual = new Set(
    packedFiles.map((entry) =>
      typeof entry === "string" ? entry : entry?.path,
    ),
  );
  return [
    ...inventory.invalid.map(
      (target) =>
        `${manifest.name}@${manifest.version} declares an invalid packed export/bin target ${target}`,
    ),
    ...inventory.targets
      .filter((path) => !actual.has(path))
      .map(
        (path) =>
          `${manifest.name}@${manifest.version} packed artifact omits exported file ${path}`,
      ),
  ];
}
