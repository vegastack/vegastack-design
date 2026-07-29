# Releasing — shipping component & package updates

How VegaStack ships updates from this **private** GitHub repo, and how downstream pulls them. Two
distribution channels, both already wired:

- **npm packages** (`@vegastack/design` + `@vegastack/design-tokens`) → prepared by `release.yml`
  (changesets) on push to `main`, then published after the reviewed **Version Packages** PR is
  merged, via **npm OIDC trusted publishing** (same pattern as vegastack-cli): no `NPM_TOKEN`
  secret exists and the account keeps 2FA. npm does not emit
  provenance attestations from a private source repository, so these releases deliberately do not
  claim one; OIDC authentication remains short-lived and workflow-bound. One-time setup: each package
  on npmjs.com has a Trusted Publisher entry
  → GitHub Actions → `vegastack/vegastack-design` → `release.yml`. (The very first 0.1.0 publish
  was done locally with `pnpm -r publish` + OTP, since a trusted-publisher entry can only be added
  to an existing package.) The trusted-publisher identity is repository + `release.yml`, with no
  GitHub environment name—the exact identity proven by the 0.1.1 publish. Consumers get these via
  `npm update` (semver).
- **Component registry** (`/r/*.json`) → built, **Sigstore-signed**, and deployed to Cloudflare by
  `deploy.yml` (manual `workflow_dispatch`). Consumers **pull** updates with `shadcn add` — copy-in,
  so there is **no auto-push** (that's the shadcn model; whole-item integrity/content is the update
  signal, with a preserved provenance header used only as an optional fast path).

> The registry is **not** served from the private GitHub repo directly — shadcn's `owner/repo/item`
> address form doesn't support private repos. GitHub is the source; the signed `/r/*` is served from
> Cloudflare (`design.vegastack.com/r/`) behind Cloudflare Access service tokens.

## Release a component update (maintainer)

1. Edit the **canonical** source only: `packages/ui/registry/ui/<name>.tsx`.
2. `npm run registry:build` — regenerates the docs copy-in + per-item JSON and **re-stamps the
   SHA-256 integrity + provenance header**. The changed hash is the machine-readable "this changed"
   signal consumers' `vegastack-design check-updates` reads.
3. `pnpm changeset` — bump `@vegastack/ui` (and any other changed package). **List the affected
   component name(s) in the summary** — `@vegastack/ui`'s generated `CHANGELOG.md` is the
   consumer-facing "what changed per version".
4. PR → review → merge to `main`. PR CI verifies the browser/contract receipt first; only a valid
   receipt unlocks the free-mini job that independently reexecutes the complete non-browser half.
   That job invokes `pnpm lint` once (and therefore `design:verify` once), plus typecheck, node-only
   package tests, both discovery builds, registry idempotency, and full consume. A
   changeset-bearing run then uses its non-OIDC version job to update the **Version Packages** PR.
   Review its package versions, generated changelogs, registry item versions, and regenerated
   `/r/*`; merging that PR is the separate human action that authorizes the next main run's isolated
   npm OIDC publish job. The private source repository means npm provenance attestations are
   unavailable even though trusted publishing itself is supported.
5. **Publish the registry**: run the **Deploy** workflow (`deploy.yml`, manual, from `main`). It
   builds/tests without credentials, uploads a validated artifact, signs it in the only OIDC-capable
   job, and reverifies it in the credential-only job before pinned Wrangler uses the existing
   repository Cloudflare secrets. The manual dispatch is the explicit outward-deploy approval.
   The live probe requires every non-registry route to be anonymously reachable, requires
   `/internal/*` to remain unlisted with `noindex`/`no-store`, and requires `/r/*` to reject
   anonymous requests while accepting the service token. It also proves the representative live
   registry item's exact version, integrity hash, and signed-manifest membership. The new registry
   versions are then _available_—consumers still pull them.
   Upload progress is not completion: only the terminal `deployment-complete` job, after the external
   live probe, reports success. Its summary must name Wrangler's structured Cloudflare version ID,
   the structured probe state/count, and the exact registry version; missing, empty, unknown, or
   failed probe evidence blocks that terminal job.

