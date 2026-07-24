# Plan — System Audit Remediation & Consistency Overhaul (2026-07) · v5

> **Historical record — no current authority.** This remediation run is complete. Its autonomous
> execution language, component counts, package paths, statuses, and gates describe the July 2026
> run only. Follow `AGENTS.md`, current source/scripts, and the applicable repo skill today.

**Status: AUTONOMOUS EXECUTION AUTHORIZED (MK, 2026-07-15) — go-dark end-to-end per `docs/plans/HANDOFF-FABLE5.md` §Autonomy contract: no approval pauses, self-verified gates, micro-decisions logged to `2026-07-decisions-log.md`, NO commits/tags/pushes until MK asks, transitions.dev fully cleared by MK (no license flag). Phase −1 rails complete; execution begins at Phase P. Accent = phosphor green, theme-split per CX-9.**

Findings corpus: `docs/audits/2026-07-14-system-audit/` (00–17 + 18 = adversarial review). This revision reorders phases into a dependency-correct DAG, fixes internal contradictions Codex proved, and dispositions all 16 Codex findings below.

## Codex adversarial-review disposition (all 16 findings)

| #     | Sev     | Finding                                                                                                                                                            | Disposition                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CX-1  | BLOCKER | transitions.dev has no license grant covering snippets                                                                                                             | **MK DECISION** (§Open 1): obtain written rightsholder grant, or switch D11 to clean-room reimplementation (concepts only, no copied code/values/structure). Execution of Phase M (motion) blocked until resolved.                                                                                                                                                                                                        |
| CX-2  | BLOCKER | Phase gates internally impossible (lint bans before migrations; VRT baselines after visual rewrite; shell motion before shell)                                     | **ACCEPTED** — new Phase −1 freezes baselines pre-change; every token migration lands atomically WITH its lint rule in the same phase; shell motion moved into shell phase.                                                                                                                                                                                                                                               |
| CX-3  | BLOCKER | Registry `meta.version` (hardcoded 0.1.0) not synced with Changesets; release.yml ordering can dirty registry:build                                                | **ACCEPTED** — Phase −1 builds one `version-sync` command (changesets version → stamp item meta.version → registry:build → verify pkg=item=header equality) and proves it with a disposable bump test before any component change.                                                                                                                                                                                        |
| CX-4  | MAJOR   | Base UI Autocomplete ≠ cmdk Command API (useCommandState, keywords, forceMount, scoring, loop)                                                                     | **ACCEPTED** — keep cmdk until parity proven; write characterization tests first (ranking, arrows, Home/End, loop, disabled-skip, Escape/focus-return, IME, async, controlled filter); then decide adapter vs breaking API. Timing = MK decision (§Open 2).                                                                                                                                                               |
| CX-5  | MAJOR   | Command→Combobox sequencing duplicates work; "zero Radix in lockfile" impossible (Fumadocs pulls Radix)                                                            | **ACCEPTED** — Combobox primitive builds FIRST, Command derives from it, selectors refactor once. Purity criterion re-scoped: zero Radix in **@vegastack/ui registry dependency graph**, not the workspace lockfile.                                                                                                                                                                                                      |
| CX-6  | MAJOR   | Global text-* remap has uncontrolled Fumadocs blast radius (chrome shrinks, prose stays 16px, foundations.tsx asserts 16px)                                        | **ACCEPTED (amended D2)** — two-layer goal stands, but the remap is SCOPED: token-driven `text-*` values apply to component/product surfaces via a scoped layer; Fumadocs chrome/prose get an explicit compatibility boundary + deliberate prose spec; docs foundations pages updated; VRT before/after per CX-2.                                                                                                         |
| CX-7  | MAJOR   | Opacity migration conflates channel-alpha vs element-opacity vs precomposed colors; 12+ alpha values → 4 tokens not lossless                                       | **ACCEPTED** — Phase T2 starts with a migration TABLE from the measured histogram (/70×28, /30×19, /50×11, /20×11, /10×8, /80×7 …) classifying every site into: element-state opacity tokens, channel-alpha tokens (kept per-role), or precomposed semantic colors. No raw-opacity lint ban until the table is fully migrated + contrast/VRT verified.                                                                    |
| CX-8  | MAJOR   | Component-type z-ladder breaks portaled nesting (Select-in-Dialog); sonner ships z 999999999                                                                       | **ACCEPTED** — replaced with a portal-stacking CONTRACT (few bands + DOM-order within band), tested for Select/Popover/Tooltip/nested-Dialog/toast inside Dialog+Sheet; sonner explicitly integrated or documented-exempt.                                                                                                                                                                                                |
| CX-9  | MAJOR   | Phosphor oklch(0.86 0.21 148) fails 3:1 on light bg (1.40:1) and is 1.63:1 from dark success-text; chart-7 collision                                               | **ACCEPTED** — brand becomes theme-split role tokens (light: darker/deeper green meeting 3:1 for meaningful glyphs; dark: the bright phosphor); AI-live vs success differentiated by shape/motion/label not hue alone; CVD side-by-side check; chart-7 reassigned if collision confirmed. Hue direction (green) unchanged — MK's pick stands.                                                                             |
| CX-10 | MAJOR   | Brand phase not spec-ready (v3/v4 heading drift, stale Lora ref, stale "hue pending" refs, no font-delivery contract, marketing scope undefined)                   | **ACCEPTED** — this revision fixes all stale references; Phase B adds: scoped marketing surface mechanism (independent of global `.dark`), explicit font-delivery contract (geist npm exports incl. the five Pixel cuts, Newsreader via next/font + self-host fallback for static export), and a marketing→product handoff prototype BEFORE token finalization.                                                           |
| CX-11 | MAJOR   | IconButton deletion discards compile-time aria-label guarantee; audit's own conditions (AST rule + deprecation window) not in plan                                 | **MK DECISION** (§Open 3): retain, or delete only with AST accessible-name lint rule + codemod + one-release deprecation.                                                                                                                                                                                                                                                                                                 |
| CX-12 | MAJOR   | variant/intent flattening contradicts synthesis (Badge needs both axes); dotted exports removal = churn; Button xs IS documented; renames lack alias window        | **AMENDED by MK greenfield directive 2026-07-15**: `variant`/`intent` stay orthogonal where both axes exist (correctness, kept). Button `xs` kept & specced. BUT: NO alias windows / deprecated re-exports (zero downstream consumers exist — renames are direct), and exports unify to FLAT-ONLY (dotted namespaces removed; one convention, no duplicate API surface). Codex's churn objection is moot in a greenfield. |
| CX-13 | MAJOR   | Base UI data-starting-style can't express number replay/shake/check-draw; VRT disables animations; Chromium-only                                                   | **ACCEPTED** — motion mechanism matrix: Base UI lifecycle (overlays/disclosures) · keyed presence (icon/text swaps) · explicit replay APIs (shake, check, number) ; computed-style + replay + interruption + reduced-motion unit tests; WebKit/Firefox smoke lane.                                                                                                                                                        |
| CX-14 | MAJOR   | "4 new components" masks ~15 artifacts; scope unrealistic as one program                                                                                           | **MK DECISION** (§Open 4): MVP-first (ship core registry, defer expansion phases) vs full program in the restructured order. Phases are now sliced so either path is executable.                                                                                                                                                                                                                                          |
| CX-15 | MAJOR   | Final gate commands unrunnable (`test:vrt` not at root); docs-bloat fix pre-selected while audit calls it a hypothesis; per-preview theme toggle breaks on portals | **ACCEPTED** — exact runnable gate commands recorded below; docs bloat re-scoped to a profiling spike with raw/compressed budgets before choosing the mechanism; per-preview theming via iframe isolation or deferred.                                                                                                                                                                                                    |
| CX-16 | MAJOR   | Audit corpus partially stale (marker/bubble refs since fixed, VRT no longer silent no-op, Geist Pixel = 5 exports not ELSH axis); forwardRef urgency overstated    | **ACCEPTED** — Phase −1 re-baselines the findings register from a frozen commit, marking each finding open/fixed/stale/deferred; counts recomputed mechanically. forwardRef migration downgraded to opportunistic (React 19 supports both; not deprecated yet).                                                                                                                                                           |

