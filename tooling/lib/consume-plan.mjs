const LAYOUTS = ["default", "src"];

const NO_CONSUMER_EFFECT = [
  /^docs\//,
  /^\.github\//,
  /^\.husky\//,
  /^skills\/internal\//,
  /^skills\/public\//,
  /^packages\/design\/skills\//,
  /^(?:AGENTS|README|CHANGELOG)\.md$/,
  /^apps\/docs\/content\//,
  /^apps\/docs\/(?:app|vrt)\//,
  /^apps\/docs\/components\/preview\//,
  /^design\.md$/,
  /^tooling\/lib\/vitest-runtime-exclusions\.mjs$/,
  /^tooling\/verify-vitest-runtime-exclusions\.mjs$/,
];

const FULL_SURFACE = [
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json)$/,
  /^packages\/design-tokens\//,
  /^packages\/design\/(?!skills\/)/,
  /^packages\/ui\/(?:package\.json|registry\.json|component-contracts\.json)$/,
  /^apps\/docs\/package\.json$/,
  /^apps\/docs\/public\/r\/(?:registry|integrity-manifest|signed-integrity-manifest)\.(?:json|sig)$/,
  /^tooling\/(?:verify-shadcn-consume|verify-consume-(?:plan|isolation))\.mjs$/,
  /^tooling\/lib\/consume-(?:plan|isolation)\.mjs$/,
  /^packages\/design\/bin\/verify-registry-item\.mjs$/,
];

function dependencyName(value) {
  return value.replace(/^@vegastack\//, "");
}

function indexItems(items) {
  const byName = new Map();
  const byPath = new Map();
  for (const item of items) {
    if (byName.has(item.name))
      throw new Error(`duplicate consume item authority: ${item.name}`);
    byName.set(item.name, item);
    for (const file of item.files ?? []) {
      const prior = byPath.get(file.path);
      if (prior && prior !== item.name)
        throw new Error(
          `conflicting consume file authority: ${file.path} belongs to ${prior} and ${item.name}`,
        );
      byPath.set(file.path, item.name);
    }
  }
  return { byName, byPath };
}

export function reverseConsumeClosure(names, items) {
  const { byName } = indexItems(items);
  const reverse = new Map([...byName.keys()].map((name) => [name, new Set()]));
  for (const item of byName.values())
    for (const dependency of item.registryDependencies ?? []) {
      const name = dependencyName(dependency);
      if (!byName.has(name))
        throw new Error(
          `${item.name} declares unknown consume dependency ${name}`,
        );
      reverse.get(name).add(item.name);
    }
  const reached = new Set(names);
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.shift();
    for (const consumer of reverse.get(name) ?? [])
      if (!reached.has(consumer)) {
        reached.add(consumer);
        queue.push(consumer);
      }
  }
  return [...reached].sort();
}

export function buildConsumePlan({ changedFiles, items, metadata = {} }) {
  const { byName, byPath } = indexItems(items);
  const allRoots = [...byName.keys()].sort();
  const reasons = [];
  const changedItems = new Set();
  let full = Object.values(metadata).some(Boolean);
  if (full)
    reasons.push("deletion/mode/symlink or unverifiable metadata change");

  for (const path of changedFiles) {
    if (FULL_SURFACE.some((pattern) => pattern.test(path))) {
      full = true;
      reasons.push(`${path}: global consumer surface`);
      continue;
    }

    let item = byPath.get(path) ?? null;
    const built =
      /^apps\/docs\/(?:public\/r|components\/ui)\/([^/]+)\.(?:json|tsx?|jsx?)$/.exec(
        path,
      );
    if (
      built &&
      !["registry", "integrity-manifest", "signed-integrity-manifest"].includes(
        built[1],
      )
    )
      item = built[1];
    if (item) {
      if (!byName.has(item)) {
        full = true;
        reasons.push(`${path}: item is absent from registry authority`);
      } else changedItems.add(item);
      continue;
    }

    if (
      /^packages\/ui\/registry\//.test(path) ||
      /^apps\/docs\/public\/r\//.test(path)
    ) {
      full = true;
      reasons.push(`${path}: unmodeled registry path`);
      continue;
    }

    if (NO_CONSUMER_EFFECT.some((pattern) => pattern.test(path))) {
      reasons.push(`${path}: no consumer-byte effect`);
      continue;
    }

    full = true;
    reasons.push(`${path}: unknown path widens consume coverage`);
  }

  const roots = full
    ? allRoots
    : reverseConsumeClosure([...changedItems], items);
  const mode = full ? "full" : roots.length > 0 ? "affected-shadow" : "none";
  return {
    schema: "vegastack-consume-plan/v1",
    mode,
    roots,
    layouts: [...LAYOUTS],
    reasons,
    runner:
      mode === "full"
        ? {
            command: "node",
            args: ["tooling/verify-shadcn-consume.mjs", "--mode", "full"],
          }
        : mode === "affected-shadow"
          ? {
              command: "node",
              args: [
                "tooling/verify-shadcn-consume.mjs",
                "--mode",
                "affected",
                ...roots.flatMap((root) => ["--root", root]),
              ],
            }
          : null,
    shadowOnly: true,
    reuseEnabled: false,
    evidenceReusable: false,
    fullOracleStillRequired: true,
  };
}
