# Execution Report — 2026-07 Full-System Overhaul (plan v5)

**Run:** autonomous (Claude Fable 5), 2026-07-15 → 2026-07-16, branch `feat/local-build`, uncommitted per directive.
**Scope executed:** the full phase DAG — P → T1–T6 → U → C → X1 → X2 → R → M → S → D → A → B → Z (Phase −1 rails pre-existing).
**Companion records:** `2026-07-decisions-log.md` (every micro-decision, per phase), `2026-07-execution-checklist.md` (items checked with inline gate evidence), `docs/plans/.{phase}-*-summary.md` (per-agent working summaries).

---

## Final gate (run at the very end of Phase Z, all green)

| Check | Result |
|---|---|
| `pnpm lint` (eslint + design-lint on registry, blocks, previews, token CSS + content-lint + provider-dogfood) | ✓ 10/10 tasks, zero warnings |
| `pnpm typecheck` | ✓ 10/10 tasks |
| `pnpm test` (Vitest browser, Chromium) | ✓ **1120/1120** tests, 91 files |
| `pnpm --filter @vegastack/ui test:smoke` (Chromium + WebKit + Firefox) | ✓ **450/450** (10 motion-exercising files × 3 engines) |
| `pnpm registry:build` idempotency (build-twice, byte-compare public/r + copy-ins + registry.json) | ✓ byte-identical, **525 items** |
| `pnpm registry:verify-consume` | ✓ real shadcn CLI 7/7 graphs + simulated 525/525 × 2 layouts, tsc clean |
| VRT (Playwright, fresh build enforced) | ✓ **182/182** — 91 pages × 2 lanes (desktop 1280×720 + mobile 375×812) |

## Per-phase outcomes (details in the checklist/decisions log)