## Open decisions — RESOLVED by MK 2026-07-15

1. **transitions.dev (CX-1)**: MK confirms full open-source status via the author's public tweet and directs adaptation. Recorded basis: author's tweet (MK to archive the link in this repo — TODO in Phase M). Implementation approach unchanged from the disposition: study snippets as reference, re-express in Base UI idiom on our tokens — no verbatim code/value copying, so the work product is our own expression regardless.
2. **Command rebuild (CX-4/5)**: REBUILD IN THIS PROGRAM — MK: greenfield, breaking API acceptable. Order preserved: Combobox primitive → characterization tests (as spec transfer, since API may break) → data-driven Base UI Command. cmdk removed at the end of Phase X1.
3. **IconButton (CX-11)**: RETAINED — documented thin wrapper over Button size="icon*" whose job is the compile-time aria-label guarantee. D5 reversed.
4. **Scope (CX-14)**: FULL PROGRAM in the v5 order.

## Decisions D1–D20 (MK, 2026-07-14/15) — unchanged except as amended by dispositions above

D1 keep single overlay shadow · D2 two-layer type scale **scoped per CX-6** · D3 semibold cap 600 · D4 destructive soft-only · D5 IconButton **→ §Open 3** · D6 four new comps (**timing → §Open 4**) · D7 Base UI purity **re-scoped per CX-5** · D8 upgrades minus TS7 · D9 renames **+ alias window per CX-12** · D10 subtle motion pack · D11 transitions.dev **→ §Open 1** · D12 shell = component+block · D13 docs infra everything (**bloat = spike per CX-15**) · D14 full responsive remediation · D15 authoring infra · D16 phosphor green **theme-split per CX-9** · D17 Newsreader + one Pixel flourish · D18 sharp 2px marketing gesture · D19 marketing = last build phase · D20 brand mechanics (alpha-ramp, mono voice, uppercase-mono-exclusive lint; accent-budget = guidance).

