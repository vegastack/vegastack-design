#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  BROWSER_ENGINES,
  buildEvidenceManifest,
  CONTRACT_ASSERTIONS,
  CONTRACT_PROJECTS,
  FULL_CONTRACT_TESTS,
  PRODUCTION_PROFILE,
} from "./lib/gate-profile.mjs";
import { COMPONENT_ROUTES } from "./lib/route-scope.mjs";

function vitestEngines(base, complete) {
  const engines = new Set();
  for (const source of [base, complete])
    for (const match of source.matchAll(
      /browser:\s*"(chromium|firefox|webkit)"/g,
    ))
      engines.add(match[1]);
  return [...engines].sort();
}

function contractProjects(source) {
  const projects = /projects:\s*\[([\s\S]*?)\n\s*\],/.exec(source)?.[1] ?? "";
  return [...projects.matchAll(/name:\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
}

function verifySources({ base, complete, playwright, contracts }) {
  const problems = [];
  if (
    JSON.stringify(vitestEngines(base, complete)) !==
    JSON.stringify([...BROWSER_ENGINES].sort())
  )
    problems.push(
      "complete Vitest configuration does not resolve all three browser engines",
    );
  if (
    JSON.stringify(contractProjects(playwright)) !==
    JSON.stringify([...CONTRACT_PROJECTS].sort())
  )
    problems.push(
      "Playwright contract projects differ from the gate profile authority",
    );
  for (const { title } of CONTRACT_ASSERTIONS)
    if (!contracts.includes(`test(\`${"${route}"} ${title}\``))
      problems.push(
        `contract spec no longer declares assertion title: ${title}`,
      );
  return problems;
}

const sources = {
  base: readFileSync("packages/ui/vitest.config.ts", "utf8"),
  complete: readFileSync("packages/ui/vitest.all-browsers.config.ts", "utf8"),
  playwright: readFileSync("apps/docs/playwright.config.ts", "utf8"),
  contracts: readFileSync("apps/docs/vrt/contracts.spec.ts", "utf8"),
};
assert.deepEqual(verifySources(sources), []);

const production = buildEvidenceManifest({
  profile: PRODUCTION_PROFILE,
  required: {},
  contractRoutes: [],
  tree: "tree-" + "1".repeat(40),
  toolchain: { playwright: "fixture" },
  contractSha256: "a".repeat(64),
});
assert.equal(COMPONENT_ROUTES.length, new Set(COMPONENT_ROUTES).size);
assert.equal(
  FULL_CONTRACT_TESTS,
  COMPONENT_ROUTES.length *
    CONTRACT_PROJECTS.length *
    CONTRACT_ASSERTIONS.length,
);
assert.equal(production.requiredUniverse.byGate.contracts, FULL_CONTRACT_TESTS);
assert.equal(production.requiredUniverse.byGate.unit, 1);
assert.equal(production.requiredUniverse.byGate.smoke, BROWSER_ENGINES.length);
assert.equal(
  production.requiredUniverse.byGate["all-browsers"],
  BROWSER_ENGINES.length,
);
assert.equal(production.requiredUniverse.total, production.leaves.length);

for (const [label, mutation, pattern] of [
  [
    "missing WebKit",
    {
      ...sources,
      complete: sources.complete.replace('{ browser: "webkit" },', ""),
    },
    /three browser engines/,
  ],
  [
    "missing contract project",
    {
      ...sources,
      playwright: sources.playwright.replace(
        'name: "mobile-chromium-dark"',
        'name: "removed-mobile-dark"',
      ),
    },
    /contract projects/,
  ],
  [
    "renamed contract assertion",
    {
      ...sources,
      contracts: sources.contracts.replace(
        CONTRACT_ASSERTIONS[0].title,
        "renamed assertion",
      ),
    },
    /assertion title/,
  ],
]) {
  assert.ok(
    verifySources(mutation).some((problem) => pattern.test(problem)),
    `${label} mutation was not rejected for ${pattern}`,
  );
}

console.log(
  `✓ gate profile: ${COMPONENT_ROUTES.length} routes × ${CONTRACT_PROJECTS.length} projects × ` +
    `${CONTRACT_ASSERTIONS.length} assertions = ${FULL_CONTRACT_TESTS} contract leaves; unit + smoke + ` +
    `complete ${BROWSER_ENGINES.join("/")} universe = ${production.requiredUniverse.total}; 3 config mutations rejected`,
);
