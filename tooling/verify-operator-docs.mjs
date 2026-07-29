#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CURRENT_SURFACES = [
  "AGENTS.md",
  "README.md",
  "docs/README.md",
  "docs/RELEASING.md",
  "docs/plans/2026-07-28-public-site-private-registry-boundary.md",
  "skills/internal/ship/SKILL.md",
  "skills/internal/gates/SKILL.md",
  "skills/internal/review/SKILL.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/workflows/deploy.yml",
  ".github/workflows/runner-diagnostics.yml",
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
    // release-gotchas deliberately preserves a clearly labelled superseded boundary transcript.
    // Exclude only that block from current-boundary checks, not the rest of the file.
    const currentSource = file.endsWith("references/release-gotchas.md")
      ? source.split("## Historical completed release evidence")[0]
      : source;
    for (const pattern of PRIVATE_INTERNAL) {
      const match = pattern.exec(currentSource);
      if (match)
        problems.push(
          `${file}: [internal-boundary] current instructions claim /internal/* is private: ${match[0]}`,
        );
    }
    if (
      !file.endsWith("references/release-gotchas.md") &&
      /\b(?:96 contract routes|768 (?:component behaviour contracts|checks))\b/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [contract-count] current instructions contain an obsolete route/check count`,
      );
    if (/\b(?:seven|7) (?:CI |GitHub-)?hosted jobs\b/i.test(currentSource))
      problems.push(
        `${file}: [hosted-job-count] current instructions contain the obsolete hosted-job count`,
      );
    if (/\bbroad SSO\b|\bAccess verification\b/i.test(currentSource))
      problems.push(
        `${file}: [internal-boundary] current instructions retain the obsolete broad-Access topology`,
      );
    if (
      /\bnpm artifact provenance\b/i.test(currentSource) ||
      /npm(?:'s)? OIDC provenance(?: statement)? asserts/i.test(currentSource)
    )
      problems.push(
        `${file}: [npm-provenance] a private source repository must not claim npm provenance`,
      );
    if (/release:preflight[^\n]{0,160}throwaway worktree/i.test(currentSource))
      problems.push(
        `${file}: [preflight-location] release preflight is in-place and restores the tree; it is not a throwaway-worktree run`,
      );
    if (
      /workflow_dispatch[\s\S]{0,180}(?:HTTP )?500[\s\S]{0,180}retry[\s\S]{0,180}(?:newest|latest) run id/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [dispatch-recovery] current instructions retry before proving that no workflow run was created`,
      );
    if (/\b(?:across|in) 1082 files\b/i.test(currentSource))
      problems.push(
        `${file}: [historical-count] current instructions use a dated file count as a generic release invariant`,
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
    if (
      /exact-tree[^\n]{0,80}reuse[^\n]{0,80}(?:is enabled|skips? (?:the )?(?:browser|contract|planned))/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [reuse-shadow] current instructions claim exact-tree reuse is enabled or skips a planned lane`,
      );
    if (
      /retry pass[^\n]{0,100}(?:clears? (?:the )?(?:original )?failure|writes? (?:receipt )?evidence|satisf(?:y|ies) (?:the )?(?:gate|receipt))/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [retry-diagnostic] current instructions promote a retry pass into blocking evidence`,
      );
    if (
      /gates:affected[^\n]{0,160}(?:satisf(?:y|ies) (?:deploy|production)|reuse (?:is )?enabled|skips? (?:the )?(?:current )?oracle)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [affected-shadow] current instructions promote the shadow affected plan into reuse or production evidence`,
      );
    if (
      /(?:affected|diagnostic)[^\n]{0,60}consume[^\n]{0,160}(?:replaces?|skips?|satisf(?:y|ies))[^\n]{0,80}(?:CI|full|oracle)/i.test(
        source,
      ) ||
      /consume[^\n]{0,120}(?:reuseEnabled:\s*true|evidenceReusable:\s*true|writes? (?:a )?receipt)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [consume-shadow] current instructions promote selected consume diagnostics into reusable/full evidence`,
      );
    if (
      /consume[^\n]{0,120}(?:all roots share|shared across roots|accumulat(?:e|es|ing) roots)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [consume-isolation] current instructions allow one consumer to accumulate independent roots`,
      );
    if (
      /deploy candidate[^\n]{0,180}(?:reuse (?:is )?enabled|skips? (?:the )?(?:build|rebuild)|is (?:the )?production (?:input|source))/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [candidate-shadow] current instructions promote the exact-main candidate into production reuse`,
      );
    if (
      /(?:missing|expired)[^\n]{0,80}deploy candidate[^\n]{0,100}(?:blocks?|fails? (?:the )?deploy)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [candidate-fallback] current instructions make an absent shadow candidate block the mandatory rebuild fallback`,
      );
    if (
      /registry-only[^\n]{0,100}(?:always|must)[^\n]{0,80}(?:publish|hosted npm)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [release-state] current instructions claim registry-only work always publishes npm`,
      );
    if (
      /(?:timeout|5xx|registry unknown)[^\n]{0,100}(?:means|is treated as)[^\n]{0,60}(?:unpublished|publish)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [release-state] current instructions convert npm uncertainty into publication permission`,
      );
    if (/classify-change[^\n]{0,40}--check-npm/i.test(source))
      problems.push(
        `${file}: [release-state] current instructions use the removed fail-open npm classifier path`,
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
  if (
    !/\/internal\/\*[\s\S]{0,180}unlisted[\s\S]{0,100}noindex[\s\S]{0,100}no-store/i.test(
      agents,
    )
  )
    problems.push(
      "AGENTS.md: [internal-discovery] must require /internal/* to remain unlisted with noindex and no-store",
    );

  if (!/canonical[^\n]{0,80}(?:evidence-)?leaf manifest/i.test(agents))
    problems.push(
      "AGENTS.md: [receipt-profile] must state that a canonical evidence-leaf manifest is required",
    );
  if (!/CI is receipt-first/i.test(agents))
    problems.push(
      "AGENTS.md: [receipt-first] must state that CI verification is receipt-first",
    );
  if (!/exact-tree[\s\S]{0,100}reuse is \*\*shadow-only\*\*/i.test(agents))
    problems.push(
      "AGENTS.md: [reuse-shadow] must state that exact-tree reuse is shadow-only",
    );
  if (
    !/Release state is explicit and fail-closed[\s\S]{0,300}Only npm E404[\s\S]{0,300}zero hosted npm jobs/i.test(
      agents,
    )
  )
    problems.push(
      "AGENTS.md: [release-state] must state exact-version fail-closed lookup and registry-only hosted-job skip",
    );
  if (
    !/consume[\s\S]{0,500}(?:fresh|clean|reset-isolated)[^\n]{0,100}(?:root|consumer)[\s\S]{0,500}(?:D1|full oracle)[\s\S]{0,180}(?:required|mandatory)/i.test(
      agents,
    )
  )
    problems.push(
      "AGENTS.md: [consume-isolation] must require isolated consume roots and retain the full oracle under D1",
    );
  if (
    !/deploy candidate[^\n]{0,100}shadow-only/i.test(agents) ||
    !/D4 remains open/i.test(agents) ||
    !/mandatory\s+exact-tree rebuild/i.test(agents)
  )
    problems.push(
      "AGENTS.md: [candidate-shadow] must state shadow-only/D4 and retain the mandatory exact-tree rebuild",
    );

  const ship = sources["skills/internal/ship/SKILL.md"] ?? "";
  if (!/git fetch (?:--prune origin|origin --prune)/i.test(ship))
    problems.push(
      "skills/internal/ship/SKILL.md: [fresh-origin] must fetch/prune origin before release classification and origin/main inspection",
    );
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
  if (
    !/versioned-unpublished[\s\S]{0,160}hosted/i.test(ship) ||
    !/registry-unknown[^\n]{0,120}publish permission/i.test(ship)
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [release-state] must limit hosted npm work and block registry uncertainty",
    );
  if (
    !/deploy candidate[^\n]{0,100}shadow-only/i.test(ship) ||
    !/missing or expired candidate[^\n]{0,120}(?:safe miss|rebuild)/i.test(
      ship,
    ) ||
    !/(?:malformed|ambiguous)[\s\S]{0,180}(?:fail|block)/i.test(ship)
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [candidate-shadow] must explain shadow, safe miss fallback, and malformed/ambiguous failure",
    );

  const gates = sources["skills/internal/gates/SKILL.md"] ?? "";
  if (
    !/gates:retry[\s\S]{0,300}diagnosticOnly[\s\S]{0,120}evidenceWritten: false/i.test(
      gates,
    )
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [retry-diagnostic] must state that retry is diagnostic-only and writes no evidence",
    );
  if (
    !/gates:affected[\s\S]{0,600}shadowOnly: true[\s\S]{0,160}reuseEnabled: false[\s\S]{0,700}30 representative[\s\S]{0,180}MK approval/i.test(
      gates,
    )
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [affected-shadow] must state shadow-only/no-reuse, 30 representative samples, and MK approval",
    );
  if (
    !/verify-shadcn-consume[\s\S]{0,500}(?:fresh|clean|reset-isolated)[^\n]{0,100}(?:root|consumer)[\s\S]{0,500}D1[\s\S]{0,180}(?:full|oracle)/i.test(
      gates,
    )
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [consume-isolation] must explain isolated modes and D1 full-oracle retention",
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
  if (
    !/Release uses an explicit resumable state machine/i.test(releasing) ||
    !/registry-unknown[^\n]{0,120}(?:blocks|fail closed)/i.test(releasing) ||
    !/registry-only[^\n]{0,120}never runs/i.test(releasing)
  )
    problems.push(
      "docs/RELEASING.md: [release-state] must explain states, unknown blocking, and registry-only npm skips",
    );
  if (
    !/deploy candidate[\s\S]{0,300}shadow-only[\s\S]{0,220}mandatory exact-tree rebuild[\s\S]{0,300}D4/i.test(
      releasing,
    )
  )
    problems.push(
      "docs/RELEASING.md: [candidate-shadow] must keep candidate reuse disabled and the exact-tree rebuild authoritative under D4",
    );

  const boundary =
    sources["docs/plans/2026-07-28-public-site-private-registry-boundary.md"] ??
    "";
  if (
    boundary &&
    (!/deployment-complete/i.test(boundary) ||
      !/structured Cloudflare version ID/i.test(boundary))
  )
    problems.push(
      "docs/plans/2026-07-28-public-site-private-registry-boundary.md: [deployment-terminal] current boundary runbook must require deployment-complete and the structured Cloudflare version ID",
    );

  const diagnostics = sources[".github/workflows/runner-diagnostics.yml"] ?? "";
  if (
    /playwright test[^\n]*contracts\.spec\.ts/i.test(diagnostics) ||
    /lsof -ti[^\n]*tcp:/i.test(diagnostics) ||
    /playwright test[^\n]*contracts\.spec\.ts[^\n]*\|\| true/i.test(diagnostics)
  )
    problems.push(
      ".github/workflows/runner-diagnostics.yml: [diagnostic-wrapper] contract diagnostics must use contracts-run.mjs and its owned server cleanup",
    );
  if (
    diagnostics &&
    (!/steps\.all_browsers\.outcome/.test(diagnostics) ||
      !/steps\.contracts\.outcome/.test(diagnostics) ||
      !/complete three-engine suite/i.test(diagnostics) ||
      !/complete contract suite/i.test(diagnostics))
  )
    problems.push(
      ".github/workflows/runner-diagnostics.yml: [diagnostic-verdict] the summary must report both deep-suite outcomes explicitly",
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
    "Every non-registry route is anonymous, including /internal/*; /r/* alone is service-token-only. /internal/* remains unlisted with noindex and no-store. A canonical evidence-leaf manifest is required. CI is receipt-first. Exact-tree receipt reuse is **shadow-only**. Release state is explicit and fail-closed. Only npm E404 is missing; registry-only published means zero hosted npm jobs. Consume uses a fresh consumer per root; D1 keeps the full oracle mandatory. The deploy candidate is shadow-only. D4 remains open; the mandatory exact-tree rebuild remains.",
  "docs/RELEASING.md":
    "Every non-registry route is anonymously reachable; /internal/* remains unlisted with noindex/no-store; /r/* must reject anonymous requests. Release uses an explicit resumable state machine: registry-unknown blocks. For registry-only published work it never runs hosted npm. The deploy candidate is shadow-only; a mandatory exact-tree rebuild remains under D4.",
  "docs/requirements.md":
    "Point-in-time historical record. D11 is superseded: /internal/* is anonymous under the current boundary.",
  "skills/internal/ship/SKILL.md":
    "Run git fetch --prune origin before classification. Schema 2 production-full evidence includes all-browsers. Upload is not completion; require deployment-complete. versioned-unpublished alone runs hosted build; registry-unknown never grants publish permission. The deploy candidate is shadow-only. A missing or expired candidate is a safe miss and uses the rebuild; malformed or ambiguous evidence must fail.",
  "skills/internal/gates/SKILL.md":
    "gates:retry writes diagnosticOnly: true and evidenceWritten: false. gates:affected writes shadowOnly: true and reuseEnabled: false. Require 30 representative samples and MK approval. verify-shadcn-consume uses a fresh consumer per root; D1 retains the full oracle.",
  "docs/plans/2026-07-28-public-site-private-registry-boundary.md":
    "Require deployment-complete and the structured Cloudflare version ID.",
  ".github/workflows/runner-diagnostics.yml":
    "${{ steps.all_browsers.outcome }} ${{ steps.contracts.outcome }} complete three-engine suite complete contract suite",
};
assert.deepEqual(operatorDocProblems(validFixture), []);
const semanticFixtures = [
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
    "obsolete hosted-job count",
    "README.md",
    "Seven hosted jobs remain.",
    /hosted-job-count/,
  ],
  [
    "broad access topology",
    "README.md",
    "Broad SSO remains until cutover and requires Access verification.",
    /internal-boundary/,
  ],
  [
    "private-repository npm provenance",
    ".github/workflows/release.yml",
    "npm artifact provenance: npm's OIDC provenance statement asserts these bytes were built here.",
    /npm-provenance/,
  ],
  [
    "throwaway preflight",
    "skills/internal/ship/references/release-gotchas.md",
    "release:preflight simulates the bump in a throwaway worktree.",
    /preflight-location/,
  ],
  [
    "unsafe dispatch retry ordering",
    "skills/internal/ship/references/release-gotchas.md",
    "workflow_dispatch HTTP 500: retry, then compare the newest run id.",
    /dispatch-recovery/,
  ],
  [
    "generic historical file count",
    "skills/internal/ship/SKILL.md",
    "Version carry restamps provenance across 1082 files.",
    /historical-count/,
  ],
  [
    "direct diagnostic contract bypass",
    ".github/workflows/runner-diagnostics.yml",
    "pnpm exec playwright test contracts.spec.ts --reporter=line || true\nlsof -ti tcp:$PORT",
    /diagnostic-wrapper/,
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
  [
    "enabled exact-tree reuse",
    "skills/internal/gates/SKILL.md",
    "Exact-tree receipt reuse is enabled and skips browser lanes.",
    /reuse-shadow/,
  ],
  [
    "retry promoted to evidence",
    "skills/internal/gates/SKILL.md",
    "A retry pass clears the original failure and writes receipt evidence.",
    /retry-diagnostic/,
  ],
  [
    "affected promoted to production",
    "skills/internal/gates/SKILL.md",
    "gates:affected satisfies production and reuse is enabled.",
    /affected-shadow/,
  ],
  [
    "affected consume replaces full",
    "skills/internal/gates/SKILL.md",
    "Affected consume replaces the full CI oracle.",
    /consume-shadow/,
  ],
  [
    "consume writes receipt evidence",
    "skills/internal/gates/SKILL.md",
    "Consume evidenceReusable: true and writes a receipt.",
    /consume-shadow/,
  ],
  [
    "consume accumulates roots",
    "skills/internal/gates/SKILL.md",
    "Consume uses one shared consumer across roots.",
    /consume-isolation/,
  ],
  [
    "registry-only always publishes",
    "docs/RELEASING.md",
    "Registry-only changes must always publish npm.",
    /release-state/,
  ],
  [
    "npm timeout grants publish",
    "skills/internal/ship/SKILL.md",
    "An npm timeout means unpublished, so publish.",
    /release-state/,
  ],
  [
    "removed classifier lookup",
    "skills/internal/ship/references/release-gotchas.md",
    "Run classify-change --check-npm to decide publication.",
    /release-state/,
  ],
  [
    "candidate promoted to production",
    "docs/RELEASING.md",
    "Deploy candidate reuse is enabled and skips the rebuild.",
    /candidate-shadow/,
  ],
  [
    "expired candidate blocks fallback",
    "skills/internal/ship/SKILL.md",
    "An expired deploy candidate fails the deploy instead of rebuilding.",
    /candidate-fallback/,
  ],
];
for (const [label, file, text, expected] of semanticFixtures) {
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
  `✓ operator docs: ${CURRENT_SURFACES.length} current surfaces agree on topology, browser location, counts, receipt/reuse/retry/affected/consume/release-state/candidate ordering, terminal deployment, and schema-2 production evidence; ${semanticFixtures.length} semantic stale-instruction fixtures rejected`,
);