---

# Restructured phase DAG (dependency-correct per CX-2)

**Gate commands (exact, runnable — CX-15):** after every phase: `pnpm lint && pnpm typecheck && pnpm test` (root) · `pnpm --filter @vegastack/docs test:vrt` · `pnpm registry:build && git diff --exit-code apps/docs/public/r apps/docs/components/ui` (idempotency) · `pnpm registry:verify-consume` where components changed.

## Phase −1 — Freeze & prove the rails (NEW, CX-2/3/16)

1. Freeze commit; tag `audit-baseline`.
2. Bootstrap VRT baselines on CURRENT visuals (all 68 pages, desktop 1280 + mobile 375 project added now) and commit them — every later visual change reviewed as a diff against today.
3. Build + prove `version-sync` (Changesets ↔ registry item meta.version ↔ provenance headers, one command, disposable bump test) — CX-3.
4. Re-baseline the findings register: every finding marked open/fixed/stale/deferred from the frozen commit (CX-16); recompute counts.
5. Record gate commands (above) in CI + docs.

## Phase P — P0 fixes first (was Phase 1)

Popover/sheet `outline-none` WCAG fix (+dialog latent) · sidebar collapsed labels · truncated-text keyboard access · notification-bell phantom registry dep · field horizontal description bug · marker/bubble `'use client'` (verify against frozen commit — CX-16 says refs since fixed; confirm directive state).

## Phase T — Token foundations, atomic slices (each slice = tokens + migration + lint rule + VRT together, CX-2/7/8)

- **T1 typography**: scoped two-layer scale per CX-6 (component-surface remap + Fumadocs boundary + prose spec + foundations-page updates). Display tier + tracking scale. text-h*/label/code aliases.
- **T2 opacity**: migration table from measured histogram; three concept classes (element/channel/precomposed); migrate all ~125 sites; only then enable lint ban.
- **T3 z-index**: portal-stacking contract + nested-overlay tests + sonner integration/exemption.
- **T4 motion tokens**: ease-spring (linear()), motion-blur, duration-400 resolution; bare-transition fixes (all ~37) + missing overlay eases + select scale bug + lint rule.
- **T5 sizes/radius/icons**: wire --size-sm/md/lg into controls; radius-xs + radius-sharp; drop radius-xl (bubble→lg); icon-size tokens; sidebar width tokens; JS timing constants module.
- **T6 brand**: theme-split phosphor role tokens (CX-9) + CVD check + chart-7 resolution; display/mono-label/serif(Newsreader)/pixel font tokens + font-delivery contract (CX-10); token hygiene (17 literal OKLCH → primitive refs, $description).

## Phase U — Upgrades, isolated (CX-2)

