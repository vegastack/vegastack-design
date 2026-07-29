import { createHash } from "node:crypto";

import { CONTRACT_ASSERTIONS, CONTRACT_PROJECTS } from "./gate-profile.mjs";

const keyFor = ({ route, project, assertion }) =>
  `${route}\0${project}\0${assertion}`;

export function expectedContractLeaves({
  routes,
  project = null,
  title = null,
}) {
  const projects = project ? [project] : CONTRACT_PROJECTS;
  const assertions = title
    ? CONTRACT_ASSERTIONS.filter(({ title: candidate }) =>
        title.endsWith(` ${candidate}`),
      )
    : CONTRACT_ASSERTIONS;
  const leaves = [];
  for (const route of [...new Set(routes)].sort())
    for (const selectedProject of projects)
      for (const assertion of assertions)
        leaves.push({
          route,
          project: selectedProject,
          assertion: assertion.id,
          title: `${route} ${assertion.title}`,
        });
  return leaves.sort((left, right) =>
    keyFor(left).localeCompare(keyFor(right)),
  );
}

export function contractLeavesFromPlaywright(report) {
  const leaves = [];
  const walk = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        const assertion = CONTRACT_ASSERTIONS.find(({ title }) =>
          spec.title.endsWith(` ${title}`),
        );
        const route = assertion
          ? spec.title.slice(0, -assertion.title.length - 1)
          : null;
        for (const test of spec.tests ?? [])
          leaves.push({
            route,
            project: test.projectName ?? null,
            assertion: assertion?.id ?? null,
            title: spec.title,
            outcome: test.results?.at(-1)?.status ?? null,
          });
      }
      walk(suite.suites);
    }
  };
  walk(report?.suites);
  return leaves;
}

export function reconcileContractLeaves(
  expected,
  actual,
  phase,
  { requirePassed = false } = {},
) {
  if (!Array.isArray(expected) || expected.length === 0)
    throw new Error("contract expected leaf universe is empty");
  if (!Array.isArray(actual) || actual.length === 0)
    throw new Error(`${phase} executed zero contract leaves`);
  const expectedKeys = expected.map(keyFor);
  const actualKeys = actual.map(keyFor);
  if (new Set(actualKeys).size !== actualKeys.length)
    throw new Error(`${phase} contains duplicate contract leaves`);
  const expectedSet = new Set(expectedKeys);
  const actualSet = new Set(actualKeys);
  const missing = expectedKeys.filter((key) => !actualSet.has(key));
  const extra = actualKeys.filter((key) => !expectedSet.has(key));
  if (missing.length > 0 || extra.length > 0)
    throw new Error(
      `${phase} contract leaf mismatch: missing=${missing.length}; extra=${extra.length}`,
    );
  if (requirePassed && actual.some(({ outcome }) => outcome !== "passed"))
    throw new Error(
      `${phase} contains a required leaf that did not pass (skipped/failed/unknown)`,
    );
  const ids = [...actualKeys].sort();
  return {
    expected: expectedKeys.length,
    executed: actualKeys.length,
    digest: createHash("sha256").update(JSON.stringify(ids)).digest("hex"),
    leaves: actual
      .map((leaf) => ({ ...leaf }))
      .sort((left, right) => keyFor(left).localeCompare(keyFor(right))),
  };
}