- **P** — 7 P0 register items fixed (focus-outline WCAG fix, sidebar labels, truncated-text keyboard access, registry dep hygiene, field description bug). Bonus: fail-closed `verify-registry-deps` gate added.
- **T1–T6 (tokens)** — two-layer type scale + display tier; 24 alpha/opacity role tokens (one real AA failure found & fixed by the new composited contrast gate); z bands; motion tokens incl. `--ease-spring`; control/icon/radius/sidebar size tokens (`radius-xl` removed); theme-split phosphor `--brand`, chart-7→olive, Newsreader/Pixel font tokens. Every slice landed with its lint rule; 90-check contrast gate green.
- **U** — shadcn 4.13, ESLint 10, react-day-picker 10, @shadcn/react 0.2.1, lucide pin, isolated.
- **C** — flat-only exports (587 call-sites), `intent` unification, renames (empty, region-select) with zero aliases, ref-as-prop everywhere, size props, Spinner/Badge DRY, a11y mediums, ~75 state axe tests.
- **X1** — Combobox (18 exports); Command rebuilt data-driven on Base UI from an 11-test characterization spec (9 pins unchanged, 2 documented deviations); cmdk fully removed; country/region selects became thin Combobox compositions (region tests passed 0-edit).
- **X2** — Item, Attachment (premise-corrected: no upstream headless primitive exists — self-owned), Resizable (v4 API verified against installed types), Chart (token-only theming; shadcn THEMES machinery deleted). VRT reduced-motion emulation added; the threshold-masking trap documented + delete-then-regen rule adopted.
- **R** — menu/select viewport clamps; SelectValue/ComboboxValue display-conflict fix (verified in the compiled cascade first); flex-truncate lint; tabs/pagination overflow strategies; ≥24px invisible hit-areas on every sub-floor control (elementFromPoint-proven; native-button ::before clipping discovered); TruncatedText tap-to-toggle on touch; safe-area insets; settings-row container queries; **mobile VRT lane**; AutoTypeTable made deterministic (own-props-first sort — build-order nondeterminism was failing cross-build VRT).
- **M** — motion vocabulary (`motion-pop-in`/`enter-up`/`shake`) + raw-motion lint; keyed-presence icon swaps; MutationObserver-based auto shake-on-invalid (`use-animation-replay` hook item — focus-preserving class-toggle replay); badge pop; SkeletonReveal; AnimatedNumber (rAF tween, token-driven, a11y-quiet); check-draw premise corrected (lives in the animated-icon handles); WebKit/Firefox smoke lane (day-one catch: WebKit tab-focus convention).
- **S** — Sidebar mobile Sheet mode/Rail/Inset/MenuSkeleton/variants/cookie persistence + `use-mobile` hook; PageHeader banner landmark + TruncatedText title; BreadcrumbTrail collapse; AppShell composition layer (landmarks, skip-link, container queries, router-agnostic); `dashboard-01` registry:block; View Transitions wiring + reduced-motion gap closed in base.css. Tooling hardened: .json payloads header-skip, consumer-target copy-in guard, VRT fresh-build enforcement (`reuseExistingServer: false`).
- **D** — bloat spike: **785MB → 220MB (−72%)**; worst page 16.4MB→4.2MB raw / 512→189KB gz (own-props-only API tables); SEO pack (metadataBase, sitemap, robots, 91 static OG images — proven under `output: 'export'`); `/r/*` CORS + revalidating cache `_headers`; Turbo remote caching wired (inert until secrets); copy-as-prompt; responsive-frame toggle; per-preview theme deferred per CX-15 with written rationale; PropsPlayground.
- **A** — skills v0.2.0 (add-component authoring contract; design-audit 1:1 lint-rule mirror); AST `icon-button-name` rule; docs previews permanently design-linted (27 violations fixed, none suppressed); ledger/matrix refreshed (rows 65–75).
- **B** — `.vs-marketing` scope (dark marketing surface independent of page theme); 8 marketing primitives + Button `cta`; docs home rebuilt as the dogfood (reviewed against audit 17's checklist — accent budget held); design.md Brand rules; `uppercase-mono` lint (D20); **icon items renamed `icon-<name>`** (439 — collision class eliminated) + public/r pruning shipped.
- **Z** — design.md/AGENTS.md synced (incl. 45%→50% disabled fix, solid-destructive removal, card padding triple-error, 256→240px sidebar, focus-model contradiction); changeset authored; this report.

## Notable systemic finds (beyond the plan)

1. **VRT trust chain hardened three times**: recharts JS animation vs screenshot (→ reduced-motion emulation), `maxDiffPixelRatio` masking sub-1% regressions on tall pages (→ delete-then-regen rule; see recommendation below), stale reused dev servers pinning outdated baselines (→ `reuseExistingServer: false`).
2. **AutoTypeTable nondeterminism** (ts-morph symbol order per program instance) was silently shuffling API tables every build — now sorted own-props-first, which also became the docs-bloat fix.
3. **Registry pipeline gaps** found by real breakage: JSON payloads corrupted by comment headers, consumer-app targets installed into the docs app, 965 stale JSONs accumulating (one actively re-stamping dead identities) — all now fail-closed.
4. **tailwind-merge classGroup** bit twice (text-h1 in T1, text-mono-label in B) — the custom-utility registration step is now part of the add-component skill.

## Recommendations for MK (not acted on)

- **VRT threshold**: `maxDiffPixelRatio: 0.01` on 50k+-px pages ≈ hundreds of kB of masked pixels. Consider a per-page or absolute-pixel budget (`maxDiffPixels`) for tall pages.
- **Left/right sheets** could additionally pad `env(safe-area-inset-bottom)` for footer actions (design note from Phase R).
- **Per-preview theme toggle** is deferred (CX-15 sanctioned): the clean path is an iframe-isolated preview route; Base UI `Portal` `container` plumbing would be the component-level alternative.

## MK-only actions (everything the directive reserves for you)

1. **Review + commit** this branch's work (single squash or per-phase — the checklist/decisions log map cleanly to either), then **push**.
2. **Freeze-commit/tag** `audit-baseline` if still wanted retroactively (Phase −1 note).
3. **Archive the transitions.dev author's tweet link** in-repo (CX-1 resolution's recorded TODO).
4. **CI Linux VRT baselines**: run `vrt.yml`'s `update_baselines` job (local darwin baselines are gate evidence only, untracked, ~500MB).
5. **Turbo remote cache**: provision `TURBO_TOKEN` secret + `TURBO_TEAM` var (wiring is inert until then).
6. **Release**: merge to `main` (release.yml versions via the authored changeset `2026-07-system-overhaul.md` + version-sync, publishes npm) → run the manual **Deploy** workflow (build + Sigstore-sign + Cloudflare).

*No commit, tag, push, publish, or deploy was performed by this run.*