Release's already-required exact-main quality build also uploads a deploy candidate in shadow-only
mode. Deploy selects at most one live artifact from a successful `release.yml` push run for the exact
SHA, validates the API/archive digest and canonical content/context manifest, then compares it with
the mandatory exact-tree rebuild. The rebuild remains the only input to signing and production. D4
is unresolved: candidate reuse needs MK approval and a reviewed code change, not a repository-variable
flip. Missing or expired candidates safely use the rebuild; a live malformed, tampered, wrong-SHA,
or ambiguous candidate fails before any OIDC or Cloudflare credential is reachable. Until real runs
exist, candidate-hit timing, parity rate, producer cost, and unused-candidate cost remain unknown.

This is the approved GitHub Team/private-repository operating model. Required-reviewer environment
protection is unavailable on this plan, so releases do not depend on GitHub Environments or change
the proven npm trusted-publisher identity. Independent review belongs at the change PR and Version
Packages PR; MK may initiate a run, but every changeset push, Version PR merge, and deploy dispatch
remains a separate explicit MK decision under the `ship` skill.

Docs/deployment-only changes do not require a package changeset, version bump, or npm publish. Keep
workflow changes out of a changeset-bearing push if package work unexpectedly becomes necessary.

Release uses an explicit resumable state machine. `pnpm release:state` queries each exact public
`name@workspace-version`; it never substitutes the latest dist-tag. Only npm `E404` means missing.
A timeout, 5xx, malformed/wrong response, ambiguous Version Packages PR, all-empty changeset set, or
release-workflow/changeset conflict blocks the run. Read `.gates/release-state.json` for the state,
reason, next action, and approval boundary:

| State                                                                                      | Safe workflow action                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `clean-noop`                                                                               | no release jobs                                                                        |
| `changesets-nonempty` / `version-pr-open`                                                  | self-hosted quality plus create/update Version PR; no hosted npm job                   |
| `versioned-unpublished`                                                                    | self-hosted quality, hosted artifact build, then npm OIDC publish                      |
| `published`                                                                                | self-hosted quality only; exact public versions already exist, so hosted npm jobs skip |
| `changesets-all-empty`, `changesets-invalid`, `workflow-diff-conflict`, `registry-unknown` | fail closed and follow the report's recovery action                                    |

This makes interrupted publication resumable when one public package exists and the other does not,
without treating network uncertainty as permission to publish. A registry-only release never runs
`package-build` or `publish` when both exact public versions already exist. After a real publication,
the workflow repeats the exact-version lookup before reporting success.

The Version Packages receipt carry is intentionally narrower than a filename allowlist. It rejects
untracked paths (which have no `git diff` record), binary or file-mode changes, renames, deletions,
and any changed inventory path missing from the parsed diff. A generated output is eligible only
when it is tracked and the quality gate independently re-derives it. Never remove an offender merely
to make the carry pass; either correct unintended work or run browser gates against the complete
tree.

## Where the jobs run

**No CI runner executes a browser.** The browser-unit suite, the cross-engine smoke, the three-engine
suite, and the 864 behaviour contracts run on a developer machine — scoped in `.husky/pre-push`, in
full under `pnpm gates:ship` — and each run writes `.gates/receipt.json`, bound to a git tree hash of
the working tree with `.gates/` excluded. Every workflow has a `receipt-guard` job that rejects a push
whose receipt does not cover the pushed tree. A receipt is **attestation, not proof**; see
`tooling/lib/gate-receipt.mjs` and AGENTS.md § Locked decisions for exactly what that does and does
not buy.

Deploy additionally requires schema-2 `production-full` evidence. The guard reconstructs the
canonical leaf universe from the checked-out tree: Chromium unit/axe, three-engine smoke, complete
Chromium/Firefox/WebKit, and 108 routes × four projects × two assertions = 864 contracts. It rejects
a scoped report, wrong route/test count, missing engine, stale fingerprint/tree/toolchain/authority,
duplicate/unknown/missing leaf, or an opaque coverage root. `mode: ship` is not authorization.

Pre-push smoke triggering includes transitive registry dependencies of every selected smoke root.
The checked Vitest-related manifest is a shadow comparator; missing or disagreeing results widen to
the complete selected smoke lane.

