function collectRelativeTargets(value, targets) {
  if (typeof value === "string") {
    if (value.startsWith("./")) targets.add(value.slice(2));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const nested of Object.values(value))
    collectRelativeTargets(nested, targets);
}

export function requiredPackedPaths(manifest) {
  const targets = new Set(["package.json"]);
  collectRelativeTargets(manifest.exports, targets);
  collectRelativeTargets(manifest.bin, targets);
  return [...targets].sort();
}

export function validatePackedPackageFiles(manifest, packedFiles) {
  const actual = new Set(
    packedFiles.map((entry) =>
      typeof entry === "string" ? entry : entry?.path,
    ),
  );
  return requiredPackedPaths(manifest)
    .filter((path) => !actual.has(path))
    .map(
      (path) =>
        `${manifest.name}@${manifest.version} packed artifact omits exported file ${path}`,
    );
}
