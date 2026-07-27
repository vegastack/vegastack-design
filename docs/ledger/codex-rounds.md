# CODEX ROUNDS LEDGER

Every Codex adversarial-review round: findings + resolutions + verdict. Append-only.

---

## Round 1 — 2026-06-21 14:37 IST — verdict: needs-attention (3 high · 3 medium)

Codex adversarial-review (branch diff vs main, session 019ee968-fcbf-7f01-8634-3207cae01a8e). All findings verified against source — all real. Resolutions:

- **[HIGH] CI wired to root-level commands that fail (.github/workflows/ci.yml:17-20).** `pnpm exec tsc/vitest/playwright` fail from repo root (TS2307 alias errors; no root vitest/playwright binaries) → PR CI never reaches the real gates. **Fix:** use the workspace gates `pnpm typecheck` + `pnpm test` (turbo, package-scoped); make the VRT step honest (package-scoped, gated on baselines).
- **[HIGH] Deploy can't publish the signed registry (.github/workflows/deploy.yml:19-28).** Static export runs BEFORE registry:build + cosign, so `out/r` never contains the signed `integrity-manifest.sigstore`; no committed `wrangler.jsonc`. **Fix:** reorder registry:build → sign → export so `out/r` carries the signature; assert it exists pre-deploy; add `apps/docs/wrangler.jsonc` (assets.directory=./out) + pinned `wrangler` devDep.
- **[HIGH] Registry verifier OIDC identity too broad (tooling/verify-item.mjs:30).** `--certificate-identity-regexp '^https://github.com/VegaStack/vegastack-design/'` pins only the repo prefix → any workflow/ref in the repo could sign an accepted manifest. **Fix:** pin the exact signer `--certificate-identity https://github.com/VegaStack/vegastack-design/.github/workflows/deploy.yml@refs/heads/main` + `--certificate-github-workflow-repository`.
- **[MEDIUM] Forwarded-ref contract unmet (button.tsx + all useRender roots & plain-function WithoutRef components).** §7.6 (G6) mandates forwarded ref; Button (ComponentPropsWithoutRef, plain fn, no ref→useRender) and ~25 others don't forward. **Fix (systemic):** useRender roots pass the new `ref` param (ComponentPropsWithRef + destructured ref); plain host-root functions adopt forwardRef / ref-as-prop; add ref-attachment tests. (Base-UI ComponentProps wrappers already forward ref via React-19 prop spread — verified.)
- **[MEDIUM] Icon contract not enforced (design-lint).** Components import lucide directly (sanctioned source) but design-lint never enforced sanctioned-source-only, so a rogue icon lib / inline-svg icon could slip in silently. **Fix:** add G18 enforcement to design-lint (ban non-sanctioned icon-library imports + inline `<svg>` icons, allowlisting the one legitimate graphic primitive, progress-indicator's ring). Audited current code: 0 violations (only lucide-react + our wrappers; no rogue libs; the 3 `<svg>` hits were JSDoc comments except progress-indicator's ring). Direct lucide for internal affordances kept (idiomatic Base UI/shadcn; Icon/BrandIcon are the consumer-facing wrappers) — documented.
- **[MEDIUM] No real color-contrast coverage (VRT skipped + unit tests disable color-contrast).** Verified: the vitest browser run compiles no Tailwind CSS, so the 3 `color-contrast` disables avoid FALSE positives (justified) — but contrast then has no gate while VRT is Docker-deferred. **Fix:** compile real Tailwind+tokens CSS into the vitest browser a11y run so contrast is verified locally (Docker-free), then remove the 3 disables.

## Round 2 — 2026-06-21 15:53 IST — verdict: needs-attention (3 high · 3 medium)

Codex adversarial-review (branch diff vs main, session 019ee9af-29c7-78a2-b8bf-c72d2a01ebdd). Round-1 findings all confirmed FIXED (none re-raised). New, deeper findings:

- **[HIGH] Status color tokens fail WCAG AA (semantic.dark/.tokens.json).** Computed: dark success 3.61:1, dark warning 3.06:1, light warning 1.80:1 (need 4.5:1 normal text). Used as fg/bg contracts (badge bg-success/text-success-foreground …). Unit axe excludes contrast (no compiled CSS) so it ships ungated. → VERIFY + root-fix the failing token pairs to meet AA + add a compiled-CSS contrast gate.
- **[HIGH] DataList materially simplified vs platform port.** Ships columns/data/selection/sort/loading/empty; platform has search/paging/row-click/drag-reorder/filter-bar/kanban/grouping/persistence/kbd-nav. Matrix marks it complete → false. → expand presentational features + honestly scope/deny app-coupled ones (or rename), update matrix.
- **[HIGH] TextEdit drops the rich-editor contract.** Ships value/onValueChange/placeholder/editable; platform has markdown I/O, upload, submit, min/max height, emoji, mentions, task lists, code-block lang, prerender. → port presentational caps + document app-coupled deferrals.
- **[MEDIUM] Docs app lint is a no-op (echo).** apps/docs `lint` only echoes; CI `pnpm lint` claims eslint+design-lint coverage → docs previews/pages/copy-in unlinted. → wire real ESLint for docs.
- **[MEDIUM] Consume preflight not usable downstream.** consume skill says run repo-local `tooling/verify-item.mjs`, not delivered to consumers; no documented hash-only mode. → deliver a consumer-facing verifier + honest docs.
- **[MEDIUM] Dark token build shape-asymmetric.** build only checks dark⊆light, not light⊆dark; dark omits radius/font/duration/motion that light has, but the TS token type is the light keyset → `tokens.dark.radius` undefined at runtime. → symmetric schema or color-only dark + a build assertion.

### Round 2 resolutions (all 6 addressed)

- **HIGH-1 (AA tokens):** FIXED — light warning → amber.750 + white fg; dark success/warning fg → neutral.950; dark muted-fg → neutral.450; all 28 canonical pairs ≥4.5:1; new fail-closed `contrast-check.mjs` gate in token build + `pnpm lint` + CI.
- **HIGH-2 (DataList) / HIGH-3 (TextEdit):** RESCOPED HONESTLY — explicit Scope sections (JSDoc + docs MDX) + matrix note; presentational cores per G7, full parity flagged for MK (operator-review).
- **MED-1 (docs lint no-op):** FIXED — real ESLint wired for apps/docs (51 issues → 0); source eslint cleanups propagated; page-header over-declared button rdep dropped.
- **MED-2 (consume verifier not delivered):** FIXED — `--hash-only` mode + deliverable public bin `@vegastack/utils → vegastack-verify-registry-item` (hash parity-tested vs registry-hash.mjs); consume skill rewritten with the real npx command.
- **MED-3 (dark token shape):** FIXED — symmetric dark model ({...light, ...darkColorOverrides}) + bidirectional fail-closed assertion; tokens.dark.radius no longer undefined.

## Round 3 — 2026-06-21 16:47 IST — verdict: needs-attention (5 high · 1 medium)