Local gate timing reports are retained under `.gates/runs/<run-id>/`; `pnpm gates:benchmarks`
summarizes p50/p95 without combining different gate generations, environments, cache/cold states,
engines, or route/check counts. A report states whether a value is measured, API-reported, modeled,
estimated, or unknown. It is diagnostic only: it cannot satisfy a receipt or authorize reuse.

Exact-tree production-full receipt reuse is shadow-only. `gates:push` records whether an unchanged
tree would have reused evidence, but it still executes the full planned oracle. A later successful
change-profile receipt cannot downgrade stronger exact-tree production evidence; a later failure is
retained and makes that evidence ineligible. Carried Version PR receipts never qualify. Enablement
requires 20 following observations with zero escapes and separate MK approval.

Receipt profile strength is one-way: a valid `production-full` receipt may satisfy a workflow's
weaker `change` guard, including after the independently rederived Version Packages carry. A scoped
`change` receipt can never satisfy deploy's `production-full` guard. This is validation dominance,
not evidence reuse; carried receipts remain ineligible for exact-tree skip/reuse.

`pnpm gates:retry` reruns exact structured failure selectors for diagnosis only. It refuses an empty
selector, a stale tree, a renamed test, an unknown engine/project/route, or zero executed tests. Its
report cannot enter `.gates/evidence/` or `.gates/receipt.json`, and the original failure remains
byte-identical even when the diagnostic passes. The applicable blocking ladder must run again.

`pnpm gates:affected` is the post-fix shadow planner, not release evidence. It computes dependency
closures and task-specific Turbo input fingerprints, then runs the unchanged push oracle with no
receipt write. Push observations never count toward the checkpoint; only explicit `--oracle ship`
production-full runs can create samples. The blanket `tooling/**` Turbo dependency remains active.
Affected reuse stays off until at least 30 representative production-full zero-escape samples and a separate MK checkpoint; a ready summary
does not self-enable. No affected or cross-tree composition can replace the complete exact-tree
production-full ship proof under current policy.

Consume has isolated diagnostic/affected reports for root-cause work. Every selected real and
simulated root uses a fresh consumer and independently proves target digests, post-write integrity,
and typecheck. Full mode separately retains all registry roots in both consolidated layouts for
collision ownership and whole-layout compilation. All consume reports are non-reusable and write no
receipt. D1 is still a policy checkpoint, so full consume remains part of PR CI, Release quality,
and the production-full local ship proof regardless of an affected pass.

PR CI is receipt-first: `verify` has `needs: receipt-guard`, so invalid receipt evidence stops before
the long free-mini reexecution. The self-hosted pnpm-cache removal experiment is committed disabled;
only `SELF_HOSTED_PNPM_CACHE_CANARY=enabled` plus an exact
`SELF_HOSTED_PNPM_CACHE_CANARY_RUNNER` selects the no-Actions-cache path. Missing variables retain the
cached control. Do not enable it without the separate repository-setting approval and alternating
10-run-per-mini baseline; the job summary retains cohort/setup/install/store measurements.

Everything that executes repository code and needs no browser runs free on the self-hosted mac minis
(`runs-on: [self-hosted, vsk-runners-mac-mini]`): all of `ci.yml`, `release.yml`'s `changes`,
`receipt-guard`, `quality-gate` and `version-pr`, and `deploy.yml`'s `ref-guard`, `receipt-guard` and
`build-curated` plus the terminal `deployment-complete` summary. **A pull request costs zero billable
minutes.**

Five jobs stay on `ubuntu-latest`, pinned by an allowlist enforced in
`tooling/verify-workflow-security.mjs` and negative-tested in
`tooling/verify-workflow-security-negative.mjs`. Each has a hard reason:

- **`release.yml` `package-build`** — ephemeral exact-byte package production. `publish` uploads
  exactly this job's immutable artifact, keeping persistent runner state outside the public package
  build. The private source repository cannot receive npm provenance attestations. ~4 minutes, no
  browsers, no container.
