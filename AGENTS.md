# AGENTS.md — vegastack-design

VegaStack's internal design system: Base UI + Tailwind v4 + OKLCH semantic tokens, distributed as
two public npm packages plus a private, Sigstore-signed shadcn registry. Consumed by humans and by
agents (Claude Code, Codex).

**This file is loaded into every session.** It holds the rules you can break before loading anything
else, the map, and a router. Procedures live in skills, loaded on demand.

**Status:** shipped and live on public npm, published token-free via OIDC trusted publishing from the
self-hosted runners (no GitHub-hosted runners; provenance disabled — the bundle needs a hosted runner,
and a private source repo emits none regardless). The complete
`design.vegastack.com` site is public; only its `/r/*` registry is behind Cloudflare Access Service
Auth. Operating mode: **build local; publishes and deploys go through the `ship` skill.** For actual
versions, ask the registry and the workspace rather than any document:

```bash
npm view @vegastack/design version                              # what consumers have
node -p "require('./packages/design/package.json').version"     # what this tree would publish
```

## Truth hierarchy

When two sources disagree, the higher one wins. This ordering matters more than any individual rule
below, because most wrong answers come from trusting a document that stopped being true.

1. **The source and the scripts that enforce it** — `packages/ui/registry/ui/*`,
   `tooling/design-lint.mjs`, and the `verify-*`/`sync-*` gates. If prose disagrees with an enforcing
   script, the script is right and the prose is a bug.
2. **Machine authorities** — `packages/ui/component-contracts.json` and `packages/ui/registry.json`
   for inventory, membership, and counts. Never quote a count from prose.
3. **Official docs for the version actually installed** — Base UI, Tailwind v4, shadcn, Next, React.
   Check `package.json`/the lockfile for the real version, then read that version's docs. These
   libraries change under us; recalled API knowledge is frequently a version behind.
4. **`design.md`** — the canonical design doctrine, and a _living_ document: it is gated by
   `pnpm design:sync:check`, so it must be brought forward whenever the system's direction changes.
   A change to component direction that leaves `design.md` behind is an incomplete change.
5. **This file** — always-on rules, the map, the router.
6. **Skills** — procedures, loaded on demand. More specific and usually newer than this file.

**Everything under `docs/plans/`, `docs/gap-analysis.md`, `docs/audits/`, and `docs/requirements.md`
is a point-in-time record.** They say what was believed and decided on a given date — several
declare themselves "preserved as the historical record" — and they are the right place to answer
_"why was this chosen, back then"_. They are **not** a source of current behaviour, current package
names, current counts, or current APIs. Do not cite them as evidence that something is true today;
confirm against 1–4 first. Locked decisions stay locked regardless of where they are written down.

## The five non-negotiables

1. **Edit the canonical source only.** Every component exists in three places; two are generated.
2. **Semantic tokens only.** No hex, no px, no raw Tailwind palette, anywhere in component source.
3. **Server-safe by default.** `'use client'` only at the lowest interactive leaf.
4. **Never hand-edit a generated file.** If a file says GENERATED, change its authority and rerun.
5. **Shipping is always MK's decision.** Prepare and stop. Approval for one step is never approval
   for the next.

## Task router

| You are about to…                                          | Do this                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Add or change a component, hook, or block                  | Load the **`component`** skill                                                           |
| Review or audit this repo — gates, compliance, drift, bugs | Load the **`review`** skill                                                              |
| Release, publish, deploy, or write a changelog entry       | Load the **`ship`** skill                                                                |
| A git hook blocked a commit, or `pnpm verify` failed       | Load the **`gates`** skill                                                               |
| Plan a non-trivial change                                  | Write a plan to `docs/plans/`, present it, wait for approval (§Planning)                 |
| Write or change a docs page                                | §Docs authoring below, then the `component` skill §6                                     |
| Understand what a component does                           | `docs/ledger/component-matrix.md`, or the MDX page                                       |
| Know the current counts                                    | §Numbers below — generated from the contract; never quote a count from prose             |
| Answer "why was this chosen"                               | The point-in-time record in `docs/` — see §Truth hierarchy before trusting it as current |
| Find a past bug or judgment call                           | `docs/ledger/bugs.md` · `docs/ledger/operator-review.md`                                 |