Codex adversarial-review (branch diff vs main, session 019ee9df-3453-7293-abd8-15d3494c487c). Round-2 fixes confirmed; deeper/re-raised findings:

- **[HIGH] CI changeset gate fails (ci.yml:26).** `changeset status --since=origin/main` exits 1 — changed public packages (tokens/utils) have no changesets. → add changesets.
- **[HIGH] VRT skipped (vrt/components.spec.ts).** describe.skip + deferred → "render checks unverifiable by automation." → add an active compiled-CSS a11y compensating gate (VRT visual-diff stays Docker-deferred).
- **[HIGH] Axe suppresses color-contrast + delegates to skipped VRT (text-edit.test.tsx:118 et al).** the "zero-violation" claim is hollow while contrast is suppressed + VRT skipped. → compile real CSS into the browser a11y run, remove suppressions, prove contrast.
- **[HIGH] Verifier has no post-write hash (verify-registry-item.mjs).** TOCTOU — checks the item before `shadcn add` but not the copied files after (shadcn re-fetches). → add a fail-closed post-write verify mode + wire it into the skill.
- **[HIGH] DataList/TextEdit scoped-down but matrix marks full completion.** honest note isn't enough — Codex wants features OR a real status downgrade + migration tests. → add feasible presentational features + qualify the matrix status (full-port stays an MK decision).
- **[MEDIUM] §7.6 render/asChild not systemic (checkbox.tsx:37).** Base UI wrappers omit `render`; matrix marks §7.6 green for all. → expose `render` on Base UI roots + document exemptions + add a contract check.

### Round 3 resolutions (all 6 addressed)

- **HIGH-1 (changeset gate):** FIXED — changesets for all 5 publishable packages; `changeset status --since=origin/main` exit 0.
- **HIGH-2/HIGH-3 (hollow a11y):** FIXED — new compiled-CSS contrast gate (test/contrast.browser.test.tsx + @tailwindcss/vite) runs axe color-contrast on REAL rendered colors in both themes; surfaced + fixed 7 dark/soft AA failures (dark success/info/destructive brightened + dark solid foregrounds; light success darkened; alert opacity-90 removed). Unit suppressions kept (no-CSS false-positive avoidance) but re-pointed to this active gate.
- **HIGH-4 (TOCTOU):** FIXED — `--post-write` copied-file verification (alias-aware, fail-closed, tamper-proven) + `--save`; skill documents the 3-step flow.
- **HIGH-5 (DataList/TextEdit scope):** RESCOPED + AFFORDANCES — added G7-aligned presentational composition (DataList onRowClick/toolbar/footer; TextEdit onSubmit/minHeight/maxHeight) + genuine matrix downgrade (◐ core) + migration docs. Full-parity port is a flagged MK product decision (operator-review IMPASSE note).
- **MED-1 (render contract):** FIXED — exposed Base UI `render` on checkbox/switch/radio-group/slider/progress (split-button exempt: multi-root); new design-lint `[render-contract]` rule prevents regression; matrix documents the contract + exemptions.

## Round 4 — 2026-06-21 17:25 IST — verdict: needs-attention (1 high · 2 medium)

Codex adversarial-review (session 019eea02-46bd-7022-8f71-92456bc236af). Sharp convergence (R3 was 5h+1m). Rounds 1-3 fixes all confirmed. Findings:

- **[HIGH] DataList/TextEdit ◐ "exception rows" in the completion ledger (matrix:69-73).** Codex rejects exception rows in a completion gate: either full-port OR FORMALLY re-scope in requirements/inventory as reduced components (not "completed parity ports"). → formally define the presentational-core scope in requirements §12 + remove the ◐ exception framing so completion is honest for the defined scope (aligns with locked G7).
- **[MEDIUM] Base UI portal root not wired (docs layout + VegaStackProvider + consume skill).** Overlays portal via Base UI; without an isolated/relative root they can stack under chrome / mis-position on mobile Safari. → verify Base UI's actual requirement, then bake the root contract into the provider + docs layout + consume skill + add overlay-stacking browser tests.
- **[MEDIUM] skills use `shadcn@latest` despite pinned 4.7.0 (consume skill).** non-reproducible consume path. → pin `shadcn@4.7.0` in skills/docs + add a lint guard rejecting `@latest` for locked tooling.

### Round 4 resolutions (all 3 addressed)