- **`release.yml` `publish`** — npm trusted publishing does not support self-hosted runners
  (<https://docs.npmjs.com/trusted-publishers/>) and this repository holds no `NPM_TOKEN`.

Those two hosted release jobs are eligible only in `versioned-unpublished`. They are skipped for a
Version PR run and for a registry-only `published` state; moving work into them merely to make a
later deploy look faster is not allowed.

- **`deploy.yml` `sign-curated` and `deploy-curated`** — the OIDC signing job and the credential-only
  Cloudflare candidate upload. Neither executes repository code; both are ~1 minute. The latter's
  success is not terminal until `verify-public-boundary` and `deployment-complete` pass.
- **`deploy.yml` `verify-public-boundary`** — asserts that every non-registry route is anonymously
  reachable and that anonymous `/r/*` requests are rejected. A runner inside VegaStack's network
  can be silently authenticated by Cloudflare device posture, which would void the registry proof.
  The boundary test has to originate outside the trusted network.

Job containers are banned outright. They are Linux-only and cannot start on the minis, and the one job
that legitimately needed one — the three-engine suite in the digest-pinned Playwright image, because
bare `ubuntu-latest` WebKit could not settle the compiled-CSS Toaster contrast check — no longer runs
in CI. That suite takes 1m39s locally.

The minis still cannot launch Chromium (no per-user Mach bootstrap namespace; `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP,
reconfirmed in run `30150905149`). Under this topology that blocks nothing. Fixing it — reinstall the
Actions runner as a LaunchAgent inside a logged-in session — is optional, and worth doing only if you
later want a second machine independently re-running the browser lanes.

**Screenshots are not part of CI.** Pixel comparison is a local `/ship` step —
`node tooling/vrt-review.mjs` — reviewed by a human. Rationale and evidence:
`docs/ledger/operator-review.md`, 2026-07-25.

### Versioning model

`meta.version` on every registry item = `@vegastack/ui`'s package version (global). A bump moves all
items to the same number; `check-updates` compares by **integrity hash**, so a component only reports
an update when its content actually changed (no false positives from the global bump). The changeset
summary + `@vegastack/ui` CHANGELOG tell consumers _which_ components moved.

## Receive an update (downstream)

See `apps/docs/content/docs/install.mdx` → "Updating components". In short:

```bash
npx vegastack-design check-updates                       # what's stale
VEGASTACK_VERIFY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vegastack-verify.XXXXXX")"
VEGASTACK_ITEM="$VEGASTACK_VERIFY_DIR/item.json"         # this file must not already exist
npx vegastack-design verify --save "$VEGASTACK_ITEM" <name>  # integrity preflight
VEGASTACK_EXPECTED_INTEGRITY="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).meta.integrity)' "$VEGASTACK_ITEM")"
npx shadcn@latest add @vegastack/<name> --diff           # review
npx shadcn@latest add @vegastack/<name> --overwrite      # apply (re-apply local edits)
npx vegastack-design verify --post-write --item "$VEGASTACK_ITEM" --expected-integrity "$VEGASTACK_EXPECTED_INTEGRITY" --target-dir .
```

## Future (not yet built)

- Scheduled CI bot: `check-updates --fail-on-update --json` → opens a "design-system updates" PR.
- npm path for animated icons (`@vegastack/design/icons` animated mirrors) so they update via `npm update`.
- Per-item independent semver instead of the global `@vegastack/ui` version.

## Known edge: workflow files + the Version PR

The Actions `GITHUB_TOKEN` cannot push changes to `.github/workflows/*`. The Version PR now uses the
Changesets action's GitHub-API commit mode and a non-persisted checkout token, but a release run's
commit has workflow files that differ from the current `main` tip (e.g. a workflow edit landed
right after it, or the same push carries both a changeset AND a workflow change), the changesets
action's `changeset-release/main` branch push is rejected with
`refusing to allow a GitHub App to … update workflow … without 'workflows' permission`.
**Fix:** re-run the Release workflow on the current `main` tip (or push any no-op commit) — a run
whose base matches main has no workflow diff and the Version PR push succeeds. Avoid bundling
workflow edits with changeset-bearing pushes.

Downstream lifecycles (who gets updates and how, handover model): the public Guides plus the public,
unlisted/noindex `/internal/*` operations pages.
