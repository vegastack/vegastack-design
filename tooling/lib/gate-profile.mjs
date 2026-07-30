import { createHash } from "node:crypto";

import { COMPONENT_ROUTES } from "./route-scope.mjs";

export const EVIDENCE_SCHEMA = 1;
export const CHANGE_PROFILE = "change";
export const PRODUCTION_PROFILE = "production-full";
export const VALID_PROFILES = new Set([CHANGE_PROFILE, PRODUCTION_PROFILE]);

export const BROWSER_ENGINES = ["chromium", "firefox", "webkit"];
export const CONTRACT_PROJECTS = [
  "chromium",
  "chromium-dark",
  "mobile-chromium",
  "mobile-chromium-dark",
];
export const CONTRACT_ASSERTIONS = [
  {
    id: "narrow-reflow-rtl",
    title: "contains its primary fixture at 320px",
  },
  {
    id: "forced-colors-target-floor",
    title: "retains focus visibility and effective 24px pointer targets",
  },
];

export const PRODUCTION_ENVIRONMENT = {
  platform: "darwin",
  arch: "arm64",
  nodeMajor: 24,
  siteVisibility: "public",
};

export const FULL_CONTRACT_TESTS =
  COMPONENT_ROUTES.length *
  CONTRACT_PROJECTS.length *
  CONTRACT_ASSERTIONS.length;

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key])]),
    );
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function profileRequirements(profile, required = {}) {
  if (!VALID_PROFILES.has(profile))
    throw new Error(`unknown gate profile ${JSON.stringify(profile)}`);
  if (profile === PRODUCTION_PROFILE)
    return {
      unit: true,
      smoke: true,
      "all-browsers": true,
      contracts: true,
    };
  return {
    unit: required.unit === true,
    smoke: required.smoke === true,
    "all-browsers": false,
    contracts: required.contracts === true,
  };
}

function descriptor(id, gate, unit) {
  return { id, gate, unit };
}

/**
 * Reconstruct the complete evidence universe from machine authorities. A diff chooses the scoped
 * contract route list for the change profile; it never supplies production-full membership.
 */
export function requiredEvidenceUniverse({
  profile,
  required = {},
  contractRoutes = [],
}) {
  const requirements = profileRequirements(profile, required);
  const routes =
    profile === PRODUCTION_PROFILE
      ? [...COMPONENT_ROUTES]
      : [...new Set(contractRoutes)];
  const unknownRoutes = routes.filter(
    (route) => !COMPONENT_ROUTES.includes(route),
  );
  if (unknownRoutes.length > 0)
    throw new Error(`unknown contract route(s): ${unknownRoutes.join(", ")}`);

  const descriptors = [];
  if (requirements.unit)
    descriptors.push(
      descriptor("unit:chromium", "unit", { engine: "chromium" }),
    );
  if (requirements.smoke)
    for (const engine of BROWSER_ENGINES)
      descriptors.push(descriptor(`smoke:${engine}`, "smoke", { engine }));
  if (requirements["all-browsers"])
    for (const engine of BROWSER_ENGINES)
      descriptors.push(
        descriptor(`all-browsers:${engine}`, "all-browsers", { engine }),
      );
  if (requirements.contracts)
    for (const route of routes)
      for (const project of CONTRACT_PROJECTS)
        for (const assertion of CONTRACT_ASSERTIONS)
          descriptors.push(
            descriptor(
              `contracts:${route}:${project}:${assertion.id}`,
              "contracts",
              { route, project, assertion: assertion.id },
            ),
          );

  descriptors.sort((left, right) => left.id.localeCompare(right.id));
  const ids = descriptors.map(({ id }) => id);
  if (new Set(ids).size !== ids.length)
    throw new Error("required evidence universe contains duplicate unit IDs");
  return descriptors;
}

function fingerprints(descriptor, context, universeDigest) {
  const shared = {
    schema: EVIDENCE_SCHEMA,
    profile: context.profile,
    tree: context.tree,
  };
  return {
    // The exact git tree is a deliberate superset of unit-specific inputs in schema 2. Git's tree
    // identity binds bytes, executable modes, and symlink blobs; later affected reuse may narrow the
    // subject set only after its shadow checkpoint.
    subject: sha256(
      canonicalJson({
        ...shared,
        gate: descriptor.gate,
        unit: descriptor.unit,
      }),
    ),
    // Gate implementation, configs, lockfile, dependencies, and transitive source all live in the
    // same tree. Binding the whole tree is conservative and independently reproducible.
    implementation: sha256(
      canonicalJson({ ...shared, gate: descriptor.gate, universeDigest }),
    ),
    toolchain: sha256(canonicalJson(context.toolchain)),
    authority: sha256(
      canonicalJson({
        contractSha256: context.contractSha256,
        unit: descriptor.unit,
      }),
    ),
  };
}

export function buildEvidenceManifest({
  profile,
  required = {},
  contractRoutes = [],
  tree,
  executedOnTree = tree,
  toolchain,
  contractSha256,
  passedGates = null,
}) {
  const descriptors = requiredEvidenceUniverse({
    profile,
    required,
    contractRoutes,
  });
  const requiredUniverseDigest = sha256(canonicalJson(descriptors));
  const allowed = passedGates ? new Set(passedGates) : null;
  const leaves = descriptors
    .filter(({ gate }) => !allowed || allowed.has(gate))
    .map((entry) => ({
      ...entry,
      profile,
      result: "pass",
      executedOnTree,
      fingerprints: fingerprints(
        entry,
        { profile, tree, toolchain, contractSha256 },
        requiredUniverseDigest,
      ),
    }));
  const byGate = Object.fromEntries(
    [...new Set(descriptors.map(({ gate }) => gate))]
      .sort()
      .map((gate) => [
        gate,
        descriptors.filter((entry) => entry.gate === gate).length,
      ]),
  );
  return {
    schema: EVIDENCE_SCHEMA,
    environment: PRODUCTION_ENVIRONMENT,
    requiredUniverse: {
      total: descriptors.length,
      byGate,
      digest: requiredUniverseDigest,
    },
    leaves,
    coverageRoot: sha256(canonicalJson(leaves)),
  };
}