- **HIGH-1 (DataList/TextEdit "exception rows"):** FORMALLY RE-SCOPED (Codex's path b) — requirements §12 now defines `data-list` (presentational data table) + `text-edit` (base editor) as first-class inventory items at their core/base-v1 scope, with full-parity `data-grid` / `text-edit-collab` as SEPARATE deferred inventory items. Matrix reverted ◐→✅ (complete for the defined scope), legend ◐ removed, no exception rows. The §12 definition is the source of truth, so "64/64 complete" is honest completion of the scoped inventory.
- **MEDIUM (Base UI portal root):** FIXED — `isolation: isolate` baked into the contract: `@vegastack/tokens/base.css` sets `body { isolation: isolate }`, the docs `<body className="isolate">`, and the consume skill documents the portal-root requirement. New `test/overlay-portal.browser.test.tsx` proves Dialog/Popover/Sheet portal OUT of an isolated app root + carry z-50.
- **MEDIUM (shadcn@latest):** FIXED — pinned `shadcn@4.7.0` across all skills + docs (66 files); new `tooling/content-lint.mjs` (wired into docs lint) rejects floating tags (`@latest`/`next`/…) for locked tooling in skills + consumer docs.

### Additional thoroughness sweep (proactive, this session)

- Wired REAL ESLint for `@vegastack/utils`/`icons`/`tailwind-preset` (were echo no-ops) — closes the "no-op lint" pattern across every package.
- Corrected a stale round-2 operator-review entry that contradicted the (later-implemented) compiled-CSS contrast gate.
- Re-verified: 0 TODO/FIXME in source (only intentional TODO(VRT) defer); registry deps 0 over/under-declared; the cmdk aria-required-children suppressions are compensated by positive keyboard-nav tests; the lone eslint-disable is a justified active-rule suppression.

## Round 5 — 2026-06-21 17:48 IST — verdict: needs-attention (5 high · 2 medium)

Codex adversarial-review (session 019eea16-b2a0-7a02-b1ad-b744ed93f86c). New areas (distribution/showcase/inventory). Findings:

- **[HIGH] preset.css lacks @source for @vegastack/ui + icons** — published consumers miss provider/icon classes (docs compensates with manual @source). → add package @source to the preset / consumer contract.
- **[HIGH] consume skill imports @vegastack/ui without installing it** — clean-app module resolution failure. → add @vegastack/ui to the install list.
- **[HIGH] Toast showcase doesn't dogfood the copied-in registry Toaster** (docs provider mounts the package Toaster). → mount the copy-in registry Toaster.
- **[HIGH] axe suppressions weaken the gate** (cmdk aria-required-children + color-contrast). → fix cmdk ARIA where possible + expand the compiled-CSS contrast gate to cover every suppressing component.
- **[HIGH] VRT entirely skipped (day-one requirement)** — OPERATING-MODE CONFLICT: VRT needs the pinned Docker container for font/render determinism; local mac baselines would fail CI. Cannot be a passing blocking local gate without Docker.
- **[MEDIUM] matrix overclaims complete platform inventory** (StatusPage, AccountStatusAlert, VegaTextareaInline, VegaTextEditInline absent). → add explicit, rationale'd exclusions or build.
- **[MEDIUM] ColorPicker default swatches use raw palette vars (--color-gray-500) + inline style** — bypasses semantic-token-only. → formalize the narrow palette-data exception (a color picker's swatches ARE pickable colors, not chrome).

### Round 5 resolutions (all 7 addressed)

- **HIGH (preset @source):** FIXED — preset.css now `@source "../ui/dist"` + `"../icons/dist"` (relative; Tailwind 4.3.1 doesn't resolve bare package refs) with @vegastack/ui+icons as optional peerDeps so they co-locate. Proven by `tooling/verify-preset-source.mjs` (compiles preset-only, asserts Toaster + BrandIcon classes generate; 4/4) — wired into the preset lint as a permanent gate.
- **HIGH (consume skill missing @vegastack/ui):** FIXED — install list + step-2 @source note added.
- **HIGH (Toast not dogfooding registry):** FIXED — docs provider mounts the copy-in `@/components/ui/sonner` Toaster (single source of truth = registry item).
- **HIGH (axe suppressions):** FIXED — cmdk `aria-required-children` fixed at source (CommandSeparator → `aria-hidden`, suppression REMOVED from all 3 tests + positive assertion added); compiled-CSS contrast gate expanded to sonner/text-edit/color-picker (8 tests, both themes; color-picker excludes only dynamic swatch fills) — no token fixes needed.
- **HIGH (VRT day-one):** FRAMED as a Docker/CI-environment gate (like publish/deploy — mac baselines fail CI on font/render); local render+a11y enforced by the compiled-CSS/portal/render tests; vrt.yml gains a "fail if zero screenshots executed" guard. Baseline generation is an MK CI action.
- **MEDIUM (inventory overclaim):** FIXED — requirements §12 + matrix list explicit, rationale'd platform-`common` exclusions (app-coupled/page-level/DS-replaced/covered/deferred-variant); the inventory is the ~50 DS primitives, not a 1:1 file port.
- **MEDIUM (ColorPicker raw palette):** FIXED — formalized the narrow palette-DATA exception in requirements §7.5 (swatches are pickable-color data, not chrome; only the swatch fill + default palette; covered by the contrast gate which excludes dynamic swatches).

## Round 6 — 2026-06-21 18:23 IST — verdict: needs-attention (2 high · 1 medium)

Codex adversarial-review (session 019eea34-efc2-7223-ac00-61404b01f298). Converging (R5 5h+2m → R6 2h+1m); all concrete + fixable (no operating-mode conflicts). Findings:

- **[HIGH] Post-write verifier rejects valid MULTILINE alias rewrites** (verify-registry-item.mjs) — only single-line imports handled; a multiline `import {\n…\n} from '@/components/ui/command'` whose closing-line specifier shadcn rewrites is flagged as a non-import mutation → fails copy-in for non-`@/` aliases. → parse full import declarations (multiline) + test every alias root.
- **[HIGH] Copied components lack the required version/hash header** (all 64) — requirements §157.3 + G23 mandate `// @vegastack <name>@<version> <sha>` for drift detection; source + copy-in start at `'use client'`. → stamp the header (sha = meta.integrity, hash strips the header to avoid circularity) into source/copy-in/registry-JSON + an audit check.
- **[MEDIUM] design-lint permits arbitrary values + inline styles** (var()/calc() arbitraries + dynamic inline styles) — Dialog calc/duration arbitraries, ColorPicker/TextEdit inline sizing — the token-only claim is broader than enforced. → tighten to an EXPLICIT documented exception set + reduce avoidable arbitraries (duration utilities).

### Round 6 resolutions (all 3 addressed)

- **HIGH (verifier multiline imports):** FIXED — added `IMPORT_CLOSE_RE` (`} from '<spec>'`) so a multiline import's closing-line specifier rewrite is recognized as a sanctioned alias rewrite; new packages/utils/test/compare.test.mjs (7 tests: single-line + multiline rewrites pass for every alias root, tamper/non-alias/line-count/smuggled-binding fail), wired into `pnpm test`.
- **HIGH (provenance header):** FIXED — `// @vegastack <name>@<version> sha256-<integrity>` stamped on all 64 source + copy-in + registry-JSON (registry-header.mjs); registry-hash strips it (meta.integrity unchanged, idempotent — 2nd build = 0 diff); verify-headers.mjs audit gate (fail-closed) wired into registry:build; the utils bin mirrors the strip; parity intact. requirements §313 + consume/design-audit skills corrected.
- **MEDIUM (design-lint permissiveness):** FIXED — added `duration-fast/-base/-slow` token utilities (@theme inline `--transition-duration-*` bridge) and replaced all 26 `duration-[var(--duration-*)]` arbitraries across 16 components; tightened design-lint (calc() allowed only with var()/viewport units, not hardcoded px) + documented the COMPLETE explicit exception set (token/runtime-var arbitraries, token/viewport calc, layout primitives, CSS-wide keywords, dynamic inline styles) in the lint header + requirements §7.5. Remaining arbitraries are all Base UI runtime CSS vars / viewport calc (legitimate).

## Round 7 — 2026-06-21 18:53 IST — verdict: needs-attention (2 high · 1 medium)

Codex adversarial-review (session 019eea53-b94d-7791-a9b8-929436fb2b7a). Deep platform-parity probing. Findings:

- **[HIGH] VRT disabled / not PR-blocking** (vrt.yml + spec describe.skip) — 4th re-raise. OPERATING-MODE CONFLICT: needs the pinned Docker container for deterministic baselines (mac baselines fail CI); the same build-LOCAL-stop boundary as publish/deploy. Local render+a11y already covered by the compiled-CSS contrast/portal/render tests + the zero-screenshot guard. Cannot be a passing blocking LOCAL gate without Docker — an MK CI action.
- **[HIGH] Country/State selects dropped platform geography** — ours 103 countries (verified) vs platform features/billing/countries.ts 198; StateSelect compact vs platform's full datasets. REAL billing/address regression. → port the full datasets + count/missing-code tests.
- **[MEDIUM] TruncatedText omits IconText + TableCellText named exports** (platform exports all three). → port the two variants (exports + tests + axe + docs) or formally exclude.

### Round 7 — fixes applied

- **[HIGH geography] FIXED at root.** `country-select.tsx` COUNTRIES 103 → **198** (full ISO 3166-1 alpha-2 set ported from platform `features/billing/countries.ts`; flags derived via the regional-indicator transform; modern names kept — Czechia/Türkiye). `state-select.tsx` STATES_BY_COUNTRY 9 → **45** datasets / **1187** subdivisions (ported from platform `features/billing/states.ts`). Tests now assert exact counts (198 / 45 / 1187) + previously-missing lookups (RU/YE/UZ/MC/VA/VE; Moscow/İstanbul/Lagos/Tokyo). 26/26 green; a11y unaffected by the larger lists.
- **[MED TruncatedText] FIXED at root.** Ported the platform's two named exports — `IconText` (icon + truncating label + trailing slot, tooltip on the row) and `TableCellText` (width + mono, reuses TruncatedText) — refined to our Tooltip + semantic tokens + ref-forwarding; extracted a shared `useOverflow` hook. +6 tests (13 total), docs (examples + AutoTypeTable for both new prop interfaces). design-lint clean.
- **[HIGH VRT] STRUCTURAL fix; baseline generation remains Docker/MK-gated.** Removed the permanent `describe.skip`: the spec now AUTO-ENABLES via `hasBaselines` (checks the snapshot dir) the moment baselines are committed — no flag to flip. `vrt.yml` is now `on: pull_request`, gated on baseline presence: a BLOCKING pixel gate once baselines exist, a visible no-op `::notice` (not a red fail) until then; zero-screenshot guard retained. Deterministic PNG baselines still require the pinned `mcr.microsoft.com/playwright` Linux container (no Docker daemon available locally — verified), so the one-time `update_baselines` bootstrap + commit is an MK CI action, after which VRT is a fully-autonomous per-PR gate. Local render+a11y stays covered by the compiled-CSS contrast/portal/render Vitest-browser gates in ci.yml.

## Round 8 — 2026-06-21 19:30 IST — verdict: needs-attention (1 critical · 2 high · 2 medium)

First run stalled (hung ~19m on a `sed` command, zero log progress) → cancelled + relaunched fresh (session 019eea79). Findings + resolutions:

- **[CRITICAL] Verifier accepts malicious alias retargeting — FIXED at root.** `verify-registry-item.mjs` treated ANY alias→alias change as a sanctioned rewrite, so `@/components/ui/button` → `@/components/ui/evil` passed the TOCTOU verifier (supply-chain bypass). Added `aliasCanonical()` (strips only the root SYMBOL `@/`↔`#`↔`~/`) + `isSanctionedAliasRewrite()` (requires identical category+path); a repoint to a different target now fails. +5 negative tests (same-root, cross-root, cross-category, multiline) → 12/12.
- **[HIGH] Button drops platform API — RESOLVED as documented refinement.** `isLoading`/`loadingText`/`icon`/`kbd`/`dropdownActions` are deliberate Model-A refinements: `loading` + children-composition (spinner renders ALONGSIDE children, so `loadingText` is the caller's label) + the dedicated `SplitButton`. No silent loss — added an explicit prop-mapping table + examples to `button.mdx` and a recorded "API refinements vs. the platform" decision in requirements §12. (No API bloat — that would be an un-mandated architecture change.)
- **[HIGH] VRT no-op — RELEASE now fail-closed.** PR-level vrt.yml already self-activates on baseline presence; added a `vrt-gate` job to `deploy.yml` (pinned container) that FAILS CLOSED if no baselines are committed and runs the pixel diff as a blocking check — `deploy needs: vrt-gate`. You cannot ship without committed, passing VRT baselines. Baseline GENERATION remains the one-time Docker-pinned `update_baselines` bootstrap (MK CI action; no Docker locally).
- **[MEDIUM] Docs don't dogfood @vegastack/ui — FIXED.** `apps/docs/components/provider.tsx` now wraps the tree in `VegaStackProvider` imported from `@vegastack/ui` (RootProvider `theme.enabled=false` + `VegaStackProvider toaster={false}` → single ThemeProvider/Direction/Tooltip owner; copy-in Toaster still the single mounted Toaster for the Toast showcase). Reconciled the package `toaster.tsx` to mirror the canonical registry `sonner.tsx` (status icons + per-state classNames). New `tooling/verify-provider-dogfood.mjs` guard (in docs lint) fails if the showcase stops importing the package.
- **[MEDIUM] Lint permits literals + focus suppression — FIXED.** Tokenized the 8 `calc(100dvh-2rem)`/`calc(100vw-2rem)` insets → `calc(…-var(--spacing)*8)` and tightened the calc() exception to REQUIRE a `var(--token)` (viewport-unit-alone no longer slips a literal through). Added a file-scoped `outline-none` focus-contract rule: a file stripping the native outline must provide a focus affordance (`focus-visible:`/`focus-within:` or `data-[highlighted]/[selected]/[focused]`); verified 0 violations (every control already complies) and that it fires on bad input.

## Round 9 — 2026-06-21 19:56 IST — verdict: needs-attention (0 critical · 3 high · 0 medium)

CRITICAL from R8 CLEARED (verifier fix accepted). Session 019eea8e. Findings + resolutions:

- **[HIGH] Non-hermetic docs build (undeclared zod) — FIXED.** `apps/docs/source.config.ts` imports `zod` but `@vegastack/docs` didn't declare it → resolved to an OUT-OF-REPO `zod@3.24.2` (clean CI would break; fumadocs needs zod 4). Added `zod: ^4.4.3` to apps/docs deps + `pnpm install`; now resolves in-repo to `zod@4.4.3`. typecheck + docs build green on zod 4.
- **[HIGH] Password reveal not keyboard reachable — FIXED at root.** The toggle `<button>` had `tabIndex={-1}` (WCAG 2.1.1 violation — keyboard users couldn't reach it). Removed it (the focus-visible ring already existed). Added a `userEvent.tab()` + `{Enter}`/Space keyboard test asserting the toggle is in the tab order, focuses, and activates both ways (+1 test → 596).
- **[HIGH] VRT "passes without running" — FIXED + PROVEN.** (1) Fixed a bootstrap chicken-and-egg bug I'd introduced: the self-activating `describeVRT` skipped when no baselines existed, so `update_baselines` could never write the FIRST baselines — now also enabled by `VRT_UPDATE=1` bootstrap mode (wired into vrt.yml's update step). (2) PR VRT is now **fail-closed when the PR changes visual surface but has no baselines** (was a notice). (3) **Proved the suite works end-to-end locally** (mac chromium): bootstrap rendered all 68 showcase pages + wrote baselines (68 passed), validation re-ran green (68 passed) — then deleted the mac PNGs (uncommittable; CI needs the pinned Linux container). The sole remaining VRT action is the Docker-pinned baseline commit (MK CI action; no Docker daemon locally — verified). Matrix VRT note updated to reflect proven-functional status.

## Round 10 — 2026-06-21 20:14 IST — verdict: needs-attention (0 critical · 3 high · 1 medium)

Session 019eeaa3. Findings + resolutions:

- **[HIGH] DataList keyboard selection also triggers row activation — FIXED at root.** Clickable rows wired onClick+onKeyDown on the whole `<TableRow>`; the checkbox cell stopped only MOUSE propagation, so Space/Enter on the checkbox (or any nested button/link) also fired `onRowClick`. Added `isFromInteractiveDescendant()` (`closest('button,a,input,select,textarea,label,[role=button|checkbox|menuitem|link]')`) guarding the mouse path, and `handleRowKeyDown` now only activates when `e.target === e.currentTarget`. +3 tests (checkbox Space/Enter, nested control, row-itself regression) → 22.
- **[HIGH] Registry auth not enforced/verified in code — ADDED deploy-time fail-closed verification.** The CF Access policy CONFIG is an MK Zero-Trust account action (not in-repo IaC), so deploy.yml now PROVES the live policy after deploy: anonymous `GET /` must be SSO-gated (no 200), anonymous `/r/registry.json` must be rejected (401/403), and the valid CF Access service token must be accepted (200) — any drift blocks the deploy. Requires repo var `DOCS_URL` + secrets `CF_ACCESS_CLIENT_ID`/`CF_ACCESS_CLIENT_SECRET` (documented for MK).
- **[MEDIUM] DatePicker presets bypass disabled-date rules — FIXED at root.** Preset buttons called `onValueChange` without honoring `disabledDates`. Now a shared predicate reuses react-day-picker's OWN matcher evaluators (`dateMatchModifiers`/`rangeContainsModifiers`) — the same the calendar uses — to BOTH disable preset buttons whose date/range intersects disabled dates AND guard the handlers (defense in depth). +5 tests (single + range disabled rejection, enabled regressions) → 14.
- **[HIGH] VRT baselines absent (6th raise) — IRREDUCIBLE Docker/MK boundary.** Codex now acknowledges the gate is "wired to fail closed" (R9 fixes accepted); the only remaining step is committing deterministic LINUX baselines, which requires the pinned Playwright container (no Docker daemon locally — verified). Proven-functional locally (68/68 ×2). This is the build-LOCAL-stop boundary (same category as publish/deploy): the one-time `update_baselines` bootstrap + commit is an MK CI action. Gate is maximally correct; nothing more is doable locally.

## Round 11 — 2026-06-21 20:38 IST — verdict: needs-attention (0 critical · 3 high · 1 medium)

Session 019eeab5. Findings + resolutions:

- **[HIGH] DataList `<tr role="button">` is invalid ARIA — FIXED at root.** A real `<tr>` was given `role="button"`+`tabIndex` (overriding the row role, invalidating its `<td>` cells). Removed role/tabIndex/row-keydown; `<tr onClick>` stays a mouse convenience (guarded); keyboard activation now via a real first-cell `<button data-slot="data-list-row-action">` (valid focusable child of a `<td>`). Added `column.interactive?` opt-out to avoid nesting. +axe test for the `onRowClick`+`selectable` state (was unaudited). 25 tests.
- **[HIGH] Copy-in bypasses the shadcn install path — ADDED a scratch-consumer proof.** New `tooling/verify-shadcn-consume.mjs` (`pnpm registry:verify-consume`, wired into ci.yml): serves `apps/docs/public/r` over HTTP and, for button/icon-button/split-button/data-list graphs, proves registry fetch → transitive registryDependencies → integrity preflight (shipped `itemHash`) → `@/`→`~/` alias rewrite + target-path → shipped `--post-write` verify → `tsc` of the consumed output. 4/4 green, ~3.4s, deterministic. Honestly publish-gated: only the final `pnpm add @vegastack/*@^0.1.0` of unpublished pkgs (MK action; workspace-linked locally). ci.yml cleanliness check broadened from `public/r` to the FULL worktree.
- **[MED] RHF/Zod form documented but undeclared/untested — FIXED.** Declared `react-hook-form`+`@hookform/resolvers`+`zod` as `packages/ui` devDeps (consumer-installed PEERS, not registry hard-deps — documented in field.mdx with versions). New `field-form.test.tsx` builds the real `useForm`+`zodResolver(z.object({email:z.email()}))`+`Controller`+`Field` and asserts valid submit + invalid→`FieldError`(`role=alert`)+`aria-invalid`, with the typecheck as the contract proof. 608 tests.
- **[HIGH] VRT baselines absent (7th raise) — IRREDUCIBLE.** Unchanged: Codex acknowledges the gate is fail-closed-wired; only the Linux baseline commit remains (Docker/MK). Proven-functional locally (68/68 ×2).

## Round 12 — 2026-06-21 21:00 IST — verdict: needs-attention (0 critical · 3 high · 2 medium)

Session 019eeadc. Findings + resolutions:

- **[HIGH] Registry targets hard-coded `components/ui/<name>.tsx` instead of shadcn `@ui/` placeholder — FIXED at root.** Verified against shadcn 4.7.0 docs (Context7): `@ui/`/`@components/`/`@lib/`/`@hooks/` placeholders resolve to each consumer's `aliases.*`; a hard-coded relative target installs into the WRONG dir for `src/components/ui` / package-import layouts. All 64 item targets → `@ui/<name>.tsx`. `registry-header.mjs` resolves the placeholder to the docs app's ui dir for the copy-in; the shipped verifier's `resolveTargetPath(file,dir,aliases)` + new `readConsumerAliases()` resolve placeholders via the consumer's components.json (+4 resolver tests, incl. a non-default `src/components/ui` layout). `add-component` skill updated to emit `@ui/`.
- **[HIGH] Release workflow published after build only — FIXED.** `release.yml` now runs the FULL gate before `changesets/action` (typecheck/lint/test/build/registry:build + idempotency/registry:verify-consume) AND `needs:` a pinned-container `vrt-gate` job that fails closed without committed baselines. A publish can no longer skip a11y/lint/integrity/consumer/VRT checks.
- **[MED] verify-shadcn-consume only tested 4 items + simulated — EXPANDED.** Now proves ALL 64 item graphs across BOTH the default (`components/ui`) AND a non-default (`src/components/ui`) consumer layout — fetch → registryDependencies → integrity preflight → placeholder-resolved write → alias rewrite → shipped `--post-write` verify → consolidated tsc per layout (128 verifier invocations). Exit 0, deterministic, ~17s. Real `pnpm add` of unpublished @vegastack/* remains the one publish-gated step.
- **[MED] Inline visual styles bypass the token contract — FIXED.** ColorPicker `gridTemplateColumns`, TextEdit min/max-height, TableCellText width now route through CSS custom properties (`--swatch-cols`/`--te-min-h`/`--te-max-h`/`--cell-w`) consumed by arbitrary-value classes; only the ColorPicker swatch-fill color stays a direct inline style (the one sanctioned exception). `design-lint` inline-style rule tightened: a `style={…}` must assign ONLY `--*` custom properties OR be the file-scoped swatch-fill exception — any direct visual property (dynamic or literal) fails (7 proof scenarios). requirements §7.1 documents the narrowed exception.
- **[HIGH] VRT baselines absent (8th raise) — IRREDUCIBLE.** Linux baseline commit only; Docker/MK. Proven-functional locally (68/68 ×2).

## Round 13 — 2026-06-21 21:40 IST — verdict: needs-attention (0 critical · 2 high · 2 medium)

Session 019eeaf7. Findings + resolutions:

- **[HIGH] Consume proof was a simulator, not real `shadcn add` — UPGRADED to a real, mandatory gate.** `verify-shadcn-consume.mjs` now runs the ACTUAL shadcn 4.7.0 CLI (`shadcn add @vegastack/<name>`) as a load-bearing step for the dependency-graph exemplars (button leaf, split-button→button+dropdown-menu, data-list→table+checkbox+skeleton+empty-state): each exits 0, writes to the components.json-resolved targets, installs the declared `@vegastack/*` deps, and the consumed files tsc-pass. The unpublished-package blocker is solved LOCALLY: `pnpm pack` each declared dep (`@vegastack/utils`,`@vegastack/tokens`) → a minimal local npm registry the consumer's `.npmrc` points `@vegastack:registry` at (real `pnpm add @vegastack/x@^0.1.0` resolves offline). The 64×2-layout simulation is kept as breadth. Verdict states both: "real shadcn add 3/3" + "sim 64/64 × 2". Exit 0, deterministic (~30s). (Fixed a hang: in-process registry server starved by blocking spawnSync → moved to a sidecar child process.)
- **[MED] TextEdit controlled value desync while focused — FIXED at root.** The value-sync effect early-returned when focused but focus wasn't a dep, so an external `value` change during editing was dropped forever. Now a `pendingValueRef` records the focused-time external value and an `editor.on('blur', …)` subscription reconciles it on blur (caret-safe; `setContent({emitUpdate:false})` avoids the onChange loop; immediate apply preserved when unfocused). +2 tests (15 total).
- **[MED] DataList select-all erased off-page selections — FIXED at root (data-loss).** `toggleAll` replaced the whole selection with `new Set()`, deleting selections for rows outside the current (paged/filtered) `data`. Now it derives the next set from the existing `selected`: union the current-view `rowIds` on select-all, delete ONLY `rowIds` on clear — off-view selections preserved. Header checked/indeterminate already scoped to the current view. +3 tests (28 total).
- **[HIGH] VRT baselines absent (9th raise) — IRREDUCIBLE.** Codex now frames it as "keep gates red until baselines committed" — confirming the gates are CORRECTLY fail-closed pending the Docker/MK Linux-baseline bootstrap. Proven-functional locally (68/68 ×2).

## Round 14 — 2026-06-21 22:05 IST — verdict: needs-attention (0 critical · 3 high · 2 medium)

Session 019eeb17. ZERO component-logic findings — all packaging/release/tooling completeness (a convergence signal). Findings + resolutions:

- **[HIGH] @vegastack/ui would publish PUBLICLY against the locked private model — FIXED (operating-mode-critical).** The locked decision (requirements §NG4 / AGENTS.md): PUBLIC npm = ONLY tokens/tailwind-preset/utils/icons; components + provider stay private (registry copy-in). But packages/ui had `publishConfig.access: public` + a publish changeset → next `changeset publish` would push it publicly (irreversible). Set `@vegastack/ui` `"private": true` + `access: restricted` + removed `.changeset/initial-ui.md`. Now versioned-but-never-published (changeset skips private); publishable set = exactly the public-4. Whether the provider should be a published package (public/restricted/copy-in) is a distribution decision FLAGGED for MK (inline `//private` note + handoff).
- **[HIGH] Built @vegastack/ui dist dropped the Next `'use client'` directive — FIXED.** `dist/index.js` began with imports, not the directive (bundler stripped it), so a server-layout import of `VegaStackProvider` would break. Added `packages/ui/tsup.config.ts` with `banner: { js: "'use client';" }` (entry is all-client — only the provider stack); build → `tsup`. `dist/index.js` first line is now `'use client';`. New `tooling/verify-ui-use-client.mjs` postbuild guard fails closed if the directive is missing (runs in CI via `pnpm build`).
- **[MED] add-component skill told authors to write VRT `describe.skip`/`TODO(VRT)` — FIXED (obsolete).** Skill now requires adding the route to `PAGES` in components.spec.ts + the baseline-bootstrap workflow; never skip. `tooling/content-lint.mjs` gains `[vrt-skip]` (`describe.skip(`) + `[vrt-todo]` (`TODO(VRT)`) rules over apps/docs/vrt + skills, fail-closed (proven to fire).
- **[MED] Public token CSS `!important` bypassed the no-!important audit — FIXED.** `packages/tokens/src/base.css`'s 4 `!important` are exactly the WCAG `prefers-reduced-motion` reset (legitimate). Documented as the ONE sanctioned exception (comment + design-audit skill + requirements §7.5); extended design-lint with `--token-css` mode (scans exported token CSS, allows `!important` ONLY inside a reduced-motion block, fails otherwise; not the Tailwind rules — no oklch false-positives). Wired into `@vegastack/tokens` lint.
- **[HIGH] VRT baselines absent (10th raise) — IRREDUCIBLE.** Linux baseline commit only; Docker/MK.

## Round 15 — 2026-06-21 22:35 IST — verdict: needs-attention (0 critical · 3 high · 1 medium)

Session 019eeb29. Findings + resolutions:

- **[HIGH] Tooltip dropped the platform rich-tooltip API — RESOLVED as a documented composable-primitive refinement.** `VegaTooltip`'s `label`/`description`/`shortcut`/`variant`/`maxWidth` map to `TooltipContent` composition + `TooltipKbd` + a `max-w-*` class; `action` (interactive content) is DELIBERATELY a `Popover`, not a tooltip (WCAG non-interactive contract — the docs already stated this; Codex itself recommended the split). Added a "Migrating from the platform VegaTooltip" mapping table to `tooltip.mdx`, a requirements §12 record (alongside Button), and a matrix note. No silent drop.
- **[MED] FilterBar dropped platform AI/clear-all/active-filter/editable-chips — RESOLVED as a formal presentational-core scope decision.** Like DataList/TextEdit, `FilterBar` is presentational: it renders chips/add-menu/search/`trailing`; active-filter STATE, clear-all (compose into `trailing`), editable chip popovers (compose `FilterChip` + `Popover`), and AI suggestions (G7 app concern) are deliberately consumer-owned. Added a **Scope** section to `filter-bar.mdx` (with composition examples), a requirements §12 record, and a matrix note. Full-stateful `filter-bar-managed` = separate deferred item.
- **[HIGH] Provider not consumable downstream (private @vegastack/ui) — distribution DECISION surfaced for MK + docs made honest.** This is the genuine tension the locked docs don't resolve: §NG4 lists only the 4 token packages as public, but the consume model needs the provider installable. Kept `@vegastack/ui` private (safe, reversible interim — prevents an unintended public publish; can publish later). Updated `skills/consume/SKILL.md` to document BOTH paths (publish vs registry copy-in) honestly and to point at the handoff decision. **This is the one open DISTRIBUTION decision for MK** (publishing bucket).
- **[HIGH] VRT baselines absent (11th raise) — IRREDUCIBLE.** Linux baseline commit only; Docker/MK.

## Round 16 — 2026-06-21 23:05 IST — verdict: needs-attention (0 critical · 2 high · 3 medium)

Session 019eeb4f. Component bugs essentially dried up (FieldInline was the first real one since R13); the rest is packaging/tooling/scope. Findings + resolutions:

- **[HIGH] VRT baselines absent (12th raise) — IRREDUCIBLE.** Linux baseline commit only; Docker/MK. Proven-functional locally (68/68 ×2).
- **[HIGH] Provider not consumable + consume skill offered a non-existent path — made HONEST; DECISION for MK.** I'd offered `shadcn add @vegastack/provider`, but no `provider` registry item exists and `@vegastack/ui` is private. Reworked `skills/consume/SKILL.md`: the provider is workspace-internal only until the owner picks ONE — (1) publish `@vegastack/ui` (extend §NG4) OR (2) ship a real `provider` registry item — pointing at HANDOFF §4. No fake path. (The one open distribution decision — publishing bucket.)
- **[MED] FieldInline shipped an UNLABELED textbox when `placeholder` omitted — FIXED at root (a11y).** Edit-mode `<input>` used `aria-label={placeholder}` only; optional placeholder → no accessible name. Added a `label` prop + `aria-label`/`aria-labelledby` pass-through; name resolves `aria-labelledby → aria-label → label → placeholder → 'Edit value'` (never empty). +5 tests incl. a no-placeholder edit-mode axe test (12 total).
- **[MED] Public registry INDEX items lacked `meta.integrity` — FIXED.** `registry-stamp.mjs` mirrors each item's integrity into `public/r/registry.json` (the contentless index → the per-item hash); `verify-headers.mjs` asserts index integrity == manifest for all 64 (fail-closed). **Also fixed a latent R12 regression**: verify-headers resolved the copy-in via a plain `apps/docs/<target>` join, so since the `@ui/` placeholder migration it had been SILENTLY skipping the copy-in header check — now uses the placeholder resolver + fails closed if a copy-in is missing.
- **[MED] Docs app `global.css` `!important` bypassed the no-!important contract — FIXED as a documented narrow exception + lint coverage extended.** `apps/docs/app/global.css` had `margin-right: 0px !important` + `--removed-body-scroll-bar-size: 0px !important` under `html > body[data-scroll-locked]`, and `design-lint` never scanned `apps/docs/app` CSS, so the override shipped bypassing the contract. **Investigation:** the page reserves the scrollbar permanently via `scrollbar-gutter: stable`, but `react-remove-scroll-bar` (pulled in by the Fumadocs `SearchDialog` + Radix copy-in components) is unaware of the gutter and injects a runtime `<style>` singleton setting `body[data-scroll-locked] { margin-right: <gap>px !important }`, double-compensating and shifting content left. `!important` is **unavoidable** here — a plain declaration can never override the library's `!important` (CSS cascade); the more-specific `html > body` selector wins it. **KEPT as a narrow documented exception** (removal is impossible): added an explanatory comment to `global.css`, and **extended `design-lint`'s `--token-css` (`!important`-only, no Tailwind false-positives) mode** to allow exactly the two zeroed decls (`margin-right`/`--removed-body-scroll-bar-size: 0(px)`) under exactly `html > body[data-scroll-locked]` — anything broader (different value, different decl, different selector, generic `!important`) still FAILS (proven with 5 scratch-CSS scoping tests). **Wired `node tooling/design-lint.mjs --token-css app` into `@vegastack/docs` `lint`** so `apps/docs/app/**/*.css` is now scanned. Documented in requirements §7.5 (two sanctioned exceptions) + design-audit skill. docs build + full docs lint green.

## Round 17 — 2026-07-24 19:48 IST — verdict: needs-attention (0 critical · 1 high · 0 medium)

Full unstaged-tree release audit and adversarial workflow/supply-chain review. Resolved findings:

- **[HIGH] GitHub Team release/deploy approvals were impossible — FIXED at the actual plan boundary.** The private repository has no environments and prior successful npm/deploy runs used repository secrets, yet both workflows required named environments and rejected MK as actor. Release now uses a reviewed Version PR merge as the publish authorization; deploy is an explicit `main` dispatch. OIDC remains isolated to the one signing/publishing job, actions and the Playwright image remain digest-pinned, workflow permissions are least-privilege, and the workflow-security verifier fails closed on this Team-compatible model. The one-time public cutover is split into separate `prepare` and `verify` dispatches so the necessary human Access-policy pause remains real without pretending an unavailable environment supplies it.
- **[HIGH] Consumer update status could trust a stale header over edited installed bytes — FIXED.** `check-updates` now fetches and verifies every target item body, compares normalized installed content, detects removed/renamed targets, applies bounded concurrency/timeouts, and fails `--fail-on-update` for any drift. A backdoored-body regression test proves a matching header cannot conceal local mutation.
- **[HIGH] Registry and package gates admitted incomplete artifacts — FIXED.** Registry stamping now prunes stale JSON before hashing and exact-set checks reconcile authority, output, index, identity, and manifest. Package exports now prove ESM and CommonJS roots/subpaths plus `package.json`; the token build owns a single clean-at-start sequence so its CSS/JSON cannot be deleted by the later bundle. Signer identity, shipped hash parity, network error behavior, RSC safety, nested dependency imports, portal ownership, changelog links, workflow security, secret assignments, and structural lint all have executable fail-closed coverage.
- **[MEDIUM] Public docs, contract guidance, and state accessibility had drifted — FIXED.** Current API sections, motion/token vocabulary, theming guidance, brand/icon semantics, generated public skills, historical-record banners, homepage landmarks/readability, semantic 404 actions, and state-specific axe assertions now match source authority. All 96 component contracts, 439 animated icons, two hooks, and one block reconcile to 538 registry items.
- **[HIGH] Linux VRT baseline inventory is incomplete — OPEN SHIP BLOCKER (superseded by Round 18).** The verifier then reported 808 required screenshots and 638 missing. Local lint, typecheck, 1,251 Chromium component tests, 468 WebKit/Firefox smoke tests, real shadcn consumption, and both production visibility builds passed, but release/deploy intentionally remained blocked pending the pinned-Linux `vrt.yml update_baselines=true` artifact. Round 18 records that this figure omitted 68 fixed-route images because of a verifier defect.

## Round 18 — 2026-07-24 21:15 IST — verdict: clean (0 critical · 0 high · 0 medium)

Pinned-Linux VRT closeout and adversarial verification of the release blocker:

- **[HIGH] VRT completeness verification silently omitted every fixed route — FIXED at the authority boundary.** The verifier scraped `components.spec.ts` with a single-quote-only regular expression while the spec used double-quoted paths. It therefore treated all 17 fixed showcase routes × four projects as 68 orphans and understated the contract as 808 images. Capture and verification now import one typed `VRT_PAGE_ROUTES` authority, eliminating source-text parsing and making route drift structural rather than lexical.
- **[HIGH] Linux VRT baseline inventory — RESOLVED.** The pinned Playwright workflow successfully captured and uploaded the complete artifact. The corrected verifier proves 114 full pages + 96 isolated component fixtures across four projects + 36 animated-icon chunks = 876 exact Linux PNGs, with no missing, orphaned, non-Linux, corrupt, or wrong-width images. The artifact tree byte-matches the committed copy; representative desktop/mobile, light/dark, full-page, component-state, chart, AppShell, control, and icon-chunk captures were visually reviewed.

## Round 19 — 2026-07-27 — verdict: needs-attention → resolved same round (2 critical-class · 4 high · ~20 medium)

Scope: the full `feat/crm-commissioned-components` branch (CRM commission plan, unblocked set: 8 new
components · 2 new hooks · Table/DataList/FieldInline improvements · pin reconciliation · the
pickers' use-list-nav adoption). Three independent opus reviewers (sources, docs/metadata,
plan-compliance/tests); every finding verified against source before acceptance. Full findings +
per-finding resolutions: `docs/audits/2026-07-27-crm-commission-adversarial-review.md`.

- **[CRITICAL] The documented Timeline composition failed axe `aria-required-parent`** — `Item`'s
  default `role="listitem"` inside `TimelineItem`'s `<li>`. FIXED at every surface (`role="none"`
  prescribed and applied), plus a real-composition axe test that fails without it.
- **[HIGH] number-field's stepper buttons had no focus indicator** (`outline-none` defeating the
  centralized `:focus-visible` — bug class P0-02, in the one place the per-component focus tests
  didn't look). FIXED; every new component suite gained a focus sweep that catches exactly this.
- **[HIGH] A hidden or pending ActionBar kept focusable, activatable controls** (an invisible
  Archive button in the tab order; a "pending inerts" test that asserted no such thing). FIXED with
  real `inert`; role corrected `toolbar`→`group` (no APG promise the bar doesn't keep).
- **[HIGH] Stepper's blocked-reason live region mounted with its content** (idle→blocked announced
  nothing). FIXED — always-mounted region; transition-tested.
- **[HIGH] EditableCell could wedge on a stale spinner** when the user committed back to the
  persisted value during a slow save. FIXED — commits compare against the displayed optimistic
  value; superseding commits invalidate stale promises; regression-tested with two racing saves.
- ~20 medium/low findings (chip-input IME/paste/announcement/live-region splits, filter-builder
  cap-reason reachability + editor aria wiring + focus-arm expiry, use-platform Android-on-Firefox
  classification, Kbd mac glyphs gaining spoken names at the root, select-editor managed contract,
  and a docs/metadata sweep) — all fixed or explicitly accepted with rationale in the audit file.
- Prior-round findings re-checked: the round-16/17/18 fixes (registry integrity exact-sets,
  check-updates body verification, workflow security allowlist, contract-route authority) remain in
  place and untouched by this branch.

Post-fix gates: design-lint clean · typecheck 7/7 · full browser unit suite green (1367→1389 tests
after the regression additions) · contracts:all 832/832 over 104 routes · design:verify 18/18 ·
`pnpm lint` clean · consume round-trip clean · smoke Firefox 312/312 (WebKit blocked by the
documented 0a-note host gap — no Aqua session over SSH; ship requires a GUI-session run).

## Round 20 — 2026-07-27 · phase-3 adversarial review (D1–D4 engines: drag, drop, grid)

Scope: the dependency-gated wave — `use-drag-reorder`, `sortable-list`, `board`, `use-file-drop`,
`dropzone`, `data-grid`, the D1–D4 sanction, and every consistency surface it touched. Four
independent opus reviewers (drag stack · file drop · data-grid · cross-cutting); every finding
verified by execution; every accepted finding fixed in-round. Full findings and resolutions:
`docs/audits/2026-07-27-phase3-dnd-grid-adversarial-review.md`.

- **[CRITICAL] Gap/self pointer drops appended the dragged row to the end of its list** (container
  fallthrough). FIXED — same-container container-drops are a no-op; drag-tested for real (the test
  helper now drives Pragmatic's actual gates: dragstart on the registered element at the handle's
  coordinates).
- **[CRITICAL] Cross-column keyboard moves stranded focus on `<body>` with move mode stuck on** —
  the remount fires no blur. FIXED in the hook: session-scoped focus restoration to the moved
  item's handle; pointer drags can never trigger it.
- **[CRITICAL] Dropzone's `ref={ref}` clobbered the engine's root ref**, killing keyboard
  activation and drag-depth counting; and the "hidden input is the accessible control" story was
  false (engine: root tabIndex=0 role=presentation, input tabIndex=-1). FIXED — merged ref;
  surface-as-`role="button"` model made honest across every claim surface; input is a
  `display:none` sibling bridge (axe nested-interactive).
- **[CRITICAL] Paste bypassed `accept`** — unvalidated type ingestion on the documented usage.
  FIXED — paste enforces the same accept/size/count set as drop, surplus-only rejections.
- **[CRITICAL] DataGrid's roving tab stop could vanish** (hide active column / shrink data) and
  header Enter leaked into the cell editor layer. FIXED — clamped roving coordinate; keydown gated
  to body gridcells; `advanceEdit` dead code and its false Tab-advance claims removed.
- ~20 medium/low: preventWindowDrop no-op, disabled `open()` TypeError, reasonless refusal
  announcements, swallowed superseded-move rejections, RTL move-mode arrows, locked-lane card
  drops, board menu within-column ordering, `input: "menu"` vocabulary, grouped-grid aria
  geometry, spacer-row virtualization with measurement, sorted-model memoization, revelation
  holes, the Columns-menu focus-steal race, load-more refire, `onColumnOrderChange` stub removal,
  three vacuous tests (IconButton data-slot clobber), stale "deferred" claims, AGENTS.md
  864-checks numbers, the missing `@vegastack/design` changeset — all fixed; four judgment calls
  explicitly accepted with rationale in the audit file.

Post-fix gates: design-lint clean · `pnpm lint` 7/7 · typecheck clean · browser unit suite
1464/1464 (+21 regression tests, including the six MK-requested targeted tests for the
medium/low fixes) · contracts full sweep 864/864 pre-fix, touched routes 40/40 post-fix ·
Firefox smoke 207/207 (+5 capability-skipped paste tests) · registry:build idempotent · derived
surfaces current. WebKit smoke still requires MK's GUI session (0a-note) before `/ship`.
