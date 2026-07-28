#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CURRENT_SURFACES = [
  "AGENTS.md",
  "README.md",
  "docs/RELEASING.md",
  "skills/internal/ship/SKILL.md",
  "skills/internal/gates/SKILL.md",
  "skills/internal/review/SKILL.md",
  ".husky/pre-commit",
  ".husky/pre-push",
  "apps/docs/playwright.config.ts",
  "skills/internal/ship/references/release-gotchas.md",
];

const PRIVATE_INTERNAL = [
  /\/internal\/\*[^\n.]{0,120}\b(?:SSO|Access|protected|private)\b/i,
  /\b(?:SSO|Access|protected|private)\b[^\n.]{0,120}\/internal\/\*/i,
];

export function operatorDocProblems(sources) {
  const problems = [];
  for (const [file, source] of Object.entries(sources)) {
    if (file === "docs/requirements.md") continue;
    for (const pattern of file.endsWith("references/release-gotchas.md")
      ? []
      : PRIVATE_INTERNAL) {
      const match = pattern.exec(source);
      if (match)
        problems.push(
          `${file}: [internal-boundary] current instructions claim /internal/* is private: ${match[0]}`,
        );
    }
    if (/\b(?:96 contract routes|768 checks)\b/i.test(source))
      problems.push(
        `${file}: [contract-count] current instructions contain an obsolete route/check count`,
      );
    if (
      /runs on every PR in CI|CI runs (?:the )?(?:browser|Playwright)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [browser-location] current instructions claim a browser lane runs in CI`,
      );
    if (
      /upload(?:ing)?(?: success)?\s+(?:is|means|equals)\s+(?:deployment\s+)?complet(?:e|ion)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [deployment-terminal] current instructions equate artifact upload with deployment completion`,
      );
    if (
      /receipt[- ]guard[^\n]{0,80}(?:parallel|alongside)[^\n]{0,80}verify/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [receipt-first] current instructions claim expensive verification runs in parallel with receipt-guard`,
      );
  }

  const agents = sources["AGENTS.md"] ?? "";
  if (
    !/every non-registry route is anonymous/i.test(agents) ||
    !/including\s+`?\/internal\/\*`?/i.test(agents) ||
    !/`?\/r\/\*`? alone is service-token-only/i.test(agents)
  )
    problems.push(
      "AGENTS.md: [internal-boundary] must state that every non-registry route, including /internal/*, is anonymous and /r/* alone is service-token-only",
    );

  if (!/canonical[^\n]{0,80}(?:evidence-)?leaf manifest/i.test(agents))
    problems.push(
      "AGENTS.md: [receipt-profile] must state that a canonical evidence-leaf manifest is required",
    );
  if (!/CI is receipt-first/i.test(agents))
    problems.push(
      "AGENTS.md: [receipt-first] must state that CI verification is receipt-first",
    );

  const ship = sources["skills/internal/ship/SKILL.md"] ?? "";
  if (
    !/schema[- ]?2[\s\S]{0,160}production-full[\s\S]{0,220}all-browsers/i.test(
      ship,
    )
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [receipt-profile] must name schema 2, production-full, and all-browsers",
    );
  if (!/upload is not completion[\s\S]{0,180}deployment-complete/i.test(ship))
    problems.push(
      "skills/internal/ship/SKILL.md: [deployment-terminal] must distinguish upload from the deployment-complete terminal job",
    );

  const releasing = sources["docs/RELEASING.md"] ?? "";
  if (
    !/every non-registry route[^\n]{0,100}anonymously reachable/i.test(
      releasing,
    ) ||
    !/`?\/internal\/\*`?[\s\S]{0,100}unlisted[\s\S]{0,100}`?noindex`?[\s\S]{0,30}`?no-store`?/i.test(
      releasing,
    ) ||
    !/`?\/r\/\*`?[\s\S]{0,100}reject[\s\S]{0,30}anonymous/i.test(releasing)
  )
    problems.push(
      "docs/RELEASING.md: [internal-boundary] must describe the anonymous /internal/* and service-token-only /r/* production probes",
    );

  const requirements = sources["docs/requirements.md"] ?? "";
  if (
    !/point-in-time historical record[\s\S]{0,500}D11[\s\S]{0,300}superseded[\s\S]{0,300}\/internal\/\*[\s\S]{0,200}anonymous/i.test(
      requirements,
    )
  )
    problems.push(
      "docs/requirements.md: [historical-supersession] must explicitly mark the historical D11 /internal/* SSO topology as superseded by the anonymous boundary",
    );

  return problems;
}

function readCurrentSources() {
  return Object.fromEntries(
    [...CURRENT_SURFACES, "docs/requirements.md"].map((file) => [
      file,
      readFileSync(file, "utf8"),
    ]),
  );
}

// Semantic negative fixtures: each stale instruction must fail for its intended reason. These are
// virtual strings so historical ledgers and superseded plans can remain byte-stable records.
const validFixture = {
  "AGENTS.md":
    "Every non-registry route is anonymous, including /internal/*; /r/* alone is service-token-only. A canonical evidence-leaf manifest is required. CI is receipt-first.",
  "docs/RELEASING.md":
    "Every non-registry route is anonymously reachable; /internal/* remains unlisted with noindex/no-store; /r/* must reject anonymous requests.",
  "docs/requirements.md":
    "Point-in-time historical record. D11 is superseded: /internal/* is anonymous under the current boundary.",
  "skills/internal/ship/SKILL.md":
    "Schema 2 production-full evidence includes all-browsers. Upload is not completion; require deployment-complete.",
};
assert.deepEqual(operatorDocProblems(validFixture), []);
for (const [label, file, text, expected] of [
  [
    "internal SSO",
    "skills/internal/ship/SKILL.md",
    "/internal/* is protected by SSO.",
    /internal-boundary/,
  ],
  [
    "internal Access",
    "docs/RELEASING.md",
    "Cloudflare Access protects /internal/*.",
    /internal-boundary/,
  ],
  [
    "missing supersession",
    "docs/requirements.md",
    "D11 requires /internal/* SSO.",
    /historical-supersession/,
  ],
  [
    "obsolete contract count",
    "skills/internal/review/SKILL.md",
    "Run all 96 contract routes and 768 checks.",
    /contract-count/,
  ],
  [
    "browser in CI",
    "apps/docs/playwright.config.ts",
    "The browser gate runs on every PR in CI.",
    /browser-location/,
  ],
  [
    "weak deploy receipt",
    "skills/internal/ship/SKILL.md",
    "A scoped receipt is accepted for deploy.",
    /receipt-profile/,
  ],
  [
    "upload equals completion",
    "docs/RELEASING.md",
    "Upload success means deployment completion.",
    /deployment-terminal/,
  ],
  [
    "receipt and verify parallel",
    "AGENTS.md",
    "receipt-guard runs in parallel alongside verify.",
    /receipt-first/,
  ],
]) {
  const mutated = { ...validFixture, [file]: text };
  const problems = operatorDocProblems(mutated);
  assert.ok(
    problems.some((problem) => expected.test(problem)),
    `${label}: semantic fixture was not rejected for ${expected}`,
  );
}

const problems = operatorDocProblems(readCurrentSources());
if (problems.length > 0) {
  console.error(problems.map((problem) => `✗ ${problem}`).join("\n"));
  process.exit(1);
}
console.log(
  `✓ operator docs: ${CURRENT_SURFACES.length} current surfaces agree on topology, browser location, counts, receipt-first ordering, terminal deployment, and schema-2 production evidence; 8 semantic stale-instruction fixtures rejected`,
);
