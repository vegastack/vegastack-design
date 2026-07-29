#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { FULL_CONTRACT_TESTS } from "./lib/gate-profile.mjs";
import { COMPONENT_ROUTES } from "./lib/route-scope.mjs";

const CURRENT_SURFACES = [
  "AGENTS.md",
  "README.md",
  "docs/README.md",
  "docs/RELEASING.md",
  "docs/plans/2026-07-28-public-site-private-registry-boundary.md",
  "skills/internal/ship/SKILL.md",
  "skills/internal/ship/references/visual-review.md",
  "skills/internal/gates/SKILL.md",
  "skills/internal/review/SKILL.md",
  "skills/internal/component/references/testing.md",
  "skills/internal/component/SKILL.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/workflows/deploy.yml",
  ".github/workflows/runner-diagnostics.yml",
  ".husky/pre-commit",
  ".husky/pre-push",
  "apps/docs/playwright.config.ts",
  "apps/docs/vrt/components.spec.ts",
  "apps/docs/vrt/page-routes.ts",
  "apps/docs/vrt/page-routes.generated.ts",
  "package.json",
  "turbo.json",
  "packages/ui/vitest.config.ts",
  "packages/ui/vitest.smoke.config.ts",
  "packages/ui/vitest.all-browsers.config.ts",
  "packages/ui/vitest.setup.ts",
  "skills/internal/ship/references/release-gotchas.md",
  "tooling/verify-release-chain.mjs",
  "tooling/gate-receipt-carry.mjs",
  "tooling/release-classify.mjs",
  "tooling/verify-classify-change.mjs",
  "tooling/lib/change-set.mjs",
  "tooling/deploy-candidate.mjs",
  "tooling/contracts-run.mjs",
  "tooling/gates.mjs",
  "tooling/gates-retry.mjs",
  "tooling/gates-affected.mjs",
  "tooling/impact-plan.mjs",
  "tooling/vitest-run.mjs",
  "tooling/vrt-review.mjs",
  "tooling/sync-vrt-page-routes.mjs",
  "tooling/verify-component-contracts.mjs",
  "tooling/lib/import-closure.mjs",
  "tooling/lib/authority-fingerprint.mjs",
  "tooling/lib/gate-impact.mjs",
  "tooling/lib/contract-selection.mjs",
  "tooling/lib/gate-report-validation.mjs",
  "tooling/lib/affected-paths.mjs",
  "tooling/lib/consume-plan.mjs",
  "tooling/lib/consume-isolation.mjs",
  "tooling/lib/vitest-selection.mjs",
  "tooling/lib/vrt-selection.mjs",
  "tooling/verify-gate-receipt.mjs",
  "apps/docs/scripts/probe-deployment.mjs",
  "apps/docs/package.json",
  "packages/ui/package.json",
  "packages/ui/component-contracts.json",
];

const WORKFLOW_FILES = readdirSync(".github/workflows")
  .filter((file) => /\.ya?ml$/.test(file))
  .sort();
