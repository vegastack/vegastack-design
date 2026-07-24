## Findings

Review basis: current working tree at `89b35c2`, with execution already in progress and 944 changed paths. “Stale” below means inconsistent with the current tree; the corpus does not preserve a clean audit commit, so historical correctness cannot always be reconstructed.

1. **BLOCKER — transitions.dev cannot be “vendored” on the evidence available**

   - **Challenges:** D11 and Phase 7 in the [plan](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:21); [audit 10](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/10-transitions-dev.md:53).
   - **Evidence:** The upstream repository has no root license covering the snippets; the MIT grant is scoped to Refine. The audit itself recommends inspiration-only and rejects verbatim vendoring. The [upstream repository](https://github.com/Jakubantalik/transitions.dev) still exposes no clear root redistribution grant.
   - **Recommendation:** Archive an explicit written rightsholder grant covering modification and commercial/private-registry redistribution. Otherwise change D11 to clean-room reimplementation of general interaction ideas, without copying code, values, or distinctive structures.

2. **BLOCKER — The phase gates are internally impossible in the stated order**

   - **Challenges:** Phases 0–3, 7–8, and the execution protocol.
   - **Evidence:** Phase 2 enables bans on raw opacity, z-index, durations, typography, and incomplete transitions at [plan:66](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:66), while Phase 3 only removes those violations at [plan:73](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:73). Yet every phase must end green at [plan:203](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:203). Current source still contains well over 100 affected class sites.
   - VRT baselines are created in Phase 1 at [plan:60](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:60), after Phase 0 globally rewrites typography, control sizes, radius, opacity, and motion. The current suite skips without baselines at [components.spec.ts:20](/Users/kmanojkumar/code/org-design/apps/docs/vrt/components.spec.ts:20), while visual PRs fail closed at [vrt.yml:89](/Users/kmanojkumar/code/org-design/.github/workflows/vrt.yml:89).
   - Phase 7 promises AppShell transitions before AppShell exists: [plan:138](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:138) versus [plan:144](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:144).
   - **Recommendation:** Add Phase −1 for frozen baselines and release-pipeline proof. Pair each migration with its lint rule atomically. Move shell motion into the shell phase.

3. **BLOCKER — Registry versioning is not synchronized with Changesets**

   - **Challenges:** Phase 12 and the release strategy.
   - **Evidence:** Registry metadata hardcodes `0.1.0`, e.g. [registry.json:28](/Users/kmanojkumar/code/org-design/packages/ui/registry.json:28). The header script reads the UI package version at [registry-header.mjs:45](/Users/kmanojkumar/code/org-design/tooling/registry-header.mjs:45), but does not update item `meta.version`. Verification checks header version at [verify-headers.mjs:37](/Users/kmanojkumar/code/org-design/tooling/verify-headers.mjs:37), not metadata equality. The release workflow runs `registry:build` before Changesets versions packages at [release.yml:66](/Users/kmanojkumar/code/org-design/.github/workflows/release.yml:66).
   - **Impact:** Merging a Changesets version PR can make `registry:build` dirty and fail release; if bypassed, headers and registry metadata can advertise different versions.
   - **Recommendation:** Create one versioning command that runs Changesets, synchronizes all item metadata, rebuilds generated surfaces, and verifies package version = item version = provenance version. Prove it with a disposable version-bump test.

4. **MAJOR — Base UI is sufficient for a command picker, but not a drop-in replacement for this Command API**

   - **Challenges:** D7 and Phase 2.
   - **Evidence:** Current Command publicly exposes `useCommandState`, `keywords`, `forceMount`, scored filtering, `shouldFilter`, `loop`, and cmdk’s state attributes at [command.tsx:21](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/command.tsx:21), [command.tsx:34](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/command.tsx:34), and [command.tsx:88](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/command.tsx:88). Installed Base UI Autocomplete instead uses an items/data model, `onClick`, `data-highlighted`, different filtering, and defaults `autoHighlight` to false at [AutocompleteRoot.d.ts:33](/Users/kmanojkumar/code/org-design/packages/ui/node_modules/@base-ui/react/autocomplete/root/AutocompleteRoot.d.ts:33).
   - Existing tests cover keywords and force-mount, but keyboard coverage is essentially Enter plus default-state axe; see [command.test.tsx:94](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/command.test.tsx:94) and [command.test.tsx:169](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/command.test.tsx:169).
   - Official [Base UI Autocomplete documentation](https://base-ui.com/react/components/autocomplete) supports command-palette use, but shadcn’s Base UI direction does not require migrating a working cmdk implementation.
   - **Recommendation:** First choose between a compatibility adapter and a breaking data-driven API. Add characterization tests for ranking, arrows, Home/End, loop, disabled skipping, Escape/focus return, IME, dialog state, async loading, and controlled filtering. Keep cmdk until parity is demonstrated.

5. **MAJOR — Command, Combobox, and selector sequencing causes duplicate architecture work**

   - **Challenges:** Phases 2, 4, and 5.
   - **Evidence:** Command is rebuilt using Autocomplete/Combobox in Phase 2 at [plan:65](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:65). StateSelect is renamed/split in Phase 4 at [plan:91](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:91). Only afterward is the canonical Combobox created and both selectors rewritten in Phase 5 at [plan:98](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:98).
   - “Zero Radix in the lockfile” is also impossible: Fumadocs retains Radix dependencies at [pnpm-lock.yaml:9451](/Users/kmanojkumar/code/org-design/pnpm-lock.yaml:9451) and [pnpm-lock.yaml:9495](/Users/kmanojkumar/code/org-design/pnpm-lock.yaml:9495).
   - **Recommendation:** Build and stabilize Combobox first, then derive Command and refactor/rename selectors once. Scope the purity criterion to VegaStack registry dependencies, not the workspace lockfile.

6. **MAJOR — The global type-scale remap has an uncontrolled Fumadocs blast radius**

   - **Challenges:** D2 and Phase 0 typography.
   - **Evidence:** Vega tokens are imported after Fumadocs at [global.css:1](/Users/kmanojkumar/code/org-design/apps/docs/app/global.css:1), so redefining standard `text-*` variables changes Fumadocs chrome too. Fumadocs prose still fixes body copy at `1rem` at [style.css:491](/Users/kmanojkumar/code/org-design/apps/docs/node_modules/fumadocs-ui/dist/style.css:491), while headings partly consume `--text-3xl` and retain weights up to 900 at [style.css:632](/Users/kmanojkumar/code/org-design/apps/docs/node_modules/fumadocs-ui/dist/style.css:632). The docs currently assert `text-base` means 16px at [foundations.tsx:81](/Users/kmanojkumar/code/org-design/apps/docs/components/foundations.tsx:81).
   - **Impact:** The remap shrinks dependency chrome and some headings, leaves prose body at 16px, and does not actually produce a consistent “body = 14px” showcase.
   - **Recommendation:** Do not globally redefine standard Tailwind sizes without a compatibility boundary. Either introduce Vega role utilities or scope the remap to product components, then explicitly style Fumadocs prose/chrome. Capture baselines first.

7. **MAJOR — The opacity migration conflates three different concepts**

   - **Challenges:** Phase 0 §2 and Phase 3 §1; [audit 01](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/01-token-purity.md:41).
   - **Evidence:** Current source uses at least twelve channel-alpha values plus separate whole-element opacity values. For example, Input uses channel alpha for focus/error borders and background tint, but whole-element opacity for disabled state at [input.tsx:38](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/input.tsx:38). Toggle uses 10/15% interaction fills at [toggle.tsx:15](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/toggle.tsx:15), while ProgressIndicator uses element opacity 25 at [progress-indicator.tsx:158](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/progress-indicator.tsx:158).
   - **Impact:** Replacing `border-x/70` with element opacity changes children and every painted property; compressing twelve alpha values into four generic tokens is not visually lossless.
   - **Recommendation:** Define a migration table separating element-state opacity, intentional channel alpha, and precomposed semantic colors. Document every collapsed value and verify composited contrast and VRT before enabling the raw-opacity ban.

8. **MAJOR — A component-type z-index ladder conflicts with portaled nested overlays**

   - **Challenges:** Phase 0 §3 and audit 08.
   - **Evidence:** Dialog and Select both portal to the root and currently share `z-50`: [dialog.tsx:134](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/dialog.tsx:134) and [select.tsx:213](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/select.tsx:213). Giving “dropdown” a lower layer than “modal” can place a Select opened inside a Dialog behind the modal backdrop. Current equal-band ordering relies on portal DOM order. Sonner ignores the proposed scale entirely with `z-index: 999999999` at [styles.css:50](/Users/kmanojkumar/code/org-design/apps/docs/node_modules/sonner/dist/styles.css:50).
   - **Recommendation:** Define a portal-stacking contract, not merely ordered component names. Test Select, Popover, Tooltip, nested Dialog, and toast combinations inside Dialog and Sheet. Explicitly integrate or exempt Sonner.

9. **MAJOR — The chosen phosphor value is not a viable single cross-theme semantic token**

   - **Challenges:** D16, Phase 0 brand tokens, and audit 17.
   - **Evidence:** The proposed value is approximately `oklch(0.86 0.21 148)` at [plan:3](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:3). Existing success roles occupy essentially the same hue: [semantic.tokens.json:32](/Users/kmanojkumar/code/org-design/packages/tokens/tokens/semantic.tokens.json:32) and [semantic.dark.tokens.json:27](/Users/kmanojkumar/code/org-design/packages/tokens/tokens/semantic.dark.tokens.json:27). Chart 7 is also green at [semantic.dark.tokens.json:45](/Users/kmanojkumar/code/org-design/packages/tokens/tokens/semantic.dark.tokens.json:45).
   - Using the project’s own contrast math, the candidate is about 1.40:1 against the light background, 13.31:1 against dark, and 1.63:1 against dark success text. It therefore fails 3:1 when a light-theme dot/glyph conveys meaningful state.
   - **Recommendation:** Keep the hue direction if desired, but create separate light/dark role tokens. Test AI-live and success side by side under color-vision deficiencies. Either separate their hue or require shape, motion, text, and icon differentiation; reassign the green chart role where collisions occur.

10. **MAJOR — The brand phase is not specification-ready**

- **Challenges:** D17–D20 and Phase 11.
- **Evidence:** The plan says phosphor is already chosen at [plan:3](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:3), Phase 0 says it depends on the Phase 11 selection at [plan:50](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:50), and Phase 11 still schedules the selection at [plan:174](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:174). D17 removes Lora for Newsreader, but Phase 11 still specifies Lora at [plan:184](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:184).
- The “warm” neutral bridge has chroma only `0.003` at [primitives.tokens.json:8](/Users/kmanojkumar/code/org-design/packages/tokens/tokens/primitives.tokens.json:8), while audit 16 explicitly says the dark-marketing/light-product split has no validated precedent at [16-brand-landscape.md:104](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/16-brand-landscape.md:104). The home inherits system theme and has no marketing scope: [vegastack-provider.tsx:41](/Users/kmanojkumar/code/org-design/packages/ui/src/provider/vegastack-provider.tsx:41).
- Font tokens alone do not distribute Newsreader or Pixel faces; `@vegastack/tokens` ships only generated assets at [packages/tokens/package.json:15](/Users/kmanojkumar/code/org-design/packages/tokens/package.json:15).
- **Recommendation:** Prototype the actual marketing→product handoff first. Define a scoped marketing surface independent of global `.dark`; select exact font exports and a downstream font-delivery contract; then finalize brand tokens.

11. **MAJOR — Deleting IconButton knowingly removes a working accessibility guarantee**

- **Challenges:** D5 and Phase 4.
- **Evidence:** `IconButtonProps` requires `aria-label` at compile time at [icon-button.tsx:18](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/icon-button.tsx:18). Generic Button does not at [button.tsx:60](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/button.tsx:60). The accessibility audit explicitly praises the type guarantee at [05-a11y-states.md:68](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/05-a11y-states.md:68).
- The merge audit conditions removal on an AST rule and deprecation window at [03-merge-overlap.md:72](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/03-merge-overlap.md:72); neither appears in the plan. Its “three-file sync surface” rationale is also false under the canonical-source workflow at [AGENTS.md:25](/Users/kmanojkumar/code/org-design/AGENTS.md:25).
- **Recommendation:** Retain IconButton for this overhaul. If removal remains desirable, add and test an AST-aware accessible-name rule, provide a codemod, deprecate for one release, and remove only at a deliberate major boundary.

12. **MAJOR — API flattening contradicts the audit and creates churn without capability**

- **Challenges:** Phase 3–4 structure decisions.
- **Evidence:** The plan changes `color` and `intent` to `variant` everywhere at [plan:79](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:79), while the synthesis recommends `intent` for semantic meaning and `variant` for treatment at [00-SYNTHESIS.md:73](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/00-SYNTHESIS.md:73). Badge already needs both axes at [badge.tsx:11](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/badge.tsx:11).
- Card and peers already provide both dotted and flat exports at [card.tsx:183](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/card.tsx:183); deleting dotted access removes working syntax without adding capability. Button `xs` is not undocumented—it is explicitly documented at [button.mdx:31](/Users/kmanojkumar/code/org-design/apps/docs/content/docs/components/button.mdx:31).
- Empty/RegionSelect renames have no alias window, despite downstream updates being manual `shadcn add --diff/--overwrite` at [RELEASING.md:39](/Users/kmanojkumar/code/org-design/docs/RELEASING.md:39).
- **Recommendation:** Keep `variant` and `intent` orthogonal. Retain dual exports. Ship alias registry items and deprecated exports before any removals, with one coordinated breaking release and migration guide.

13. **MAJOR — The Phase 7 implementation model and test model cannot prove motion correctness**

- **Challenges:** Phase 7.
- **Evidence:** The source concepts include forced reflow, timers, per-digit stagger, SVG path measurement, and multistage animation at [10-transitions-dev.md:25](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/10-transitions-dev.md:25) and [10-transitions-dev.md:48](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/10-transitions-dev.md:48). Base UI starting/ending attributes naturally cover overlays and disclosures—not number replay, error shake, icon/text swaps, or checkmark drawing.
- Screenshots explicitly disable animation at [playwright.config.ts:12](/Users/kmanojkumar/code/org-design/apps/docs/playwright.config.ts:12), and both test stacks run Chromium only at [vitest.config.ts:80](/Users/kmanojkumar/code/org-design/packages/ui/vitest.config.ts:80).
- **Recommendation:** Split the mechanism matrix: Base UI lifecycle for overlays, keyed state/presence for swaps, explicit replay APIs for shakes/checks. Add computed-style, replay, interruption, and reduced-motion tests plus small WebKit/Firefox smoke coverage. Defer effects lacking a clear owning state.

14. **MAJOR — The advertised four-component expansion masks a much larger product program**

- **Challenges:** D6 and Phases 5–11.
- **Evidence:** Beyond the four D6 components, Phase 7 adds AnimatedNumber, TextShimmer, and success feedback at [plan:131](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:131); Phase 8 adds AppShell, a hook, sidebar persistence, and a dashboard block at [plan:144](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:144); Phase 11 adds seven marketing primitives, ParticleField, and a Button variant at [plan:175](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:175). The editable playground alone was classified as multi-week work in [audit 13](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/13-docs-infra.md:110).
- AppShell also assumes router focus and cookie persistence responsibilities that audit 11 assigns downstream at [11-app-shell.md:145](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/11-app-shell.md:145).
- **Recommendation:** Registry MVP should contain: frozen VRT/release baseline, P0 fixes, compatible token migrations, essential consistency/a11y work, high-impact responsive fixes, integrity/consume verification, and authoring gates. Defer Command unless purity is launch-critical; defer IconButton deletion, renames, new components, motion pack, AppShell/dashboard, playground, and the marketing layer.

15. **MAJOR — Several final acceptance criteria are either unrunnable or unproven**

- **Challenges:** Phases 9 and 12.
- **Evidence:** The final command at [plan:194](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:194) says `pnpm lint && typecheck && test && test:vrt`; root has no `test:vrt` script at [package.json:7](/Users/kmanojkumar/code/org-design/package.json:7), and the middle commands omit `pnpm`.
- The docs export is genuinely about 554MB today, but the audit calls the proposed RSC deduplication a hypothesis requiring investigation at [13-docs-infra.md:175](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/13-docs-infra.md:175). The plan nevertheless preselects the mechanism and an unexplained `<100MB` target at [plan:154](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:154).
- A locally scoped per-preview theme toggle would not theme portaled Dialog/Popover/Tooltip content, which leaves the wrapper at [popover.tsx:146](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/popover.tsx:146).
- **Recommendation:** Record exact runnable commands and expected test counts. Make docs bloat a profiling spike with raw/compressed/network budgets before choosing a fix. Use iframe or portal-container isolation for per-preview theming, or defer it.

16. **MAJOR — The audit corpus is not a stable source of truth in its current form**

- **Challenges:** Audit correctness and plan governance.
- **Evidence:** The requested artifact is “v4,” but its heading says v3 at [plan:1](/Users/kmanojkumar/code/org-design/docs/plans/2026-07-system-audit-remediation.md:1), while audit 17 says decisions were folded into v4 at [17-brand-direction.md:48](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/17-brand-direction.md:48).
- Some findings remain real: Field still drops horizontal descriptions at [field.tsx:256](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/field.tsx:256); Select still omits scale from its transition property at [select.tsx:226](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/select.tsx:226); Popover still suppresses outline at [popover.tsx:160](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/popover.tsx:160).
- Others are stale or exaggerated: Marker and BubbleContent now forward refs at [marker.tsx:77](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/marker.tsx:77) and [bubble.tsx:142](/Users/kmanojkumar/code/org-design/packages/ui/registry/ui/bubble.tsx:142); VRT is no longer a silent CI no-op; `xs` is documented; Geist Pixel is five separate installed exports rather than the single-axis API described by [audit 15:20](/Users/kmanojkumar/code/org-design/docs/audits/2026-07-14-system-audit/15-geist-typography.md:20). The installed package documents them at [geist README:23](/Users/kmanojkumar/code/org-design/apps/docs/node_modules/geist/README.md:23).
- The urgency of converting 24 `forwardRef` components is also overstated: React 19 supports ref-as-prop, but React describes `forwardRef` removal as a future change in its [official documentation](https://react.dev/reference/react/forwardRef).
- **Recommendation:** Freeze a clean commit and publish a new finding register with each item marked open, fixed, stale, accepted, or deferred. Recompute counts mechanically from that commit before resuming execution.

## Verdict

**No—the plan is not sound to execute as-is.** Its broad direction is defensible: token discipline, P0 accessibility fixes, Base UI alignment, responsive hardening, stronger verification, and better authoring gates are sound goals. The current document, however, has legal, sequencing, release, compatibility, and scope blockers.

### Top 5 changes before execution

1. **Freeze a corrected revision and Phase −1:** pin the commit/runtime, bootstrap current VRT baselines, and prove the Changesets/registry-version workflow.
2. **Rewrite the phase DAG:** P0 fixes first; migrate each token/rule atomically; isolate dependency upgrades; build Combobox before Command/selectors.
3. **Redesign token rollout:** scope typography, separate opacity roles, define portal stacking, and provide theme-specific brand tokens plus font delivery.
4. **Create a compatibility and semver plan:** characterize Command, retain IconButton, preserve aliases/compound exports, and stage breaking changes separately.
5. **Cut the registry MVP:** defer the motion pack, AppShell/dashboard, most new components, playground, and marketing layer until the core registry ships cleanly.

Codex session ID: 019f65b0-824d-74e1-9d5e-6ada7a2d8250
Resume in Codex: codex resume 019f65b0-824d-74e1-9d5e-6ada7a2d8250
