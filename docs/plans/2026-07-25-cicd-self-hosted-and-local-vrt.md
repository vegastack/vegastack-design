# CI/CD on self-hosted runners + VRT as an agent-reviewed local ship step

Status: **implemented locally 2026-07-25, Parts A–E, on two unpushed branches.** Nothing is pushed,
published, or deployed. No changeset-bearing commit has left this machine. Every outward step —
opening either PR, merging the Version PR, dispatching the deploy — still requires a fresh MK
approval through the `ship` workflow.

**This document is now a point-in-time record.** It states what was decided and believed on
2026-07-25 and is superseded by the code. The current behaviour is in AGENTS.md § Verification
ladder and § Locked decisions; the decision record, including every deviation from this plan and
why, is in `docs/ledger/operator-review.md` under 2026-07-25. Three things below were deliberately
NOT followed as written — the terminal fix's shape and position in the sequence, the boundary-probe
runners, and the visual classifier — each recorded there with its reason.

Sequencing as actually built, replacing § Sequencing at the end of this file:

1. `ci/self-hosted-runners-and-local-vrt` — Parts A–D plus every gate and documentation edit and the
   876-baseline deletion. **No changesets.**
2. `fix/terminal-forced-colors-focus` — Part E plus its changeset, branched off (1).

(1) must merge before (2): under the old workflows the terminal fix's own pixel gate would have
blocked it, which is the reverse of this plan's original order.