const WORKFLOW_SOURCES = Object.fromEntries(
  WORKFLOW_FILES.map((file) => [
    `.github/workflows/${file}`,
    readFileSync(`.github/workflows/${file}`, "utf8"),
  ]),
);
const HOSTED_JOB_COUNT = Object.values(WORKFLOW_SOURCES).reduce(
  (count, source) =>
    count +
    Object.values(parse(source).jobs ?? {}).filter(
      (job) => job?.["runs-on"] === "ubuntu-latest",
    ).length,
  0,
);
const NUMBER_WORDS = new Map([
  ["zero", 0],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10],
]);
const numberValue = (token) =>
  /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS.get(token.toLowerCase());

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
    if (!file.endsWith("references/release-gotchas.md")) {
      for (const match of currentSource.matchAll(
        /\b(\d+)\s+(?:contract\s+routes|routes\s*\/\s*\d+\s+(?:component\s+)?behaviou?r\s+contracts?)\b/gi,
      )) {
        const actual = Number(match[1]);
        if (actual !== COMPONENT_ROUTES.length)
          problems.push(
            `${file}: [contract-count] claims ${actual} contract routes; machine authority requires ${COMPONENT_ROUTES.length}`,
          );
      }
      for (const match of currentSource.matchAll(
        /\b(\d+)\s+(?:(?:component\s+)?behaviou?r\s+contracts?|contract\s+checks|checks)\b/gi,
      )) {
        const actual = Number(match[1]);
        if (actual !== FULL_CONTRACT_TESTS)
          problems.push(
            `${file}: [contract-count] claims ${actual} complete contract checks; machine authority requires ${FULL_CONTRACT_TESTS}`,
          );
      }
    }
    const hostedClaims = [
      ...currentSource.matchAll(
        /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:(?:CI|GitHub|workflow)[- ]?)?hosted\s+(?:workflow\s+)?jobs\b/gi,
      ),
      ...currentSource.matchAll(
        /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:CI|workflow)\s+jobs?\s+(?:are|stay|remain)?\s*(?:GitHub-)?hosted\b/gi,
      ),
    ];
    for (const match of hostedClaims) {
      const actual = numberValue(match[1]);
      if (actual !== HOSTED_JOB_COUNT)
        problems.push(
          `${file}: [hosted-job-count] claims ${actual} hosted workflow jobs; workflow definitions require ${HOSTED_JOB_COUNT}`,
        );
    }
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
    for (const match of currentSource.matchAll(/\b(?:1058|1082)\b/g)) {
      const window = currentSource.slice(
        Math.max(0, match.index - 220),
        match.index + 220,
      );
      if (
        !/(?:dated|measured|2026-07-25|Version Packages \(#1\)|historical incident)/i.test(
          window,
        )
      )
        problems.push(
          `${file}: [historical-count] current instructions use a dated file count without labelling its incident/date`,
        );
    }
    if (
      /runs on every PR in CI|CI runs (?:the )?(?:browser|Playwright)/i.test(
        source,
      ) ||
      /browser jobs? must stay GitHub-hosted/i.test(source)
    )
      problems.push(
        `${file}: [browser-location] current instructions claim a browser lane runs in CI`,
      );
    if (/every step is `continue-on-error`/i.test(source))
      problems.push(
        `${file}: [diagnostic-verdict] diagnostic probes may continue for collection, but structured reconciliation and the terminal verdict must fail closed`,
      );
    if (/test:all-browsers[^\n]{0,100}\(main\/release\)/i.test(source))
      problems.push(
        `${file}: [browser-location] the complete browser suite is local /ship or diagnostic evidence, never a main/Release CI lane`,
      );
    if (
      /main\/release runs the complete suite in all three engines/i.test(source)
    )
      problems.push(
        `${file}: [browser-location] machine authority must not claim main/Release CI executes the complete browser suite`,
      );
    for (const match of source.matchAll(
      /WebKit \+ Firefox|real WebKit and Firefox|WebKit\/Firefox risk smoke/gi,
    )) {
      const lineStart = source.lastIndexOf("\n", match.index) + 1;
      const lineEnd = source.indexOf("\n", match.index);
      const line = source.slice(
        lineStart,
        lineEnd < 0 ? source.length : lineEnd,
      );
      if (!/Chromium/i.test(line))
        problems.push(
          `${file}: [smoke-engines] current smoke runs Chromium, WebKit, and Firefox; a two-engine label understates executed coverage`,
        );
    }
    if (
      /Every browser lane[^\n]{0,100}(?:git hooks|through (?:the )?hooks)/i.test(
        currentSource,
      ) ||
      /(?:three-engine|all-browsers|complete browser)[^\n]{0,100}(?:runs? (?:in|through)|in)[^\n]{0,50}(?:\.husky\/pre-push|pre-push)/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [browser-location] complete all-browser execution is ship-only, not a pre-push hook lane`,
      );
    if (
      /(?:full|complete)[^\n]{0,80}(?:100\+|900\+)[^\n]{0,40}(?:file|suite|test)/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [generic-test-count] current instructions/config comments must derive test inventory rather than quote a generic count`,
      );
    if (
      /gates:ship[^\n]{0,100}~20min|suite takes 1m39s locally|three engines \(measured 1m39s\)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [timing-generation] historical ship/browser timings must not be presented as current after the retained 48m25s/7m12s completion sample`,
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
      /(?:documentation|docs|markdown)[^\n]{0,100}(?:always|automatically)[^\n]{0,60}skip[^\n]{0,100}(?:browser|contract|vrt)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-rendered-docs] a docs label cannot skip product lanes; rendered MDX, previews, styles, and shared docs runtime remain product inputs`,
      );
    if (
      /component change[^\n]{0,100}(?:only (?:the )?changed component|ignore dependents)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-dependent-closure] component verification must include every reachable dependent component, test, route, preview, and consumer`,
      );
    if (
      /gates:component[^\n]{0,100}(?:that|the) component(?:'s)? (?:own )?unit test/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [dynamic-dependent-closure] component guidance must say reachable dependent test/route closure, not one own test`,
      );
    if (
      /unknown path[^\n]{0,100}(?:safely )?skip[^\n]{0,80}(?:browser|contract|product)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-unknown] unknown or unmodeled paths widen coverage; they never authorize a skip`,
      );
    if (
      /(?:registry|import)[^\n]{0,80}(?:vitest|selector)[^\n]{0,80}disagree[^\n]{0,100}(?:use|choose|prefer|take)(?: the)? (?:smaller|narrower)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-disagreement] independent selector disagreement must widen to full coverage, never the smaller set`,
      );
    for (const line of currentSource.split("\n"))
      if (
        /disagree/i.test(line) &&
        /bounded|union/i.test(line) &&
        !/full/i.test(line)
      )
        problems.push(
          `${file}: [dynamic-disagreement] bounded-union disagreement is not approved; disagreement must widen full`,
        );
    if (
      /every (?:non-unchanged|changed) entry[^\n]{0,160}(?:before[^\n]{0,40}after[^\n]{0,40}diff|all three)/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [visual-handoff] status-specific artifacts are required; new/removed/broken entries cannot promise all three images`,
      );
    if (/\.gates\/affected-shadow\.json/i.test(currentSource))
      problems.push(
        `${file}: [affected-schema] current affected reports live under .gates/diagnostics/affected`,
      );
    if (
      /gates:affected[\s\S]{0,500}shadowOnly:\s*true[\s\S]{0,200}reuseEnabled:\s*false/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [affected-schema] current summary uses rollout.enabled/checkpointEligible/cohort; obsolete top-level shadow fields must not be instructed`,
      );
    if (
      /(?:unit|smoke|browser|contract|vrt|consume) lane was safely[- ]skipped\.?$/im.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-skip-reason] safely-skipped requires a machine reason and selector/input digest`,
      );
    if (
      /public skills?[^\n]{0,100}(?:operational[- ]only|operational prose)[^\n]{0,120}(?:skip|omit)[^\n]{0,100}(?:package mirror|package build|skill mirror)/i.test(
        source,
      )
    )
      problems.push(
        `${file}: [dynamic-public-skill] public skills are non-rendered package inputs, so rendered lanes may skip but mirror/export/package-build checks remain required`,
      );
    if (
      /(?:affected|diagnostic)[^\n]{0,60}consume[^\n]{0,160}(?:replaces?|skips?|satisf(?:y|ies))[^\n]{0,80}(?:CI|full|oracle)/i.test(
        source,
      ) ||
      /consume[^\n]{0,120}(?:reuseEnabled:\s*true|evidenceReusable:\s*true|(?:does|will|may) write (?:a )?receipt)/i.test(
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
    if (/gates:?push[^\n]{0,100}runs (?:the )?umbrella/i.test(source))
      problems.push(
        `${file}: [gate-lint] gates:push runs Turbo lint, not the root pnpm lint umbrella`,
      );
    if (/hosted provenance build/i.test(currentSource))
      problems.push(
        `${file}: [npm-provenance] the hosted package producer is an isolation/exact-byte boundary, not a provenance build`,
      );
    if (
      file === "tooling/verify-release-chain.mjs" &&
      /simulated[\s\S]{0,160}THROWAWAY WORKTREE/i.test(currentSource)
    )
      problems.push(
        `${file}: [preflight-location] source help contradicts the executable in-place restore behavior`,
      );
    if (
      file === "apps/docs/package.json" &&
      /"test:contracts"\s*:\s*"(?!node \.\.\/\.\.\/tooling\/contracts-run\.mjs --all)[^"]*playwright test/i.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [diagnostic-wrapper] contract aliases must use tooling/contracts-run.mjs, never direct Playwright`,
      );
    if (
      file === "packages/ui/package.json" &&
      !/"test:all-browsers"\s*:\s*"node \.\.\/\.\.\/tooling\/vitest-run\.mjs --lane all-browsers"/.test(
        currentSource,
      )
    )
      problems.push(
        `${file}: [browser-wrapper] the standard complete-browser command must own structured nonempty reporting through tooling/vitest-run.mjs`,
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
  if (
    !/structured probe count[\s\S]{0,120}exact registry version/i.test(agents)
  )
    problems.push(
      "AGENTS.md: [deployment-terminal] must require structured live-probe count/state and exact registry version",
    );
  if (
    !/gates:plan/i.test(agents) ||
    !/operational\s+prose/i.test(agents) ||
    !/rendered MDX/i.test(agents) ||
    !/selector digest/i.test(agents) ||
    !/Production continues to require one complete exact-tree/i.test(agents) ||
    !/gates:ship`? proof/i.test(agents)
  )
    problems.push(
      "AGENTS.md: [dynamic-impact] must distinguish operational prose from rendered docs, require machine skip reasons/digests, and retain complete production ship",
    );
  if (
    !/Public skills[\s\S]{0,160}shipped package inputs/i.test(agents) ||
    !/skill-mirror[\s\S]{0,100}package-build checks/i.test(agents)
  )
    problems.push(
      "AGENTS.md: [dynamic-public-skill] must retain mirror/export/package-build checks for non-rendered public skills",
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
  if (
    !/upload is not completion[\s\S]{0,180}deployment-complete/i.test(ship) ||
    !/structured probe count[\s\S]{0,160}exact registry version/i.test(ship)
  )
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
  if (
    !/plain-language bullet/i.test(ship) ||
    !/changed\s*=\s*Before\/After\/Difference/i.test(ship) ||
    !/new\s*=\s*After/i.test(ship) ||
    !/removed\s*=\s*Before/i.test(ship) ||
    !/broken[\s\S]{0,160}no visual verdict/i.test(ship) ||
    !/absolute[\s\S]{0,160}clickable path/i.test(ship)
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [visual-handoff] must require plain-language bullets and status-appropriate absolute screenshot/report paths",
    );
  if (
    !/gates:plan/i.test(ship) ||
    !/Operational plans/i.test(ship) ||
    !/rendered MDX/i.test(ship) ||
    !/reachable dependent/i.test(ship) ||
    !/terminal `pnpm gates:ship` remains the complete exact-final-tree/i.test(
      ship,
    )
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [dynamic-impact] must use machine impact reasons while retaining complete final-tree ship",
    );
  if (
    !/Public skills[\s\S]{0,180}ship inside `@vegastack\/design`/i.test(ship) ||
    !/skill-mirror[\s\S]{0,100}package-build checks/i.test(ship)
  )
    problems.push(
      "skills/internal/ship/SKILL.md: [dynamic-public-skill] must retain mirror/export/package-build checks for public skills",
    );

  const visualReview =
    sources["skills/internal/ship/references/visual-review.md"] ?? "";
  if (
    !/plain-language bullet/i.test(visualReview) ||
    !/changed`?\s*=\s*Before\/After\/Difference/i.test(visualReview) ||
    !/new`?\s*=\s*After/i.test(visualReview) ||
    !/removed`?\s*=\s*Before/i.test(visualReview) ||
    !/broken[\s\S]{0,180}not a visual verdict/i.test(visualReview) ||
    !/absolute[\s\S]{0,180}clickable Markdown/i.test(visualReview)
  )
    problems.push(
      "skills/internal/ship/references/visual-review.md: [visual-handoff] must explain the change plainly and expose every status-appropriate absolute screenshot/report path",
    );
  if (
    !/gates:plan/i.test(visualReview) ||
    !/rendered MDX/i.test(visualReview) ||
    !/selector digest/i.test(visualReview)
  )
    problems.push(
      "skills/internal/ship/references/visual-review.md: [dynamic-rendered-docs] must distinguish operational prose from rendered MDX and require a reasoned VRT skip",
    );

  const releaseGotchas =
    sources["skills/internal/ship/references/release-gotchas.md"] ?? "";
  if (
    !/verify-shadcn-consume[\s\S]{0,500}(?:builds|build)[\s\S]{0,200}pnpm pack --json[\s\S]{0,300}(?:declared export|exported)/i.test(
      releaseGotchas,
    )
  )
    problems.push(
      "skills/internal/ship/references/release-gotchas.md: [consume-artifact] must require a self-owned public-package build and packed-export validation",
    );

  const gates = sources["skills/internal/gates/SKILL.md"] ?? "";
  if (
    !/gates:plan/i.test(gates) ||
    !/rendered MDX/i.test(gates) ||
    !/reachable dependent/i.test(gates) ||
    !/planned, listed, and executed/i.test(gates) ||
    !/Dynamic pre-push execution is still disabled/i.test(gates)
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [dynamic-impact] must require dependent closure, exact nonempty reconciliation, and disabled activation",
    );
  if (
    !/skills\/public\/\*\*[\s\S]{0,160}non-rendered package inputs/i.test(
      gates,
    ) ||
    !/skill-mirror[\s\S]{0,100}`@vegastack\/design` build checks/i.test(gates)
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [dynamic-public-skill] must retain mirror/export/package-build checks for public skills",
    );
  if (
    !/gates:retry[\s\S]{0,300}diagnosticOnly[\s\S]{0,120}evidenceWritten: false/i.test(
      gates,
    )
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [retry-diagnostic] must state that retry is diagnostic-only and writes no evidence",
    );
  if (
    !/gates:affected[\s\S]{0,900}rollout\.enabled: false[\s\S]{0,250}reuseEnabled: false[\s\S]{0,900}30 representative[\s\S]{0,240}MK approval/i.test(
      gates,
    ) ||
    !/gates:affected:checkpoint -- --scenario <name>/i.test(gates) ||
    !/no agreeing greater-than-six-route foundation fixture/i.test(gates)
  )
    problems.push(
      "skills/internal/gates/SKILL.md: [affected-shadow] must state rollout disabled/no-reuse, 30 representative samples, and MK approval",
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
    !/structured probe state\/count[\s\S]{0,100}exact registry version/i.test(
      releasing,
    )
  )
    problems.push(
      "docs/RELEASING.md: [deployment-terminal] must require the structured probe state/count and exact registry version",
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

  for (const [file, current] of [
    ["AGENTS.md", sources["AGENTS.md"] ?? ""],
    ["docs/RELEASING.md", releasing],
    ["skills/internal/ship/SKILL.md", ship],
    [
      "skills/internal/review/SKILL.md",
      sources["skills/internal/review/SKILL.md"] ?? "",
    ],
  ])
    if (
      !/no agreeing greater-than-six-route foundation fixture/i.test(current) ||
      !/do not collect (?:a )?qualifying (?:cohort|checkpoint samples)/i.test(
        current,
      ) ||
      !/(?:authority|policy) blocker[\s\S]{0,160}MK|MK[\s\S]{0,160}(?:authority|policy) blocker/i.test(
        current,
      )
    )
      problems.push(
        `${file}: [affected-checkpoint-blocker] must say the 0/30 foundation checkpoint is machine-blocked and forbid qualifying collection before MK resolves the authority/policy blocker`,
      );

  const boundary =
    sources["docs/plans/2026-07-28-public-site-private-registry-boundary.md"] ??
    "";
  if (
    boundary &&
    (!/deployment-complete/i.test(boundary) ||
      !/structured Cloudflare version ID/i.test(boundary) ||
      !/passing probe count[\s\S]{0,80}exact\s+registry version/i.test(
        boundary,
      ))
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
      !/complete contract suite/i.test(diagnostics) ||
      !/vegastack-browser-launch-diagnostic/i.test(diagnostics) ||
      !/id: structured-reports[\s\S]*report\.executed > 0/i.test(diagnostics))
  )
    problems.push(
      ".github/workflows/runner-diagnostics.yml: [diagnostic-verdict] the summary must report both deep-suite outcomes explicitly",
    );
  const componentContracts =
    sources["packages/ui/component-contracts.json"] ?? "";
  if (
    componentContracts &&
    !/three-engine contract-risk-selected smoke/i.test(componentContracts)
  )
    problems.push(
      "packages/ui/component-contracts.json: [smoke-engines] current machine rationale must describe the selected smoke as three-engine",
    );

  const deploymentProbe =
    sources["apps/docs/scripts/probe-deployment.mjs"] ?? "";
  if (
    deploymentProbe &&
    (!/--report\s+<path>/i.test(deploymentProbe) ||
      !/kind:\s*["']vegastack-deployment-probe["']/i.test(deploymentProbe) ||
      !/state:\s*(?:terminalState|["'](?:pass|fail)["'])/i.test(
        deploymentProbe,
      ))
  )
    problems.push(
      "apps/docs/scripts/probe-deployment.mjs: [probe-report] the live probe must offer --help/--report and emit a terminal structured state",
    );

  const deployWorkflow = sources[".github/workflows/deploy.yml"] ?? "";
  if (
    deployWorkflow &&
    (!/probe-deployment\.mjs\s+--report\s+/i.test(deployWorkflow) ||
      !/probe_state:\s*\$\{\{\s*steps\.[\w-]+\.outputs\.state\s*\}\}/i.test(
        deployWorkflow,
      ) ||
      !/PROBE_STATE:\s*\$\{\{\s*needs\.verify-public-boundary\.outputs\.probe_state\s*\}\}/i.test(
        deployWorkflow,
      ))
  )
    problems.push(
      ".github/workflows/deploy.yml: [probe-report] deploy must carry the structured live-probe state into deployment-complete",
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

const HELP_COMMANDS = [
  ["tooling/classify-change.mjs", /Usage:/i],
  ["tooling/release-classify.mjs", /Usage:/i],
  ["tooling/release-state.mjs", /Usage:/i],
  ["tooling/verify-release-chain.mjs", /in place|restore/i],
  ["tooling/gate-receipt-carry.mjs", /Usage:/i],
  ["tooling/verify-gate-receipt.mjs", /Usage:/i],
  ["tooling/contracts-run.mjs", /Usage:/i],
  ["tooling/gates-retry.mjs", /diagnostic/i],
  ["tooling/gates-affected.mjs", /SHADOW|shadow/i],
  ["tooling/impact-plan.mjs", /diagnostic\/shadow-only/i],
  ["tooling/vitest-run.mjs", /selected-shadow/i],
  ["tooling/vrt-review.mjs", /report\.json/i],
  ["tooling/deploy-candidate.mjs", /create[\s\S]*verify[\s\S]*discover/i],
  ["apps/docs/scripts/probe-deployment.mjs", /--report\s+<path>/i],
];

function cliHelpProblems() {
  const problems = [];
  for (const [file, expected] of HELP_COMMANDS) {
    const result = spawnSync(process.execPath, [file, "--help"], {
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      timeout: 10_000,
    });
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (result.status !== 0 || !expected.test(output))
      problems.push(
        `${file}: [cli-help] --help must exit 0 without credentials or mutations and describe its supported interface`,
      );
  }
  return problems;
}

// Semantic negative fixtures: each stale instruction must fail for its intended reason. These are
// virtual strings so historical ledgers and superseded plans can remain byte-stable records.
const validFixture = {
  "AGENTS.md":
    "Every non-registry route is anonymous, including /internal/*; /r/* alone is service-token-only. /internal/* remains unlisted with noindex and no-store. A canonical evidence-leaf manifest is required. CI is receipt-first. Exact-tree receipt reuse is **shadow-only**. Release state is explicit and fail-closed. Only npm E404 is missing; registry-only published means zero hosted npm jobs. Consume uses a fresh consumer per root; D1 keeps the full oracle mandatory. The deploy candidate is shadow-only. D4 remains open; the mandatory exact-tree rebuild remains. Require structured probe count/state and exact registry version. Run gates:plan: operational prose can be non-product, but rendered MDX remains product input. Every safely skipped lane carries a reason and selector digest. Production continues to require one complete exact-tree gates:ship proof. Public skills are shipped package inputs; retain skill-mirror, export, and package-build checks. There is no agreeing greater-than-six-route foundation fixture. Do not collect a qualifying cohort yet; MK must resolve the authority blocker.",
  "docs/RELEASING.md":
    "Every non-registry route is anonymously reachable; /internal/* remains unlisted with noindex/no-store; /r/* must reject anonymous requests. Release uses an explicit resumable state machine: registry-unknown blocks. For registry-only published work it never runs hosted npm. The deploy candidate is shadow-only; a mandatory exact-tree rebuild remains under D4. Require structured probe state/count and exact registry version. There is no agreeing greater-than-six-route foundation fixture. Do not collect a qualifying cohort yet; MK must resolve the policy blocker.",
  "docs/requirements.md":
    "Point-in-time historical record. D11 is superseded: /internal/* is anonymous under the current boundary.",
  "skills/internal/ship/SKILL.md":
    "Run git fetch --prune origin before classification. Schema 2 production-full evidence includes all-browsers. Upload is not completion; require deployment-complete with structured probe count and exact registry version. versioned-unpublished alone runs hosted build; registry-unknown never grants publish permission. The deploy candidate is shadow-only. A missing or expired candidate is a safe miss and uses the rebuild; malformed or ambiguous evidence must fail. Present plain-language bullet points and absolute clickable paths. changed = Before/After/Difference; new = After; removed = Before; broken has no visual verdict until rerun. Run gates:plan. Operational plans can skip rendered checks, but rendered MDX cannot. Include every reachable dependent. The terminal `pnpm gates:ship` remains the complete exact-final-tree proof. Public skills ship inside `@vegastack/design`; retain skill-mirror, export, and package-build checks. There is no agreeing greater-than-six-route foundation fixture. Do not collect qualifying checkpoint samples; MK must resolve the authority blocker.",
  "skills/internal/ship/references/visual-review.md":
    "Run gates:plan before visual review. Rendered MDX remains visual input. Every safe skip includes its selector digest. Present plain-language bullet points. changed = Before/After/Difference; new = After; removed = Before; broken is not a visual verdict and must rerun. Resolve every available artifact to an absolute clickable Markdown link.",
  "skills/internal/ship/references/release-gotchas.md":
    "verify-shadcn-consume builds public packages, then runs pnpm pack --json and validates every declared export before clean consumers.",
  "skills/internal/gates/SKILL.md":
    "gates:plan distinguishes operational prose from rendered MDX and includes every reachable dependent. Selected runners reconcile planned, listed, and executed leaves. Dynamic pre-push execution is still disabled. `skills/public/**` are non-rendered package inputs; retain skill-mirror, export, and `@vegastack/design` build checks. gates:retry writes diagnosticOnly: true and evidenceWritten: false. gates:affected retains rollout.enabled: false and its status retains reuseEnabled: false. Use gates:affected:checkpoint -- --scenario <name>. Require 30 representative samples and MK approval. There is no agreeing greater-than-six-route foundation fixture. verify-shadcn-consume uses a fresh consumer per root; D1 retains the full oracle.",
  "skills/internal/review/SKILL.md":
    "There is no agreeing greater-than-six-route foundation fixture. Do not collect qualifying checkpoint samples; MK must resolve the policy blocker.",
  "docs/plans/2026-07-28-public-site-private-registry-boundary.md":
    "Require deployment-complete and the structured Cloudflare version ID, passing probe count, and exact registry version.",
  ".github/workflows/runner-diagnostics.yml":
    "${{ steps.all_browsers.outcome }} ${{ steps.contracts.outcome }} complete three-engine suite complete contract suite vegastack-browser-launch-diagnostic id: structured-reports report.executed > 0",
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
    "consume omits artifact build and export validation",
    "skills/internal/ship/references/release-gotchas.md",
    "verify-shadcn-consume runs pnpm pack and then starts consumers.",
    /consume-artifact/,
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
    "diagnostics omit structured outcomes",
    ".github/workflows/runner-diagnostics.yml",
    "${{ steps.all_browsers.outcome }} ${{ steps.contracts.outcome }} complete three-engine suite complete contract suite",
    /diagnostic-verdict/,
  ],
  [
    "browser in CI",
    "apps/docs/playwright.config.ts",
    "The browser gate runs on every PR in CI.",
    /browser-location/,
  ],
  [
    "browser diagnostics point to hosted CI",
    ".github/workflows/runner-diagnostics.yml",
    "Browser jobs must stay GitHub-hosted until this reads 3/3.",
    /browser-location/,
  ],
  [
    "complete browser command called a main/release lane",
    "skills/internal/component/references/testing.md",
    "pnpm --filter @vegastack/ui test:all-browsers # complete suite in all three engines (main/release)",
    /browser-location/,
  ],
  [
    "complete browser suite called pre-push",
    "AGENTS.md",
    "The complete three-engine suite runs in .husky/pre-push.",
    /browser-location/,
  ],
  [
    "generic suite count",
    "packages/ui/vitest.smoke.config.ts",
    "The full 900+ test suite runs here.",
    /generic-test-count/,
  ],
  [
    "machine authority calls complete browsers a main/release lane",
    "packages/ui/component-contracts.json",
    '{"exemptions":[{"rationale":"main/release runs the complete suite in all three engines."}]}',
    /browser-location/,
  ],
  [
    "diagnostic workflow calls every step fail-open",
    ".github/workflows/runner-diagnostics.yml",
    "Every step is `continue-on-error` so one failure still yields the complete picture.",
    /diagnostic-verdict/,
  ],
  [
    "historical ship timing presented as current",
    "skills/internal/ship/SKILL.md",
    "pnpm gates:ship # THE full local sweep. ~20min. Writes .gates/receipt.json. The complete suite takes 1m39s locally.",
    /timing-generation/,
  ],
  [
    "push called the lint umbrella",
    "skills/internal/ship/references/release-gotchas.md",
    "gates:push runs the umbrella for exactly this reason.",
    /gate-lint/,
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
  [
    "future wrong hosted-job count",
    "README.md",
    "Six hosted workflow jobs remain.",
    /hosted-job-count/,
  ],
  [
    "future wrong contract counts",
    "skills/internal/review/SKILL.md",
    "Run all 109 contract routes and 872 contract checks.",
    /contract-count/,
  ],
  [
    "hosted producer called provenance",
    "tooling/release-classify.mjs",
    "package-build RUNS — hosted provenance build",
    /npm-provenance/,
  ],
  [
    "direct package contract alias",
    "apps/docs/package.json",
    '{"scripts":{"test:contracts":"playwright test contracts.spec.ts"}}',
    /diagnostic-wrapper/,
  ],
  [
    "complete-browser package command bypasses structured wrapper",
    "packages/ui/package.json",
    '{"scripts":{"test:all-browsers":"vitest run --config vitest.all-browsers.config.ts"}}',
    /browser-wrapper/,
  ],
  [
    "deployment probe missing report",
    "apps/docs/scripts/probe-deployment.mjs",
    'console.log("boundary passed")',
    /probe-report/,
  ],
  [
    "terminal deployment missing probe state",
    ".github/workflows/deploy.yml",
    "run: node apps/docs/scripts/probe-deployment.mjs\n  deployment-complete:\n    needs: verify-public-boundary",
    /probe-report/,
  ],
  [
    "visual handoff omits understandable explanation and screenshots",
    "skills/internal/ship/references/visual-review.md",
    "Present only route, project, and changedPixels.",
    /visual-handoff/,
  ],
  [
    "visual handoff demands impossible all-three artifacts",
    "skills/internal/ship/references/visual-review.md",
    "For every non-unchanged entry provide Before, After, and Diff—all three.",
    /visual-handoff/,
  ],
  [
    "blanket docs visual skip",
    "skills/internal/ship/SKILL.md",
    "Documentation and Markdown changes always skip browser, contract, and VRT checks.",
    /dynamic-rendered-docs/,
  ],
  [
    "component checks itself only",
    "skills/internal/gates/SKILL.md",
    "For a component change, verify only the changed component and ignore dependents.",
    /dynamic-dependent-closure/,
  ],
  [
    "component command claims one own test",
    "README.md",
    "gates:component runs that component's own unit test.",
    /dynamic-dependent-closure/,
  ],
  [
    "unknown path skips product lanes",
    "AGENTS.md",
    "An unknown path safely skips browser and contract lanes.",
    /dynamic-unknown/,
  ],
  [
    "selector disagreement narrows",
    "skills/internal/review/SKILL.md",
    "When registry and Vitest selectors disagree, use the smaller set to save time.",
    /dynamic-disagreement/,
  ],
  [
    "selector disagreement uses bounded union",
    "skills/internal/review/SKILL.md",
    "When registry and import authorities disagree, use the bounded union.",
    /dynamic-disagreement/,
  ],
  [
    "obsolete affected report path",
    "skills/internal/gates/SKILL.md",
    "Read .gates/affected-shadow.json after gates:affected.",
    /affected-schema/,
  ],
  [
    "obsolete affected top-level fields",
    "skills/internal/gates/SKILL.md",
    "gates:affected writes shadowOnly: true and reuseEnabled: false.",
    /affected-schema/,
  ],
  [
    "affected checkpoint omits current authority blocker",
    "docs/RELEASING.md",
    "Affected reuse stays off until 30 representative samples and MK approval.",
    /affected-checkpoint-blocker/,
  ],
  [
    "unexplained safe skip",
    "skills/internal/gates/SKILL.md",
    "The unit lane was safely skipped.",
    /dynamic-skip-reason/,
  ],
  [
    "two-engine smoke claim",
    "AGENTS.md",
    "test:smoke runs WebKit + Firefox.",
    /smoke-engines/,
  ],
  [
    "machine authority reverts to two-engine smoke",
    "packages/ui/component-contracts.json",
    '{"rationale":"selected WebKit/Firefox smoke"}',
    /smoke-engines/,
  ],
  [
    "public skill skips package proof",
    "skills/internal/gates/SKILL.md",
    "Public skills are operational-only and skip the package mirror and package build.",
    /dynamic-public-skill/,
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

const problems = [
  ...operatorDocProblems(readCurrentSources()),
  ...cliHelpProblems(),
];
if (problems.length > 0) {
  console.error(problems.map((problem) => `✗ ${problem}`).join("\n"));
  process.exit(1);
}
console.log(
  `✓ operator docs: ${CURRENT_SURFACES.length} current surfaces agree on topology, browser location, machine-derived ${COMPONENT_ROUTES.length}-route/${FULL_CONTRACT_TESTS}-check and ${HOSTED_JOB_COUNT}-hosted-job counts, receipt/reuse/retry/affected/consume/release-state/candidate ordering, terminal deployment, and schema-2 production evidence; ${semanticFixtures.length} semantic stale-instruction fixtures and ${HELP_COMMANDS.length} CLI help surfaces verified`,
);