shadcn 4.13 + `registry validate` wiring · ESLint 10 · react-day-picker 10 (date-picker adaptation) · @shadcn/react 0.2.1 · lucide pin alignment. No component-behavior changes in this phase. contrast-check purple cleanup + coverage additions.

## Phase C — Consistency & structure (excluding items under §Open)

Remaining sweep items: focus outlier (bubble ring→border-tint) · color-picker shadow-sm · chevron policy · dark-tint scoping doc · TableHead height · Card padding spec=16 · a11y mediums (live regions, aria-disabled pagination, image alt, reduced-motion scrollTo, text-edit labelledby, emoji-picker roving tabindex, alert-dialog loading, field-inline states) · true-synonym prop unification only (CX-12) · Spinner/Badge DRY composition · axe state-variant test expansion · renames (Empty, RegionSelect + data split) WITH alias items + deprecated re-exports · Field shadcn-shape adoption.

## Expansion phases (order fixed; run now or as later cycles per §Open 4)

- **Phase X1 — Combobox primitive** → then Country/RegionSelect refactor → then (if §Open 2 = rebuild) Command characterization tests + rebuild.
- **Phase X2 — Attachment, Resizable, Chart** (Chart before shell block).
- **Phase R — Responsive remediation** (viewport clamps, min-w-0, overflow strategies, touch targets, dvh/safe-area, container queries) + mobile VRT already live from Phase −1.
- **Phase M — Motion pack** (blocked on §Open 1): mechanism matrix per CX-13; component mapping table from v4 retained (overlays/menus/swaps/badge-pop/success-check/error-shake/skeleton-reveal; AnimatedNumber + TextShimmer primitives); exclusions unchanged (#11/#19/#20); replay + reduced-motion tests; WebKit/Firefox smoke.
- **Phase S — App shell**: Sidebar mobile/rail/inset/skeleton → AppShell (landmarks, skip-link, TruncatedText integration, container queries; router-focus/cookie responsibilities split per audit 11) → dashboard-01 block (uses Chart, AnimatedNumber) → shell/page View Transitions (moved here from motion per CX-2).
- **Phase D — Docs infra**: bloat profiling SPIKE first (budgets: raw/compressed/network) → chosen fix; SEO pack; /r/* _headers; Turbo remote caching; copy-as-prompt; responsive-frame toggle; per-preview theme via iframe isolation or defer (CX-15); playground last.
- **Phase A — Authoring infra**: add-component skill overhaul (post-sweep canon incl. D20 rules + motion matrix + responsive/a11y checklists); design-audit sync; motion-lint; AST accessible-name rule (needed for §Open 3 either way); ledger refresh.
- **Phase B — Brand/marketing layer**: marketing scope mechanism prototype FIRST (CX-10) → primitives (SectionHeader, FigureFrame, Terminal, LogoRow, Testimonial, StaggeredTextReveal, ParticleField, sharp mono CTA) → docs home dogfood → design.md usage rules (accent marker-roles guidance, sharp scoping, mono voice, Pixel single-use).

## Phase Z — Finalization

design.md + AGENTS.md updates (all deltas incl. Button xs documented, D3/D4/D20) · full gate (commands above) · changesets via proven version-sync · **STOP before publish/deploy — MK triggers.**

## Not-in-this-build — ONLY externally-blocked items (MK 2026-07-15: nothing deferred for compat/scope reasons)

- TypeScript 7 — blocked externally: 7.1 programmatic API not shipped; typescript-eslint incompatible today.
- WCAG 3.0/APCA — blocked externally: not a W3C Recommendation; APCA dropped from normative draft. Gate stays 2.x AA.
- DTCG Resolver modules — blocked externally: tooling immature.
- Geist Serif — blocked externally: unreleased (Newsreader until then).
- PR preview deploys — conflicts with the locked build-local/stop-at-publish operating mode (MK's own rule), not a deferral.
- Storybook — locked architecture decision (requirements §3), not a compat deferral.

**Greenfield amendments (supersede earlier hedges):** Item component now IN scope (Phase X2). forwardRef → ref-as-prop migrated on ALL 24 components in Phase C (one convention, no legacy style). No alias/deprecation mechanisms anywhere. Flat-only exports. No "documented exception" grandfathering in lint rules — every rule applies to every component uniformly.