Skills live in `skills/{internal,public}/`, symlinked into `.claude/skills/` (Claude Code) and
`.agents/skills/` (Codex). Both agents load a skill automatically when the task matches its
description; Claude Code additionally accepts `/<directory-name>` to invoke one directly. Load the
skill rather than working from this file's summary — the summary is deliberately lossy.
See `skills/README.md` for the audience split and the rules that govern it.

## Locked decisions

Do not re-open these. The original rationale is in `docs/requirements.md` §3 and
`docs/gap-analysis.md` — historical records, so read them for _why_, never for _what is true now_.

- **Stack** — `@base-ui/react` primitives via shadcn `--base base`; Tailwind v4; Next 16; React 19;
  Node pinned to 24.20.0 by pnpm (`devEngines.runtime`, `onFail: download`) and run for every script
  whatever the host has on PATH; pnpm 11; Turborepo 2.
- **Distribution is hybrid** — public npm (`@vegastack/design` + zero-dep
  `@vegastack/design-tokens`) plus a private shadcn registry for components (copy-in).
- **Component model A (own it), no `Vega*` prefix** — export `Button`, not `VegaButton`. There is no
  pristine-shadcn tier; `shadcn add --diff` surfaces upstream changes for deliberate cherry-pick.
- **The provider ships as a registry item** — `shadcn add @vegastack/provider` is the sanctioned
  install path. The `@vegastack/ui` provider is a documented mirror of the canonical registry source.
- **Tokens** — DTCG → Style Dictionary (custom `color/oklch` transform, separate light/dark builds,
  `@theme inline` bridge). Runtime font/ease vars are `--font-family-*` / `--motion-ease-*`, never
  self-referential.
- **Docs** — Fumadocs, static export to Cloudflare Workers Static Assets. Storybook is deferred.
- **CI executes the browser lanes; nothing is attested.** Decided 2026-09-08, plan in
  `docs/plans/2026-09-08-verification-rebuild.md`. One command — `pnpm verify` — runs on a laptop, on
  a pull request, before a publish, and before a deploy, on the LAN Linux runners inside the pinned
  `mcr.microsoft.com/playwright` container whose tag is derived from `pnpm-lock.yaml`. This
  **supersedes** the local-first topology decided 2026-07-25 (`2026-07-25-cicd-local-first-revamp.md`,
  Option A): `.gates/receipt.json`, every `receipt-guard` job, the receipt carry, the change
  classifier, route scoping, `.husky/pre-push`, and `tooling/verify-hooks-installed.mjs` are all
  deleted. A receipt was attestation, not proof — `--no-verify` plus a hand-edited JSON defeated it —
  and it existed only because no free runner could launch a browser. On 2026-09-07 the LAN Debian
  boxes ran Chromium, Firefox, and WebKit. The premise was gone, so the mechanism went with it. A
  pull request, a release, and a deploy still each cost zero billable minutes.
- **Job containers are required on Linux and banned on the minis.** A container is Linux-only and
  cannot start on the macOS minis at all; on the Linux runners the pinned Playwright image is what
  makes a box interchangeable, so `tooling/verify-workflow-security.mjs` REQUIRES it (not merely
  permits it) on every `LINUX_JOBS` entry and rejects it everywhere else. The negative harness proves
  both halves by mutation. This narrows the previous outright ban.
- **Pixels stay a local review step**, unchanged: `node tooling/vrt-review.mjs` captures the base ref
  and the working tree on one machine and emits a before/after report a human reads during `/ship`.
  No screenshot is ever committed.