This plan reverses a locked decision (AGENTS.md § Locked decisions, "VRT is day-one") and changes
AGENTS.md § Verification ladder ("VRT is a pinned-Linux pixel contract and is blocking for deploy and
release"). That reversal is the substance of Part C and must be recorded as deliberate, not dropped
silently — otherwise a future session re-derives the old answer.

## Why

### The release is currently stuck, and not for the reason the handoff says

Run `30115971397` did not hang. It **failed** at 1h12m with two genuine regressions:

- `contracts.spec.ts:197` — `/docs/components/terminal` has no visible focus indicator under
  `forced-colors: active`. Deterministic across all four Chromium projects and all three retries.
  **Root-caused and reproduced locally on macOS** — see § Terminal fix below.
- `components.spec.ts` — `/internal/internal-projects` in `chromium-dark` only. Unexplained; its
  baseline commit is *newer* than the page's source commit, so it is not simple staleness.

`quality-gate`, `version-pr`, and `publish` all skipped. **There is no Version Packages PR.** npm is
still at `@vegastack/design@0.1.1`; five changesets are pending on `main`.

### The pipeline made that failure undiagnosable

`release.yml`'s `vrt-gate` and `deploy.yml`'s `vrt-gate` have **no `upload-artifact` step**. Verified:
run `30115971397` produced **zero artifacts**. A pixel failure emits no diff image, no trace, no
report. The only way to see what broke is another 72-minute run.

That, not any runner choice, is what trapped the previous session in a loop.

### VRT runs four times per release

`release.yml:39` classifies a change as visual if it touches `^packages/design/` among others.
A Version Packages PR changes `packages/design/package.json` — verified to match. So the identical
876 screenshots are captured:

1. on the PR (`vrt.yml`)
2. on merge to `main` (`release.yml`)
3. on merging the Version Packages PR — **a pure version bump with no visual content**
4. on the deploy dispatch (`deploy.yml`)

≈ five hours of machine time re-photographing the same pages to publish a version bump.

### VRT has never caught a product bug here

From `docs/ledger/codex-rounds.md`, "VRT baselines absent" was raised as a HIGH finding **twelve
times** and marked IRREDUCIBLE each time. Baselines landed 2026-07-24. Every VRT entry in
`docs/ledger/bugs.md` is a defect in VRT's own machinery, not in a component:

- `bugs.md:126` — the completeness verifier's regex matched single-quoted paths only, silently
  ignoring 68 images
- `bugs.md:44` — the VRT scaffold broke `next build`
- the bootstrap chicken-and-egg in which `update_baselines` could never write the first baselines

**Its original justification was reassigned.** VRT was specified as the contrast/a11y acceptance gate
(`design.md` §7.7). `docs/ledger/operator-review.md:100` records that job moving to
`packages/ui/test/contrast.browser.test.tsx`, a compiled-CSS Vitest test that found real sub-AA dark
tokens and got them fixed. Behaviour coverage likewise belongs to `contracts.spec.ts`, which caught
today's real bug and takes no photographs.

Both of VRT's jobs are now done by tests that run on every OS and need no baselines. Only **layout
drift** remains — real, but narrow.

### VRT is a review tool, not a gate

A gate answers yes/no with no human in the loop. VRT cannot: when forty photographs change, only a
human knows whether that was the intent. Clearing it requires *overwriting the evidence* by
regenerating baselines. AGENTS.md § Verification ladder says "Every gate fails closed" — VRT has an
always-available escape hatch, so it never did.

The honest move is to relocate it to where the judgment already happens: `/ship`.

### Committed baselines are unworkable for this team

Developers are on **mixed macOS and Windows**, and the CI mac mini is a third machine. Photographs
are only comparable when taken on the same platform — and
[the same CPU architecture](https://github.com/microsoft/playwright/issues/13873), which matters
because 96 of the checks use `maxDiffPixels: 0`. There is **no platform on which the whole team can
regenerate baselines**, so any committed-baseline design keeps the CI round-trip.

## What changes

**Screenshots leave CI entirely and become a before/after comparison run locally during `/ship`,
with no committed baselines.** Both captures happen on one machine minutes apart, so platform is
irrelevant and every developer can run it on any OS.

**Everything else moves to the self-hosted mac minis**, except the two jobs that must not move.

```
mac-mini      PR          design:verify · typecheck · lint · test (Vitest browser + axe + contrast)
[self-hosted,             contracts.spec.ts (768 behaviour checks, no photographs)
 vsk-runners-             builds · registry:build idempotency · verify-consume · changeset status
 mac-mini]
              release     changes → quality-gate → version-pr
              deploy      build-curated → deploy-curated (Cloudflare)

ubuntu-       publish     npm OIDC — mandatory, see below
latest        sign-curated sigstore OIDC — mandatory by caution, see below

LOCAL         /ship       before/after screenshot diff, artifacts reviewed by the developer's agent
```

### Two jobs stay on GitHub-hosted runners

**`publish` — hard requirement.** npm trusted publishing does not support self-hosted runners:
"Self-hosted runners are not currently supported but are planned for future releases"
(<https://docs.npmjs.com/trusted-publishers/>). This repository deliberately has no `NPM_TOKEN`
(`docs/RELEASING.md`), so moving this job breaks publishing outright. It runs ~2 minutes and executes
no repository code.

**`sign-curated` — by caution.** Sigstore has no documented runner restriction and the OIDC token is
minted by GitHub regardless of runner, so it *should* work self-hosted. That is unverified, and a
failure means a broken release. The job downloads an artifact and signs it — no repository code, ~30
seconds. Not worth the risk. Revisit only if there is a reason to.

### Runner targeting

`vsk-runners-mac-mini` is a **label, not a runner group** — verified against the org API. Both minis
(macOS ARM64) sit in the Default group. The proven in-production form across vegastack
(`devops-project`, `engg-clients-meeting-workflow`) is:

```yaml
runs-on: [self-hosted, vsk-runners-mac-mini]
```

Note `vegastack/vegafactory` uses `runs-on: { group: vsk-runners-mac-mini }`. No runner group by that
name exists; do not copy that form.

A self-hosted Linux runner (`vsk-runners-htz-linux-1`, label `vsk-runners-linux`) also exists. This
plan does not use it — with screenshots local, nothing needs Linux.

## Part A — the local VRT review tool

### Design: before/after on one machine, nothing committed

```
1. git worktree add <tmp> <base-ref>          # default origin/main
2. build + capture the affected routes there  → base snapshot dir
3. build + capture the same routes on HEAD, comparing against that dir
4. emit artifacts + a structured report
```

| Property | Committed baselines (today) | Before/after (this plan) |
|---|---|---|
| macOS vs Windows vs Linux pixels | fatal | irrelevant — one machine |
| Repo weight | 216 MB | zero |
| Staleness | constant | impossible |
| "Regenerate baselines" round-trip | the entire loop | does not exist |
| Runnable by any developer | no | yes, any OS |

It also answers a better question: not *"this differs from a photograph taken in July"* but
**"here is exactly what your change did to the UI."** It handles the scenario VRT is genuinely best
at — bump Tailwind, see every component that moved.

### Zero new dependencies

Do **not** add `pixelmatch`/`odiff`. Playwright already does this natively. Point
`snapshotPathTemplate` at the base-capture directory via an env var, run the **existing
`components.spec.ts` unchanged**, and Playwright writes `-expected/-actual/-diff` PNGs into
`test-results/` plus a machine-readable `--reporter=json`.

Keeping the spec unchanged also means `tooling/verify-component-contracts.mjs:869-913` — which
string-asserts that the spec contains `"VRT — component fixtures"` and `maxDiffPixels: 0` — keeps
passing untouched. That is one of the three fail-closed blockers neutralised for free.

### Scope the capture

`apps/docs/vrt/contract-routes.generated.ts` and `page-routes.ts` already map components to routes.
Diff `HEAD` against the base ref, capture **only affected routes**, with `--all` to force everything.
A one-component change becomes seconds rather than minutes.

Default to the **96 isolated component fixtures**, not the 114 full-page shots. The full-page shots
photograph documentation prose — editing a paragraph changes them, which is noise, not signal. They
are also the reason for the 120s test timeout, the 60s expect timeout, and the `maxDiffPixels: 100`
fudge factor in `playwright.config.ts`. `--full-pages` opts in when a layout change warrants it.

### Output contract — designed for agents

Every developer here works through Claude Code or Codex, and those agents can read images. That
makes the un-automatable judgment step agent-assisted, which is precisely what unblocks this.

**The division of labour must be explicit, because it is what keeps the tool honest:**

| Stage | Who | Why |
|---|---|---|
| **Measurement** | Playwright's comparator | Deterministic. A 2px shift is a fact, and a vision model can miss it |
| **Interpretation** | the developer's agent | Reads before/after/diff, judges intended vs unintended |
| **Decision** | the developer | Authority never leaves the human |

Never let the agent's reading of an image substitute for the pixel count. The numbers decide *what
gets looked at*; the agent decides *what it means*; the human decides *what happens*.

Emit to `.vrt-review/` (gitignored):

```
.vrt-review/report.json
.vrt-review/<route>--<project>/{before,after,diff}.png
```

`report.json` per entry: `route`, `project`, `changedPixels`, `totalPixels`, `percentChanged`,
`status` (`unchanged` | `changed` | `new` | `removed`), and the three image paths. Sorted by
`changedPixels` descending so an agent triages largest-first without opening everything.

The tool **always exits 0**. It is a review instrument, not a gate; a non-zero exit would recreate
the thing being removed.

### Ship-skill protocol

Add to `skills/internal/ship/SKILL.md` § Preflight, replacing the `verify:vrt-baselines` line:

1. Run the tool.
2. Read `.vrt-review/report.json`.
3. For every entry with `status !== "unchanged"`, **read the before/after/diff images**.
4. Classify each: **intended** (consistent with the changeset), **unintended**, or **uncertain**.
5. Present a table — route, project, pixels changed, verdict, one-line reasoning.
6. **Stop. The developer decides.** Never self-clear a diff.

Write this so it is legible to both Claude Code and Codex — this file is mirrored into
`.agents/skills/` and both agents load it by description.

## Part B — workflow migration

Mechanical, and `tooling/verify-workflow-security.mjs` **does not constrain `runs-on` at all**
(verified — no `runs-on` assertion exists), so nothing blocks it.

| Change | Where |
|---|---|
| `runs-on: ubuntu-latest` → `[self-hosted, vsk-runners-mac-mini]` | `ci.yml:10`; `release.yml:16,95,146`; `deploy.yml:31,85,223,263,293` — **not** `release.yml:175` (publish) or `deploy.yml:185` (sign) |
| Remove `container:` | `ci.yml:12`; `release.yml:60,96`; `deploy.yml:53` — Actions job containers are Linux-only; Colima/OrbStack does not change that |
| **Delete `env: HOME: /root`** | `ci.yml:37-41`; `release.yml:113-115` — a container-root Firefox workaround that **hard-breaks on macOS**; `/root` does not exist |
| Add `pnpm exec playwright install chromium` | every job running Playwright or Vitest browser mode — the container used to supply browsers. **No `--with-deps`** (apt-based, Linux-only) |
| Remove `git config --global --add safe.directory` | `ci.yml:18-20`; `vrt.yml:41`; `release.yml` — harmless in a throwaway container, but on a **persistent** runner it permanently mutates the runner user's global gitconfig |
| Narrow the visual classifier | `release.yml:39` — drop `pnpm-lock\.yaml` and `apps/docs/package\.json`; a lockfile bump is not a visual change |
| **Add `upload-artifact` on failure** | every job running Playwright. Do this **first, independently** — without it you are debugging blind |
| Dynamic port | `playwright.config.ts:76` hardcodes port 3000 with `reuseExistingServer: false`. Two minis running two PRs will collide. Env-var the port or add a concurrency group |

`turbo.json:4`'s `globalPassThroughEnv: ["PLAYWRIGHT_BROWSERS_PATH"]` is harmless to keep and stays
correct if a shared browser cache is pinned on the runner (recommended — avoids re-downloading ~1 GB
per job).

## Part C — gate and documentation edits

Three fail-closed blockers. Under this plan one is already neutralised (Part A).

| Blocker | Action |
|---|---|
| `tooling/verify-workflow-security.mjs:13` — `REQUIRED_WORKFLOWS` includes `vrt.yml` | Remove the entry; delete `vrt.yml`. Also remove the now-dead `PLAYWRIGHT_IMAGE` constant (`:26-27`) and its `container:` digest assertion (`:142-148`), and the `update_baselines` input assertion (`:189-193`) |
| `tooling/verify-component-contracts.mjs:869-913` | **No change** — `components.spec.ts` stays |
| `release.yml:87-92` `quality-gate` `if:` evaluates `needs.vrt-gate.result`; `deploy.yml:83` `build-curated: needs: vrt-gate` | Delete both `vrt-gate` jobs; rewire `needs:` and simplify the conditional to `always() && needs.changes.outputs.publish == 'true'` |

Deletions and rewrites:

- **Delete** 876 PNGs under `apps/docs/vrt/components.spec.ts-snapshots/` (216 MB)
- **Delete** `apps/docs/scripts/verify-vrt-baselines.ts` and `apps/docs/package.json:15`
- **`.gitignore:23-28`** — currently ignores `*-darwin.png` *specifically to prevent* committing local
  baselines. Replace with the whole snapshot directory plus `.vrt-review/`. (Its comment also
  claims `contracts.spec.ts` writes snapshots — false today; do not carry that forward.)
- **Delete** `skills/internal/ship/references/vrt-baselines.md`
- **Rewrite** `skills/internal/ship/SKILL.md:19,29,39-41,174` and `skills/internal/review/SKILL.md:149-164` §8
- **Rewrite** `skills/internal/component/SKILL.md:56,250-256,275-282`
- **Rewrite** `AGENTS.md:91` (locked decision), `:208-216` (verification ladder), `:274`, `:299-300`;
  `README.md:31,75,80`
- `design.md` — **no VRT references**; `design:sync:check` unaffected
- Record the reversal in `docs/ledger/operator-review.md` with the evidence from § Why

Everything under `docs/plans/`, `docs/audits/`, and the historical `docs/ledger` rounds is a
point-in-time record per AGENTS.md § Truth hierarchy and needs no edit.

## Part D — validation before any of the above

Two experiments. Both must pass before the migration is trusted.

**D1 — `contracts.spec.ts` on macOS.** This is the lane that actually catches bugs, and it is *not*
platform-neutral despite taking no photographs: `effectiveTargetProbe` asserts a ≥23.5px effective
size using `elementFromPoint` hit-testing at a 0.5px inset, explicitly tuned around Blink-on-Linux
pixel snapping, and `forcedColors` emulation plus font metrics differ by OS. One route reproduced
correctly on macOS today; the other 767 are unvalidated.

Run the full 768 on a mini. Expect exactly one failure — the known terminal bug. **Any other failure
is macOS calibration** and must be resolved before the lane moves. Routes previously flagged as tight
on the 24px floor: attachment, code-block, filter-bar, password-input, text-edit.

**D2 — local VRT tool dry run.** Prove the before/after loop end to end on a real change, on both a
macOS and a Windows machine, and confirm an agent can read `report.json` and the images and produce a
correct intended/unintended verdict.

## Part E — the terminal fix (independent, do first)

Real accessibility bug, root-caused and locally reproduced.

`packages/ui/registry/ui/terminal.tsx:104-111` — the scrollable body is `tabIndex={0}` with
`border border-transparent focus-visible:border-ring/(--alpha-tint-border) focus-visible:outline-none`.
Under `forced-colors: active` both affordances collapse:

- **`outline-none` has no forced-colors carve-out** in Tailwind v4.3.2 — it compiles to bare
  `outline-style: none`. `outline-hidden` *does* (it emits `outline: 2px solid transparent` inside
  `@media (forced-colors: active)`). So the safety net at `packages/design-tokens/src/base.css:53-56`,
  which sets only `outline-color: Highlight`, has nothing to colour.
- **Forced-colors overwrites `border-color` outright** — `border-transparent` and `border-ring/…`
  both resolve to `rgb(0,0,0)`. No tint change.

`terminal.tsx` is the **only file in `packages/ui/registry/ui/` containing
`focus-visible:outline-none`**. `ScrollArea` uses the same `tabIndex={0}` pattern without it and
passes. `base.css:58-64` already states the rule this violates.

**Fix:** remove `focus-visible:outline-none` (matching ScrollArea), then `pnpm registry:build` to
regenerate the docs copy-in and `apps/docs/public/r/terminal.json`.

`tooling/design-lint.mjs:545-555` did not catch it because its `outline-none` rule is file-scoped and
`terminal.tsx` has a `focus-visible:` affordance elsewhere. **Consider tightening that rule to be
element-scoped** — a separate, optional follow-up.

Reproduce:

```bash
cd apps/docs && pnpm exec playwright test vrt/contracts.spec.ts --project=chromium -g "components/terminal retains focus"
```

## Sequencing

Steps 1–4 are **workflow- and tooling-only, with no changesets**. That is required, not stylistic:
`docs/RELEASING.md` § Known edge documents that bundling workflow edits with a changeset-bearing push
gets the Version PR branch rejected. The five changesets already on `main` are unaffected — the
release run's SHA will equal the `main` tip, so the edge does not bite.

1. **Artifact upload only.** One tiny PR. Restores diagnosability immediately, independent of
   everything else.
2. **Terminal fix** (Part E) + `registry:build`. Own PR.
3. **Validation** (Part D). No merge; findings feed step 4.
4. **The migration** (Parts A–C). One PR: local tool, workflow re-platforming, gate edits, doc
   rewrites, baseline deletion.
5. Merge → `release.yml` runs on the new workflows → **Version Packages PR appears**.
6. **MK gate.** Review versions (`@vegastack/design` 0.1.1→0.2.0, `@vegastack/design-tokens`→0.2.0,
   `@vegastack/ui` 0.2.0→0.3.0), changelogs, stamped `meta.version`, regenerated `public/r`. Merge
   only on explicit approval → `publish` runs on `ubuntu-latest` with npm OIDC.
7. `npm view @vegastack/design version` → `0.2.0`.
8. **MK gate.** `gh workflow run deploy.yml -f cutover_phase=ordinary`. **Not** the public-docs
   cutover; no Cloudflare Access change.
9. Post-release: `cd ../vegastack-design-starter && pnpm check-updates`.

## Non-goals

- The public-docs cutover. `SITE_VISIBILITY` and Cloudflare Access are untouched.
- Moving `publish` or `sign-curated` off GitHub-hosted runners.
- Changing the MK approval model. Every gate in `docs/RELEASING.md` stays exactly as it is.
- Using `vsk-runners-linux`. Nothing in this plan needs Linux.
- Changing `contracts.spec.ts` assertions. If D1 surfaces macOS calibration issues, that is its own
  scoped change.

## What this gives up

**Nothing enforces layout drift in CI.** A PR that breaks a layout is not caught until someone runs
`/ship` and reviews the report. Acceptable while MK ships; **revisit if several people begin merging
component changes independently** — by then the before/after tool exists and can be dropped into CI
against a PR's base ref with no redesign.

**A locked decision is reversed.** Recorded deliberately in AGENTS.md and the operator-review ledger,
with the evidence, so it is not silently re-derived.

**The `/internal/internal-projects` dark diff is never explained.** It failed all three retries in one
configuration, its baseline is newer than the page source, and zero artifacts survive. Under this plan
it evaporates rather than gets answered. Noted so it is a known unknown, not a silent loss.

## Verification that this worked

```bash
pnpm lint                                        # umbrella: skill lint, workflow security, design:verify
pnpm typecheck && pnpm test
pnpm registry:build && git status --porcelain    # must be empty
pnpm design:derived && git status --porcelain    # must be empty
node tooling/verify-workflow-security.mjs        # passes without vrt.yml
grep -rn "verify:vrt-baselines\|vrt-gate\|update_baselines" .github/ tooling/ skills/   # no hits
du -sh apps/docs/vrt                             # ~216 MB → small
```

Plus: a green PR run on a mini, one clean `/ship` local review cycle, and `npm view` reporting
`0.2.0`.