- **No CI job is GitHub-hosted.** Every job runs on self-hosted hardware — the mac minis for
  credential-only work and the cross-platform static signal, the LAN Debian boxes for the three
  verification jobs. A pull request, a release, and a deploy each cost zero billable minutes. The empty allowlist is enforced in
  `tooling/verify-workflow-security.mjs`, not a convention, and
  `tooling/verify-workflow-security-negative.mjs` proves a move back onto `ubuntu-latest` is rejected
  in either direction. Two release jobs and three deploy jobs used to be hosted; all five moved, and
  none of the moves lost a property that actually existed:
  - **npm publish** (`release.yml`'s `publish`) stays **token-free OIDC trusted publishing** — which
    **works on self-hosted runners**; only the provenance _bundle_ requires a GitHub-hosted runner.
    So `publish` calls `npm publish --no-provenance` directly (npm rejects a self-hosted provenance
    bundle with **E422**, and the `NPM_CONFIG_PROVENANCE` env is not honoured by the changesets
    action's OIDC path). The repo is public, so a hosted runner could attach provenance, but hosted
    runners are billing-locked, so releases ship without an attestation for now. Auth is the unchanged
    repository + `release.yml` trusted-publisher identity, and
    the workflow holds **no `NPM_TOKEN`** — a guard in the security gate forbids one. npm's public docs
    claim self-hosted is unsupported for trusted publishing; that is stale. The proof is sibling repo
    `vegastack/vegafactory`, which publishes as `@vegastack/skills`: versions 0.16.1–0.17.0 landed on
    npm from self-hosted runs on 2026-09-01, token-free OIDC, no attestations. Empirical reality
    outranks the docs.
  - **Sigstore signing** (`deploy.yml`'s `sign-curated`) keeps GitHub OIDC — it is minted by the
    Actions control plane and works on self-hosted runners, and the signer certificate identity is the
    workflow ref (`deploy.yml@refs/heads/main`), not the runner, so cosign verification is unchanged.
  - **`deploy-curated`** is credential-only Wrangler; nothing is runner-specific.
  - **`verify-public-boundary`** runs on the minis, which for the proof to hold must **not** be
    enrolled in Cloudflare Access device posture / WARP. This is fail-safe if they were: an
    authenticated "anonymous" `/r/*` request would return 200 and the probe would fail the deploy
    loudly, rather than passing falsely.
  - Nothing is downgraded: publishing keeps the same short-lived, workflow-bound OIDC auth it always
    had; the only change is where the job runs and that provenance (never actually emitted) is off.
- **The minis still cannot launch browsers, and it no longer blocks anything.** Their Actions runner
  has no per-user Mach bootstrap namespace, so every Chromium launch dies with `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP —
  reconfirmed in run `30150905149` (`launchd manager: System`, `gui domain: MISSING`), while the
  identical suite passes locally on the same OS and CPU. The fix is on the host: reinstall the runner
  as a **LaunchAgent in a logged-in session**. It is now an optional improvement, wanted only if you
  later want a second machine re-running the browser lanes — nothing in the topology waits on it.
- **Registry integrity** — whole-item SHA-256 in `meta.integrity`, a Sigstore-signed manifest
  (GitHub OIDC), and a fail-closed consume preflight.
- **Auth topology (approved 2026-07-28)** — every non-registry route is anonymous, including
  `/internal/*`; internal operations pages stay unlisted, `noindex`, and outside every public
  discovery corpus. `/r/*` alone is service-token-only. `SITE_VISIBILITY` controls discovery
  metadata only, never authorization.

### Sanctioned dependency exceptions

Adding to either list needs MK sign-off, tracked the same way.

- **Headless primitives** — non-Base-UI packages that own a behavioural core (interaction
  semantics or the state machine under them) but render nothing. Exactly four, each isolated
  behind one registry item so an engine swap touches one file:
  - `@shadcn/react/message-scroller` (MessageScroller) — the original exception.
  - `@tanstack/react-table` v8 — `data-grid`'s row-model state machine (sorting, visibility,
    order). It never touches DOM or focus; the APG grid keyboard layer is ours.
  - `@atlaskit/pragmatic-drag-and-drop` (+ `-hitbox`) — the drag engine behind `use-drag-reorder`
    (consumed by `board` and `sortable-list`). Pointer-first by design; the keyboard layer,
    live-region announcements, and "Move to…" menu equivalents are ours.
  - `react-dropzone` — the drop/paste acquisition engine behind `use-file-drop` (and `dropzone`'s
    thin shell).
    Approved by MK 2026-07-27 (plan `2026-07-26-crm-commissioned-components.md` §2.1, D1–D4).
    Nothing else — a fifth entry is a new MK decision, not a pattern to follow.
- **Measurement engine** — `@tanstack/react-virtual` (same D1/D2 sign-off): windowing maths for
  `data-grid`'s `virtualize` flag. It measures; it owns no interaction.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts`, `motion`, `tiptap`, and the
  pre-existing `sonner`. Each is named per-component in `packages/ui/registry.json`. These render or
  animate; they do not own interaction semantics, which is why they are a narrower class than the
  primitive exception above.

## Build rules

Enforced by `tooling/design-lint.mjs` and the `review` skill. Full token vocabulary:
`skills/internal/component/references/tokens.md`. Rule-by-rule explanations:
`skills/internal/review/references/lint-rules.md`.

- **Colour** — semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`). No hex,
  no raw palette. `text-muted-foreground-faint` is sub-AA: placeholder and disabled copy only.
  `info` is links and informational UI only — promotion and selection take a ladder rung or `primary`.
- **Surfaces are one ladder** — `background` → `card` (= `popover` = `sidebar`) → `surface-1` (rest
  fill / well) → `surface-2` (hover) → `surface-3` (pressed / selected). `secondary`/`muted`/`accent`/
  `sidebar-*` are ALIASES of those rungs with no independent values; name the rung in new code.
  `border` is derived as `foreground` at `--alpha-border`.
- **Hover/pressed come from the recipe, never a literal** — `surfaceInteractive` and
  `fillInteractive.<tone>` from `@vegastack/design`. No component writes its own `hover:bg-*`. Every
  control has a pressed step; a hover wash is inset ≥4px from a container hairline and inherits its
  inner radius.
- **Size** — `--size-*` for control heights, `--icon-*` for icon sizes. Never pass `size`/`width`/
  `height` directly to a lucide component.
- **Radius** — caps at `rounded-lg`. `rounded-xl` was removed and is banned.
- **Alpha vs. opacity** — different roles, not interchangeable. Colour compositing takes `--alpha-*`;
  whole-element opacity takes `--opacity-*`. Never a raw `/NN` or `opacity-NN`.
- **Z-index** — two bands: `z-(--z-raised)`, `z-(--z-overlay)`. No raw `z-N`.
- **Type** — the weight ladder is 400/500; `font-bold`/`font-semibold` are banned. Letter-spacing,
  blur, and shadow are owned by named roles — raw `tracking-*`/`blur-*`/`shadow-*` are banned.
  `text-4xl`+ is off-scale; use the display tier. **Uppercase is mono-exclusive** and ≤14px.
- **Motion** — `duration-fast/base/slow` paired with `ease-standard/emphasized/exit/spring` in the
  same class literal, or `motion-pop-in`/`motion-enter-up`/`motion-shake`/`motion-flash`. No raw `duration-[…]`/`ease-[…]`/
  `cubic-bezier()`. `animate-spin`/`animate-pulse` are the one loader exception. Colour changes are
  immediate: `transition-colors` and `transition-all` are banned.
- **Structure** — CVA for variants; `cn()` from `@vegastack/design`; `data-*` for state; ref-as-prop
  (React 19 — never `React.forwardRef`); Base UI `render` for composition (single-polymorphic-root
  components must not `Omit<…, 'render'>`).
- **Icons** — `lucide-react`, the lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon`. No
  other library, no inline `<svg>` as an icon. Icon registry items install as
  `@vegastack/icon-<name>`; the bare name is reserved for components, so `icon-button` is a component.
- **Responsive** — `min-w-0` on a truncating flex child, with `truncate` on an inner span, never on
  the same element as `flex`. Touch targets ≥24px via an invisible hit area, verified with a real
  `elementFromPoint` probe rather than `getComputedStyle`.
- **Layout** — compose `AppShell` (`packages/ui/registry/ui/app-shell.tsx`) rather than hand-rolling
  a sidebar + header + main shell. It owns the landmark trio, the skip link, and the content
  container query.
- **Server-safe by default** — a _runtime_ claim enforced by `tooling/verify-rsc-safety.mjs`, not a
  style preference: under the `react-server` condition most React hooks are `undefined`, so touching
  one without `'use client'` throws on import in an RSC. Which hooks, and why
  `@vegastack/design/theme-scope` is a separate subpath: `component` skill §3.
- **Accessibility** — WCAG 2.2 AA while preserving every existing 2.1 assertion. Visible
  `:focus-visible` (text-entry fields use a border tint instead). Must pass `axe`. Every applicable
  state implemented: default, hover, focus, loading, empty, error, success, disabled.

## Single source of truth

Every component exists in three synced places. **Edit one; a script regenerates the rest.**

| Place         | Path                                 | Status                              |
| ------------- | ------------------------------------ | ----------------------------------- |
| Canonical     | `packages/ui/registry/ui/<name>.tsx` | **EDIT THIS**                       |
| Docs copy-in  | `apps/docs/components/ui/<name>.tsx` | generated, byte-for-byte            |
| Registry JSON | `apps/docs/public/r/<name>.json`     | generated, carries `meta.integrity` |

```bash
pnpm run registry:build   # validate → build → stamp → header → verify-headers → verify-registry-deps
```

Idempotent and fully local. The copy-in exists to dogfood the `shadcn add` distribution (proven by
`verify-shadcn-consume.mjs` running the real CLI) — do not replace it with a path alias or symlink
without reopening the locked distribution decision. `preview/*.tsx` files only compose components;
never fix component styling there.

The same discipline governs every other generated surface:

| Authority                              | Regenerate with                        | Generated output                                                                |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/ui/registry/ui/*`            | `pnpm registry:build`                  | docs copy-in, `public/r/*.json`                                                 |
| `packages/ui/component-contracts.json` | `pnpm design:derived`                  | component matrix, the public skill roster, this file's §Numbers — all committed |
| `/CHANGELOG.md`                        | `node tooling/sync-changelog.mjs`      | the docs Changelog page                                                         |
| `skills/public/**`                     | `node tooling/sync-package-skills.mjs` | `packages/design/skills/**` (shipped in npm)                                    |
| `design.md`                            | `pnpm design:sync`                     | its derived doc surfaces                                                        |

**Not everything generated is committed.** Five contract-derived files — the contract routes, the
icon chunk count, the home catalog, the animated-icon gallery, and the cross-browser smoke
inventory — are **build outputs**: `.gitignore`d, listed in `tooling/lib/derived-build-outputs.mjs`,
and written by `prepare:content` (which already runs before `build`, `dev`, `lint`, and `typecheck`
in both `apps/docs` and `packages/ui`) or on demand by the few tooling readers that run before any
build. Never stage one; `pnpm design:derived:check` deliberately ignores them, and
`tooling/verify-component-contracts.mjs` regenerates them and reconciles the result against the
contract instead. What stays committed is the registry copy-in and `public/r/*` (locked
distribution decision) plus the derived PROSE above, which agents read straight out of git.

## Workflows

### Planning

Plan before implementing anything non-trivial. Write the plan to `docs/plans/`, present it, and wait
for explicit approval before writing code. A plan states scope, non-goals, the verification that will
prove it worked, and the risks. Historical plans stay — they are the decision record, not clutter.

### Verification ladder

Three commands. `pnpm verify` is the gate: it is byte-for-byte what `ci.yml` runs on a pull request,
what `release.yml` runs before a publish, and what `deploy.yml` runs before a deploy — so a green run
here is a green run there. Nothing is scoped to a diff and nothing is attested.

```bash
pnpm check:component <name>   # ~5s     design-lint · typecheck · that one component's test
pnpm verify                   # ~2.5min typecheck · lint · design:verify · browser suite · design CLI tests
pnpm verify:release           # deploy   BOTH docs matrices · links · registry · consume · 3 engines
pnpm run clean                # report only; `--after-run` / `--weekly` reclaim, `--dry-run` never removes
```

`pnpm verify` ends by running `tooling/workspace-clean.mjs --after-run` unconditionally — pass or
fail — and preserves the run's exit code, so a failed run leaves a clean tree rather than a directory
of test artifacts. `pnpm verify:release` runs only in `deploy.yml`.

Individual gates, when you want one directly:

```bash
node tooling/design-lint.mjs packages/ui/registry   # token + AST rules on component source
pnpm typecheck                                       # workspace-wide
pnpm exec turbo run test --filter=@vegastack/ui      # browser-mode unit + axe + geometry contracts
pnpm exec turbo run test --filter=@vegastack/design  # the vegastack-design CLI node suite
pnpm --filter @vegastack/ui test:all-browsers        # the complete suite in three engines
pnpm lint                                            # the full static gate chain — see package.json
pnpm registry:build && git status --porcelain        # must be idempotent: clean tree after
pnpm design:derived && git status --porcelain        # contract-derived surfaces must be current
node tooling/vrt-review.mjs                          # before/after pixels — review, not a gate
```

Go through turbo (or `pnpm verify`) for the browser suite rather than
`pnpm --filter @vegastack/ui test`: turbo's `test` task dependsOn `^build`, and the suite imports
`@vegastack/design`, whose dist is gitignored. Run bare in a clean checkout, vite cannot resolve that
import and the run HANGS on pre-transform errors rather than failing.

**What CI runs.** Every row is executed; nothing is taken on trust. The receipt-attested rows are gone.

| gate                                                                                               | runs where                                      |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm verify` — typecheck, lint, `design:verify`, browser unit + axe + geometry, design CLI tests  | `ci.yml`, `release.yml`, `deploy.yml`, on Linux |
| `pnpm typecheck && pnpm lint && pnpm design:verify` (no browser) — the cross-platform signal       | `ci.yml`'s `verify-macos`, on the minis         |
| `pnpm verify:release` — BOTH docs matrices, links, registry idempotency, consume, three engines    | `deploy.yml`, before `build-sign-deploy`        |
| `vrt-review` pixels                                                                                | local `/ship` step, never a gate                |

`.gates/receipt.json`, every `receipt-guard` job, `.husky/pre-push`, route scoping
(`tooling/lib/route-scope.mjs`), and the change classifier were **removed** by
`docs/plans/2026-09-08-verification-rebuild.md`. They existed because no free runner could launch a
browser; the LAN Linux runners can, inside the pinned Playwright container, so the lanes are executed
rather than attested. `--no-verify` and `HUSKY=0` stop being policy words.

`pnpm lint` is the umbrella: shadcn base check, skill lint, the public-skill mirror, security
boundaries, workflow security (+ its negative harness), secret scan, the `tooling` vitest project,
`design:verify` (token build, design.md sync, contract reconciliation, public API docs, animated
icons, theme parity, portal theme scope, **RSC safety**, toaster mirror, structural design-lint,
negative registry-integrity fixtures), then per-package lint.

Every gate fails closed. A gate that has never been observed failing is an assumption — that is why
`verify-design-lint-structural.mjs`, `verify-registry-integrity-negative.mjs`, and
`verify-workflow-security-negative.mjs` exist.

**The geometry contracts are the blocking visual-surface gate.**
`packages/ui/test/geometry.browser.test.tsx` mounts every preview fixture with the real compiled token
CSS and asserts 320px reflow, RTL containment, and an effective 24px pointer target measured with a
real `elementFromPoint` probe. It takes no screenshots and needs no baselines, so it cannot be cleared
by regenerating its own evidence, and it runs inside `pnpm verify` — locally and in CI. The
`apps/docs/vrt/contracts.spec.ts` suite it replaced also carried a focus-indicator check that could
not fail (it ran under `forcedColors: "active"`, where Chromium paints its own ring); that half was
dropped rather than ported. Evidence: `docs/ledger/bugs.md`, 2026-07-25.

**Pixel comparison is a local `/ship` step, not a gate.** `node tooling/vrt-review.mjs` captures the
affected routes at the branch's merge-base and again at the working tree, on one machine minutes
apart, then writes `.vrt-review/report.json` plus before/after/diff PNGs. It exits 0 for any pixel
outcome and 2 only when it could not produce a report — a pixel difference is not a defect, and only
a human can say whether it was intended. Procedure: the `ship` skill.

One cost is accepted deliberately: **nothing enforces layout drift in CI** — the price of removing a
gate whose only escape hatch was overwriting the evidence under review.

Cross-browser policy: `pnpm verify` runs Chromium; `pnpm verify:release` runs the complete suite in
all three engines, in `deploy.yml`. The cross-engine risk smoke and its generated selection are gone
with the receipt topology — the release run covers everything they sampled.

### Docs authoring

A component page is part of the component, not a follow-up, and it serves humans and agents from
the same source. **The page canon — the fixed section order, what each section must contain, and
which authority generates it — is `design.md` §Docs canon.** Read that table before writing or
changing a page; the summary here is deliberately lossy.

The parts that are not negotiable from anywhere: sections appear in the canon's order and nothing
follows Do/Don't except the generated Changelog; the machine-readable half of a section is
generated (`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`, `ComponentChangelog`), never
typed; an API table lists own props only, expanded, with the literal union — a part with no own
props gets one sentence, never placeholder rows; the Story explorer appears only where no curated
playground does (DD-3).

Register the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the
barrel, and add the component's record to `component-contracts.json` so its contract route and its
`dataAttributes` are generated. No `{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs`
rejects skipped visual tests; `tooling/verify-docs-export.mjs` rejects a page whose markdown export
still carries JSX or an empty API table. Guides pages live in `apps/docs/content/docs/guides/`;
unlisted/noindex operations guides live in `apps/docs/content/internal/` and are public by policy
even though they are excluded from discovery.

### Review and audit

The `review` skill covers both halves. **Audit** is deterministic — run the gates, triage against
the 34-rule set. **Adversarial review** hunts what no gate can see: false coverage claims, fail-open
gates, stale generated files. Verify every claim by execution, classify high/medium/low, fix at the
root, and record the round in `docs/ledger/codex-rounds.md`, `bugs.md`, and `operator-review.md`.
Run both before shipping anything user-visible.

### Releasing

Read the `ship` skill; `docs/RELEASING.md` is the reference. The parts you must know before you touch
anything:

- **Shipping is always MK's decision.** Agents prepare; agents never push changeset-bearing commits,
  merge the Version PR, or dispatch `deploy.yml` without an explicit "yes proceed" for _that step_.
- **GitHub Team/private approval model** — required-reviewer environments are unavailable, so the
  workflows use the proven repository secrets and trusted-publisher identity. Review the change PR;
  merging the reviewed Version Packages PR authorizes npm publication; manually dispatching Deploy
  authorizes the registry/docs release. MK may be the actor, but each outward step still requires its
  own explicit MK decision under the `ship` skill.
- **The changelog is a system.** `/CHANGELOG.md` is canonical, with a fixed section vocabulary
  (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`). Edit it, run the sync, never touch the generated docs page.
- **Production has one boundary contract.** Every deploy verifies that all non-registry routes are
  public, `/internal/*` remains undiscoverable/noindex, and `/r/*` rejects anonymous requests while
  accepting and cryptographically validating the service-token response. The retired cutover history
  is in `docs/plans/public-docs-cutover.md`; never reintroduce its phase switch.
- **Registry updates are pulled, never pushed.** Downstream: `check-updates` → `--diff` →
  `--overwrite`. Status is by integrity hash, so a component reads `up to date` when the global
  version bumped but its content did not change.

## Repo map

```
packages/
  design-tokens/   zero-dep DTCG token contract (theme/base/utilities CSS + JSON)
  design/          cn() · icon runtime · Tailwind v4 preset · vegastack-design CLI · shipped skills
  ui/              PRIVATE registry workspace — canonical component sources + registry.json
apps/docs/         Fumadocs showcase, guides, and the registry host (public/r)
tooling/           registry hashing/verification · design-lint · content, changelog, skill lints
  verify.mjs         `pnpm verify` and `verify:release` — two modes, per-step env, cleanup finally
  workspace-clean.mjs  scratch reclamation: --after-run / --weekly, with a sticky --dry-run
  pre-commit.mjs     the pre-commit hook body (design-lint + prettier over the staged set)
  test/              the `tooling` vitest project, run by `pnpm lint`
  runner/            provision-linux-runner.sh — enrol a Debian box as an Actions runner
.husky/            pre-commit · commit-msg. No pre-push; CI runs the same command.
skills/internal/   maintainer skills (never published)
skills/public/     consumer skills (mirrored into @vegastack/design)
docs/runbooks/     developer-machine-setup · ci-runner-provisioning-{linux,macos}
docs/              requirements · gap analysis · plans · ledgers · research
.github/workflows/ ci · release · deploy
```

`packages/ui/registry/ui/` holds components and hooks; `packages/ui/registry/blocks/` holds
copy-once starter compositions. Registry item types beyond `registry:ui`: `registry:hook` for a pure
hook (plain `.ts`, no `.tsx`) and `registry:block` for a starter the consumer owns after install
rather than tracking for updates.

**Reference repos** — read these rather than re-deriving: `~/code/references/fumadocs`,
`~/code/engg-vegastack-platform`, `~/code/references/resend-design-skills`. The **reference
consumer**, and the executable ground truth for every guide claim, is
`~/code/vegastack-design-starter` (local-only; consumes production npm + registry; its smoke suite is
the contract).

## Numbers

`packages/ui/component-contracts.json` is the machine authority;
`tooling/verify-component-contracts.mjs` fails on any missing or duplicate reconciliation. The block
below is generated — never hand-edit it, and never quote a count from memory.

<!-- NUMBERS:START — generated by tooling/sync-component-derived.mjs from packages/ui/component-contracts.json. DO NOT EDIT. -->

- **Registry items: 559** — 112 components · 439 animated icons · 7 hooks (`use-animation-replay`, `use-announcer`, `use-drag-reorder`, `use-file-drop`, `use-list-nav`, `use-mobile`, `use-platform`) · 1 block (`dashboard-01`)
- Contract SHA-256: `a4f9a314360d010b74497e64248482bb85cd25414c2bbb6bbad228560944e808`

<!-- NUMBERS:END -->

Everything else is volatile and has a command instead of a number: docs pages
(`find apps/docs/content -name '*.mdx' | wc -l`), registry items served
(`ls apps/docs/public/r/*.json | wc -l`).

## Escalation

- **Needs MK, always** — any outward step (push a changeset-bearing commit, merge a Version PR,
  dispatch a deploy, change Cloudflare Access), and any new sanctioned
  dependency exception.
- **A rule here conflicts with a skill** — the skill is more specific and usually newer; follow it,
  and flag the conflict so one of them gets fixed. Never silently pick one.
- **A rule conflicts with the code** — the enforcing script is ground truth over any prose, including
  this file. Fix the prose.
- **Something is genuinely missing or ambiguous** — stop and ask. Do not invent a decision, and do
  not re-open a locked one to work around a blocker.
