# BUGS LEDGER

Every bug found + root cause + fix. Append-only.

---

## 2026-07-27 — Firefox neuters the DataTransfer of a synthetic ClipboardEvent (test-only)

- **Symptom:** `chip-input.test.tsx` "paste splits on the delimiter set" failed only in Firefox
  (full three-engine sweep — first time the test ran there; chip-input is not in the smoke set):
  the component's `onPaste` read `getData("text") === ""` and committed no chips.
- **Root cause:** Firefox places the `DataTransfer` attached to an **untrusted** `ClipboardEvent`
  in protected mode — the handler sees `clipboardData` with `types: []` and empty `getData`,
  while the same `DataTransfer` object still returns the text when read directly. Chromium and
  WebKit deliver the payload. Proven with a throwaway probe test (since deleted).
- **Fix:** the test dispatches a plain `paste` event with a stubbed `clipboardData`
  (`Object.defineProperty`) — React reads `clipboardData` off the native event, so the identical
  component path runs in all three engines. The component was never wrong for real user pastes.
- **Rider findings, same sweep:** two Firefox-only 15s timeouts (the 439-icon sweep at 20s, the
  animated-number retarget test) under a machine contended by a concurrently running dev server —
  both passed unchanged on a quiet re-run, and now carry explicit per-test timeouts (60s/30s).
  And the docs homepage + 404 page rendered `Button render={<Link/>}` without
  `nativeButton={false}`, tripping Base UI's native-button warning ×6 — the pattern is now
  documented in `button.mdx` and the design-system skill.

---

## 2026-07-25 — The forced-colors focus assertion cannot fail (pre-existing fail-open)

- **Symptom:** `contracts.spec.ts`'s "retains focus visibility" assertion passes with the design
  system's focus ring **deleted**. Removed `outline-2` → `outline-0` from `apps/docs/app/global.css`
  (the rule the docs pages actually load) and from `packages/design-tokens/src/base.css`, rebuilt, and
  ran `/docs/components/button`: **8 executed · 8 passed · 0 failed** both times.
- **Not a regression.** Reproduced against the unmodified spec at HEAD as well as the rewritten one,
  so the same-day `walkKeyboardFocus` rewrite neither caused nor masked it.
- **Root cause:** the assertion runs under `page.emulateMedia({ forcedColors: "active" })`, and in
  forced-colors mode Chromium paints its OWN focus ring. Measured on the real page with both author
  rules removed: every one of 14 controls reported `outline: solid 3px` — 3px, not the system's 2px,
  because it is the user agent's. So `hasOutline = outlineStyle !== "none" && outlineWidth >= 2` is
  unconditionally true. The fallback branch is no better: forced-colors also repaints borders on
  focus, so `hasTextEntryTint` was true for all 14 controls too. Branch tally with the ring removed:
  **outline only 0 · tint only 0 · both 14 · neither 0**. Both halves of `hasOutline ||
hasTextEntryTint` are satisfied by the emulation itself.
- **Why it went unnoticed:** the assertion was never observed failing. It is the one contract check
  with no negative fixture, and forced-colors is exactly the mode where a focus indicator is
  guaranteed by the platform rather than by the author — so the check measures focus visibility in the
  only environment that cannot lack it.
- **Blast radius:** 192 of the 768 checks (96 routes × 2 lanes... the focus half of
  "forced colors and target floor", across 4 projects). The 24px pointer-target half of the same test
  is unaffected and demonstrably still fails on real defects. Narrow reflow, RTL containment, and the
  target floor all remain real.
- **Fix: NOT APPLIED — needs MK.** Making it real means asserting the focus indicator in NORMAL
  colours (where the author ring is what shows) and keeping forced-colors for what it is actually
  for: that the component survives the mode without disappearing. That changes what 192 checks
  assert, which `docs/plans/2026-07-25-cicd-local-first-revamp.md` § Non-goals explicitly excludes
  from this change. It also needs its own negative fixture, or the replacement inherits the same
  defect. Scope it separately.
- **Interim honesty requirement:** until it is fixed, "forced-colors focus visibility" must not be
  cited as covered. Reproduction, for whoever picks this up:

  ```bash
  # in apps/docs/app/global.css change  outline-2  ->  outline-0  in the :focus-visible rule
  node tooling/contracts-run.mjs --routes /docs/components/button   # passes — it should not
  ```

## 2026-06-21 — RSC client-reference: compound sub-part access in server-rendered previews

- **Symptom:** Alert page 500 — "Element type is invalid ... got undefined" on `<Alert.Title>`.
- **Root cause:** `Alert` is a `'use client'` Object.assign compound; imported into a server-rendered preview it's a CLIENT REFERENCE proxy, so `Alert.Title` (sub-property) is `undefined` across the RSC boundary.
- **Fix (systemic):** all `apps/docs/components/preview/*.tsx` start with `'use client'` (interactive demos anyway) → compound sub-parts resolve. Baked into the authoring guide. Components also export flat parts (AlertTitle, ...) for RSC-safe consumer usage.

## 2026-06-21 — Cross-component registryDependencies must be namespaced (@vegastack/*)

- **Symptom:** after copying Wave 3, ALL component pages 500. Copied `components/ui/toggle.tsx` imported `radix-ui` + `@/lib/utils` (neither exists in apps/docs).
- **Root cause:** `toggle-group` declared `registryDependencies: ["toggle"]`. A bare name resolves to shadcn's BUILT-IN radix `toggle`, which `shadcn add` pulled in and wrote OVER our `@vegastack/toggle`. The broken toggle broke the preview barrel → every page.
- **Fix:** `registryDependencies: ["@vegastack/toggle"]` (namespaced) + rebuild registry + re-copy `@vegastack/toggle`. Baked the rule into the authoring guide.

## 2026-06-21 — Dangling `--motion-ease-out` token in tabs/accordion/collapsible

- **Symptom:** transitions referenced `ease-[var(--motion-ease-out)]` — no such token (we ship `--motion-ease-standard/emphasized/exit`). Easing silently fell back to default.
- **Fix:** replaced with the bridged `ease-standard` utility (`--ease-standard: var(--motion-ease-standard)`).

## 2026-06-21 — Wave 5 integration fixes

- **`{@link X}` in MDX prose** (split-button.mdx): MDX parses `{...}` as a JS expression → "Unexpected character '@'" → 500 cascaded across pages. Fixed: `{@link X}` → `` `X` `` (inline code). (JSDoc syntax doesn't belong in MDX prose.)
- **settings-row.tsx typecheck**: `SettingsSectionProps extends ComponentPropsWithoutRef<'section'>` redefined `title` as ReactNode (HTML `title` is string) → conflict. Fixed: `Omit<..., 'title'>`.
- **command.tsx typecheck**: `CommandDialogProps` children inherited cmdk's `ReactNode | renderFn` union; narrowed with explicit `children?: React.ReactNode`.
- **command a11y**: cmdk's listbox/group/separator role nesting trips axe `aria-required-children` (library-owned, same DOM shadcn ships; palette is keyboard-operable). Disabled that one rule for the cmdk test with a documented reason.
- **cmdk SSR**: cmdk renders null server-side, hydrates client-side (fine for an interactive palette). Command preview renders after JS loads — verified via hard-reload DOM (4 items + search input).

## 2026-06-21 — Self-correction round (parallel Opus bug-hunt findings, fixed at root)

Six parallel Opus bug-hunt agents swept build/typecheck · a11y · token/Tailwind-v4 · registry/integrity · per-component-contract · showcase. Real findings + root fixes:

- **`image.tsx` dangling motion var + cached-load race (MED):** `duration-[var(--motion-duration-fast,200ms)]` referenced a non-existent token → fixed to `duration-[var(--duration-fast)]` (defined: 150ms). Cached images (whose `load` fired before the passive effect) stuck behind the skeleton → added `imgRef` + callback ref and sync initial status from `img.complete && img.naturalWidth > 0`.
- **`truncated-text.tsx` ResizeObserver remount (MED):** measured node held in a `useRef`; when overflow flips the element into `<TooltipTrigger render>`, React mounts a fresh node and the deps-gated effect kept observing the detached one. Fixed: track node as `useState`, effect deps `[node, children, lines]`, `ref={setNode}`.
- **`command.tsx` CommandInput a11y:** `role=combobox` prohibits name-from-content → default an `aria-label` from `placeholder` (override-able); added `focus-within:border-ring` on the wrapper + `focus-visible:ring-0` on the input.
- **`country-select.tsx`:** `aria-hidden` on the decorative `ChevronsUpDown`/`Check` icons; added the missing `className` JSDoc.
- **`notification-bell.tsx` count clamp:** negative/fractional `count` rendered literally → `safeCount = Math.max(0, Math.floor(count))` drives badge + the folded-in accessible name.
- **Off-token durations (`sidebar.tsx`, `tooltip.tsx`):** hardcoded `duration-200`/`duration-150` → token-driven `duration-[var(--duration-base)]`/`duration-[var(--duration-fast)]` (same ms, now themeable). Copy-in re-synced (was stale).
- **`onChange` → `onValueChange` convention (text-edit, filter-bar):** value-emitting controlled components used `onChange` (DOM-collides with the native event shape). Renamed primary to `onValueChange`; `TextEdit` keeps `onChange` as a `@deprecated` alias (`emit = onValueChange ?? onChange`); `FilterBarSearch.onValueChange` is the sole prop. Tests/MDX/previews updated; one TextEdit test still drives the deprecated `onChange` to cover the alias path.
- **`registry.json` dependency over-declaration (LOW F1–F6):** 23 entries the source never imports — `@base-ui/react` on 14 wrapper components, `lucide-react` on empty-state/toggle/collapsible, `cmdk` on country/state-select, `@vegastack/utils` on icon-button, and the `@vegastack/breadcrumb` registryDependency on page-header (which takes `breadcrumb` as a consumer-supplied `ReactNode`, never imports it). Removed after verifying each against actual imports; `@vegastack/tokens` (foundation) + `@tiptap/pm` (required tiptap peer) kept. A scripted import-vs-declared check now reports 0 over / 0 missing across all 64.
- **`apps/docs/tsconfig.json` picked up the deferred VRT scaffold:** Next 16's build typecheck scanned `playwright.config.ts` + `vrt/**`, whose `@playwright/test` dep is installed only in the Docker CI image → `next build` failed. Excluded the VRT scaffold from the app tsconfig (it runs separately in CI). Static build back to 144/144 pages.
- **`tooltip.test.tsx` flake:** the previously-flagged timing assertion was already on the auto-retrying `expect.element` pattern (no `waitFor`); verified stable 3×8 passes. No further change.

**Re-verified after the round:** packages/ui `tsc` clean · design-lint clean · full vitest 487/487 (64 files) · registry rebuild + 64 stamped · local integrity recomputed==stamped==manifest for all 64 · copy-in 0 drift · static build 144 pages · root `turbo typecheck` 10/10.

## 2026-06-21 — Codex round 1 MED-2: forwarded-ref contract (§7.6) — systemic

- **Symptom:** `Button` (and ~25 other DOM-root components) typed props as `ComponentPropsWithoutRef` and never forwarded a consumer `ref`; §7.6 (G6) requires forwarded ref. Matrix claimed §7.6 green.
- **Root fix (React 19 ref-as-prop, forwardRef is deprecated in 19):**
  - `useRender` roots (button, badge, breadcrumb·BreadcrumbLink, pagination·PaginationLink, sidebar·SidebarMenuButton/Trigger): `ComponentPropsWithRef` + destructure `ref` + `useRender({ ref })`.
  - Plain `{...props}`-spread host roots (alert+parts, kbd, skeleton, toggle, relative-time, markdown-view, empty-state+parts, page-header, filter-bar+FilterChip, data-list): `ComponentPropsWithoutRef`→`ComponentPropsWithRef` — the existing spread carries the ref.
  - Composite orchestrators: color/emoji/country-select forward `ref` to the `PopoverTrigger`; state-select/text-edit/field-inline to their root host; sonner documents N/A (mount-once portal toaster, drops unknown props).
  - Delegating wrappers (icon-button/copy-button/split-button/notification-bell) auto-forward via `{...props}` onto their ref-bearing child — verified, no code change.
  - Base-UI `ComponentProps` wrappers (dialog/select/tooltip/…) auto-forward via React-19 prop spread — verified.
- Added a ref-attachment test to ALL 64 components (sonner documents N/A). 68 new ref tests.
- **Real ref bug caught:** `date-picker`'s `Calendar` — react-day-picker's `DayPicker` is a plain fn that doesn't forward `ref` (only an internal `rootRef` when `animate`). Fixed by merging the consumer ref with `rootRef` onto the overridden Root `<div data-slot="calendar">`.
- **Real ref bug caught:** `kbd` multi-key (`keys`) form spread `{...props}` (incl. ref) onto EVERY `<kbd>` chip → ref fanned across nodes. Fixed: route the consumer ref + props to the single `KbdGroup` root; chips render bare.
- Base UI renders `Checkbox`/`Switch` as `<span role=…>` (not `<button>`) and `Image` forwards to the inner `<img>` — tests assert the actual host (not bugs).

## 2026-06-21 — Full-suite test flakes (load-dependent, fixed at root)

- **tooltip + hover-card "content not shown until interacted" (focus-open race):** the closed-state tests rendered a `delay=0`/`openDelay=0` surface and asserted it closed via a global `ownerDocument.querySelector`. Base UI opens on **focus-visible instantly (ignores the hover delay)**, so under full-suite CPU load a transient focus on the freshly-rendered trigger opened the popup → `data-popup-open`/portaled content present → flake (~1/15). A large hover-delay did NOT fix it (focus ignores delay). **Root fix:** assert the CLOSED state with a CONTROLLED `open={false}` surface (the env can't open a controlled-closed popup) — deterministic; the open path stays covered by the hover/focus tests.
- **text-edit "clicking Bold … onChange" (selection-sync race):** a manual DOM `Range.selectNodeContents` doesn't reliably sync to ProseMirror's internal selection under load, so Bold toggled a stored mark without wrapping text → no doc change → `onChange` never fired (~1/20). **Root fix:** split into two deterministic tests — Bold toggles `aria-pressed` (stored mark, no selection needed) + the deprecated `onChange` alias fires on typing (`fill` always changes the doc).

## 2026-06-21 — Codex round 2 HIGH-1: status tokens fail WCAG AA

- **Symptom:** computed contrast (OKLCH→sRGB→WCAG): light warning 1.80:1, dark success 3.61:1, dark warning 3.06:1 (+ dark muted 4.32) — below AA 4.5:1 for the fg/bg token contracts (badge bg-success/text-success-foreground …). Unverified because unit axe excludes contrast (no compiled CSS).
- **Root cause:** light `warning-foreground` was amber.900 on amber.700 bg (dark-on-dark amber); amber.700 is also in the "dead zone" (too light for white, too light for black at small text). Dark success/warning used white foreground on colors too bright for white.
- **Fix:** light warning → new primitive `amber.750` (oklch 0.52 0.145 52) + white foreground (5.56:1 solid, 5.56:1 text-on-white). Dark success/warning foreground white→`neutral.950` (dark text on the bright dark-theme colors: 5.25 / 6.20). Dark `muted-foreground` neutral.400→new `neutral.450` (0.66 → 4.86). Per-color optimal foreground (white for low-luminance hues, dark for high-luminance amber/green) — the standard automatic-contrast approach.
- **Gate (Codex's ask):** new `tooling/contrast-check.mjs` computes WCAG contrast for all 28 canonical fg/bg token pairs (both themes) from the generated theme.css and FAILS the token build + `pnpm lint` if any < 4.5:1. Fail-closed; runs in CI via `pnpm build`. All 28 pass.

## 2026-06-21 — Codex round 2 MED-3: dark token model shape-asymmetric

- **Symptom:** `semantic.dark.tokens.json` is color-only (no radius/font/duration/motion), but the generated `TokenName` type is the LIGHT keyset → `tokens.dark.radius` / `tokens.dark['motion-ease-standard']` type as valid yet are `undefined` at runtime.
- **Fix:** non-color tokens are theme-invariant, so build the dark model SYMMETRIC — `darkModel = { ...light, ...darkColorOverrides }` (color overrides win, the rest inherit light). Added a BIDIRECTIONAL fail-closed assertion (light⊆dark AND dark⊆light). Now light/dark both expose 53 keys; `tokens.dark.radius === tokens.light.radius` (0.625rem); the .dark CSS still overrides colors only.

## 2026-06-21 — Codex round 3 HIGH-2/HIGH-3: real compiled-CSS contrast gate + dark/soft AA fixes

- **Gap:** unit a11y tests suppress `color-contrast` (no compiled CSS) and VRT is Docker-deferred → rendered contrast was unverified; the "zero-violation axe" claim was hollow.
- **Fix (the active compensating gate Codex asked for):** new `packages/ui/test/contrast.browser.test.tsx` + `test/contrast.css` + `@tailwindcss/vite` in vitest.config — compiles the REAL Tailwind utilities + token theme and runs axe `color-contrast` against actually-rendered components (badge solid/soft, button status variants, alerts, muted text) in BOTH themes. Blocking vitest test; other test files import no CSS so stay fast structural checks.
- **Real failures it surfaced + fixed (all sub-4.5 soft/tinted + dark variants):**
  - DARK status text too dark to read on dark surfaces: success green.600→green.500 (0.72), info blue.600→blue.400, destructive red.700→red.500 (0.69); info/destructive solid foreground white→neutral.950 (dark text on now-bright fills).
  - LIGHT success too light on its own tint: green.700→green.750 (0.50).
  - Alert description `opacity-90` reduced text contrast → removed (full-strength description text).
- Unit `color-contrast` suppressions KEPT (justified: no CSS → false positives) but their comments + test/a11y.ts now point to the compiled-CSS gate as the compensating proof. contrast-check.mjs (solid token pairs) still passes 28/28.
- Result: contrast.browser.test.tsx passes light + dark; full suite 65 files / 559 tests; docs 144 pages.

## 2026-06-21 — Codex round 3 HIGH-4: registry verifier TOCTOU (post-write hash)

- **Gap:** the shipped verifier only checked the registry item BEFORE `shadcn add`; shadcn re-fetches after, so a registry compromised between check and copy-in was undetected.
- **Fix:** added a `--post-write` mode to `packages/utils/bin/verify-registry-item.mjs` (+ a `--save` on the pre-write step that persists the EXACT verified item bytes). Post-write compares each copied file on disk against the saved item's `content`, tolerating ONLY shadcn's import-alias rewrites (non-import lines must match byte-for-byte; import lines may differ only in a sanctioned alias-root module specifier). Fail-closed. Tamper-proven (exfil line, repointed import, smuggled binding, code-line edit, missing file all → exit 1). Consume skill documents the 3-step fail-closed flow. Hash parity with registry-hash.mjs preserved.

## 2026-07-24 — Release workflow modeled unavailable GitHub environments

- **Symptom:** release and deploy could not start on the private GitHub Team repository even though the earlier OIDC publish and Cloudflare deployment had succeeded.
- **Root cause:** workflow policy had been written for required-reviewer environments, but the repository has zero environments on its current plan; it also rejected MK as actor while MK is the release owner.
- **Systemic fix:** use reviewed PR/Version-PR merges and explicit `main` dispatches as the approval boundaries, keep credentials in the already-working repository secrets, split public cutover into two dispatch phases, and make `verify-workflow-security.mjs` enforce that executable topology.

## 2026-07-24 — Update checker trusted provenance headers as content

- **Symptom:** an installed registry file could be edited while retaining its `@vegastack` header and still be reported current.
- **Root cause:** the fast path treated a matching version/integrity header as proof of the file body.
- **Systemic fix:** always fetch the verified item, normalize and compare installed bodies, reconcile the complete target set, and regression-test edited-body and removed-target cases.

## 2026-07-24 — Package clean step deleted token CSS

- **Symptom:** `@vegastack/design-tokens` reported a successful build, but `theme.css` was missing when the next verification step opened it.
- **Root cause:** Style Dictionary wrote the CSS first and `tsup --clean` then erased the whole output directory before writing JavaScript.
- **Systemic fix:** `build-tokens.mjs` owns a clean-at-start build; `tsup` adds ESM/CommonJS/type outputs without a second clean, and package-export/theme-parity gates inspect the resulting combined artifact.

## 2026-07-24 — Formatter mutated immutable research evidence

- **Symptom:** the design-doctrine source manifest rejected a commit-pinned Cloudflare snapshot after repository formatting.
- **Root cause:** third-party byte-for-byte evidence was inside the formatter's default Markdown scope.
- **Systemic fix:** restore the pinned upstream bytes and exclude all immutable source snapshots from formatting; their SHA-256 manifests remain the serialization authority.

## 2026-07-24 — Server 404 invoked a client-only variant helper

- **Symptom:** static production export failed while prerendering internal routes because `app/not-found.tsx` called `buttonVariants()` across an RSC boundary.
- **Root cause:** the generated Button module is a client module, so a server page may render its component but may not invoke one of its exported functions.
- **Systemic fix:** compose `Button` with Next `Link` through Base UI's `render` prop. Both private and public 386-route builds now prerender successfully.

## 2026-07-24 — VRT verifier parsed quotes instead of sharing route data

- **Symptom:** the pinned-Linux bootstrap captured 876 screenshots successfully, but completeness verification rejected 68 fixed-route images as orphans and claimed only 808 images were required.
- **Root cause:** `verify-vrt-baselines.ts` scraped the Playwright spec with a regular expression that recognized single-quoted paths only; all fixed routes in the spec were double-quoted. Contract-derived component/block routes still appeared, which made the incomplete expectation look plausible.
- **Systemic fix:** move the complete full-page inventory into a typed, data-only `VRT_PAGE_ROUTES` module imported by both capture and verification. Exact-set, Linux-only, PNG-signature, and lane-width checks remain fail-closed. The corrected authority accepts exactly 876 artifact images with no missing or orphaned paths.

## 2026-07-25 — Terminal had no focus indicator under forced colors

- **Symptom:** `contracts.spec.ts` "retains focus visibility" failed for `/docs/components/terminal` in all four Playwright projects across all three retries, blocking the release.
- **Root cause:** the scrollable `terminal-body` is `tabIndex={0}` and expressed focus as `focus-visible:border-ring/(--alpha-tint-border)` with `focus-visible:outline-none`. `forced-colors: active` replaces `border-color` outright, so the tint disappeared; Tailwind v4's `outline-none` compiles to a bare `outline-style: none` with no forced-colors carve-out, so the shared `:focus-visible` outline could not take its place. Both affordances were false at once.
- **Why no gate caught it earlier:** `tooling/design-lint.mjs`'s `outline-none` rule is FILE-scoped — it passes as long as the file contains any `focus-visible:` affordance, and this file did (the border tint on the same element). The rule cannot see that the affordance and the suppression are on the same element and cancel out.
- **Systemic fix:** the shared `:focus-visible` outline is the affordance, pulled inside the box with `focus-visible:-outline-offset-2`. An outward outline is not an option here for two independent reasons: the terminal root is `overflow-hidden`, and `scroll-fade-x` masks the element to its own border box, so anything painted outside it is dropped. A border tint is not an option because forced colors overwrites it. `terminal.tsx` was the only file in `packages/ui/registry/ui/` containing `focus-visible:outline-none`; `ScrollArea` uses the same `tabIndex={0}` pattern without it and always passed.

## 2026-07-25 — Terminal's focusable command pane had no accessible name

- **Symptom:** the scrollable command pane is in the tab order but a screen reader announced it as an unnamed stop — no role, no name (WCAG 4.1.2 Name, Role, Value). Found while reviewing the forced-colors focus fix above, not by a gate.
- **Root cause:** it was a bare `<div data-slot="terminal-body" tabIndex={0}>`. `tabindex` makes an element focusable but does not give it a role, so it maps to `generic` — and `generic` **prohibits** naming, which means even an `aria-label` on it is not reliably exposed. `ScrollArea` looked like precedent for label-on-a-role-less-div, but Base UI sets `role="presentation"` on its viewport and a focusable element nullifies that role, so that pattern was not sound either.
- **Why no gate caught it:** `expectNoA11yViolations` runs axe, and axe's `scrollable-region-focusable` rule only requires that a scrollable region BE focusable — it does not require the resulting focus stop to have a name. `contracts.spec.ts` asserts focus visibility and pointer-target size, not accessible names. Neither is wrong; naming simply sat between them.
- **Systemic fix:** the pane is `role="group"` labelled by the visible `title` via a `useId()`-generated id, so every existing caller gets a correct name with no change. `group`, not `region`: `region` is a landmark, and a docs page with several install snippets would add several landmarks for no navigational value. `aria-label`/`aria-labelledby` passed to `Terminal` are intercepted and applied to the pane (matching `ScrollArea`'s API shape), never emitting both — `aria-labelledby` wins in the AT, so allowing both would silently ignore a caller's `aria-label`. The test asserts the computed role+name pair through `getByRole("group", { name })` rather than the attributes, because the pair is what is actually announced.

## 2026-07-25 — A container job's `sh` reported a shell error as registry drift

- **Symptom:** `release.yml`'s `quality-gate` failed at "Require registry build idempotency" with exit 2 (run `30142154420`). The step's whole purpose is to detect generated-file drift, so the failure read as "registry:build is not idempotent" — a serious and completely wrong conclusion.
- **Root cause:** `set: Illegal option -o pipefail`. A job running in a `container:` gets `sh -e {0}` as its default shell, and dash has no `pipefail`. The script aborted before `git status` ever ran. Latent for as long as the step has existed; it only surfaced now because earlier runs never reached this step in the container path.
- **Why it was misleading:** the step name and its `::error title=Generated registry drift::` message describe the check, not the shell. A reader sees a drift failure and starts diffing generated files.
- **Systemic fix:** `shell: bash` on the step (the pinned image ships bash), plus a fail-closed gate: `tooling/verify-workflow-security.mjs` now rejects any step inside a container job that uses a bash-only construct (`set -o pipefail`, `[[`, `<<<`, `$((`, `mapfile`, `shopt`) without declaring `shell: bash`. Negative-tested. The class is closed, not just the instance.

## 2026-07-25 — The Toaster contrast audit was racing Sonner's auto-dismiss

- **Symptom:** `test:all-browsers` failed one test of 3765 in `quality-gate` — `Toaster color-contrast passes WCAG AA — light theme`, WebKit: "insufficient color contrast of 1.26 (foreground `#e3e3e2`, background `#fefdfc`)". On a slower runner the same test instead failed the enter-animation poll with "Matcher did not succeed in time".
- **Why it looked like a token bug and was not:** `#e3e3e2` is in no theme block. It is what axe computes when the near-black light-theme text (`#0b0a09`) is composited over white at roughly 10% opacity — and `--warning-subtle` (`#feeee8`) at that opacity rounds to `#fefdfc`, which is why the background read as plain `--popover` instead of the warning tint. Both numbers are one fact: the toast was measured mid-fade.
- **Root cause:** `auditToast` fires a toast, polls for its enter animation, then runs a full axe pass over `document.body`. Sonner's default lifetime is 4s (`TOAST_LIFETIME`). When the axe pass pushes the total past 4s, Sonner starts the EXIT animation while axe is still measuring. The test was racing a timer it did not own.
- **Proved by controlled experiment, not inference:** firing the same toast and reading it after a deliberate 5s wait — without `duration: Infinity` the toast is _gone_; with it, `stillPresent: true, opacity: "1", removed: "false"`.
- **Systemic fix:** the audited toasts are fired with `duration: Number.POSITIVE_INFINITY`, which makes Sonner skip the auto-dismiss timer outright (`sonner/dist/index.mjs`: `if (… toast.duration === Infinity …) return`). `auditToast` already dismissed explicitly, so the test now owns the whole lifetime instead of half of it. No assertion was weakened and no token changed.
- **Why it surfaced only now:** `quality-gate` had never completed. It failed on an unrelated WebKit animated-icon test on 2026-07-24, and on the next run `vrt-gate` failed first so `quality-gate` was skipped entirely. Removing the screenshot gate finally let the release path run far enough to reach this.

## 2026-07-27 — A live region created together with its content announces nothing

- **Symptom:** Stepper's `blockedReason` rendered and carried `role="status" aria-live="polite"`,
  yet the idle→blocked transition was silent on real AT.
- **Root cause:** the span mounted conditionally (`{blockedReason ? <span aria-live…> : null}`) — a
  live region must exist in the accessibility tree BEFORE its content changes; mounting region and
  content together is a no-op announcement. The unit test rendered with the reason already set, so
  it asserted attributes, not the transition.
- **Systemic fix:** the region is always mounted (visually hidden when empty) and only its text
  changes; the test now exercises idle→blocked. The CLASS to recognise: any conditional-render of
  an `aria-live` node, and any test that renders a live region in its announced state. The sibling
  class fixed the same day: an IDENTICAL consecutive announcement is a React same-state bail-out
  and never re-announces — chip-input and editable-cell now sequence-key their announcement text.

## 2026-07-27 — `outline-none` + `focus-visible:-outline-offset-2` is a silent focus-ring deletion

- **Symptom:** number-field's stepper buttons had no focus indicator in any theme.
- **Root cause:** `outline-none` (utilities layer) beats the centralized `:focus-visible` outline
  (base layer); `focus-visible:-outline-offset-2` only sets the offset and never restores
  `outline-style`, so it reads like a focus treatment while guaranteeing none. Bug class P0-02;
  the house idiom (`terminal.tsx`) uses the negative offset WITHOUT `outline-none`.
- **Systemic fix:** removed; every new component test suite now carries a sweep asserting nothing
  outside text-entry controls (whose border-tint substitute is sanctioned) strips the outline —
  the check that catches this class regardless of which component it recurs in.

## 2026-07-27 — "Hidden" floating UI must be inert, not just invisible

- **Symptom:** a closed ActionBar (translate + opacity 0 + pointer-events-none) kept its actions
  in the Tab order — an invisible, activatable Archive button; `pending` likewise only dimmed.
- **Root cause:** CSS-only hide recipes remove pointer interaction but not keyboard/AT reachability;
  a test named "inerts the actions" asserted `aria-busy` and a class, not inertness — a false
  coverage claim.
- **Systemic fix:** React 19 `inert` on the hidden bar and on the pending actions container;
  tests assert the attribute. The class: any stay-mounted hide (the MessageScrollerButton recipe)
  hosting interactive children needs `inert` — the scroll button itself is exempt only because its
  single action is harmless and appears exactly when relevant.

## 2026-07-27 — A spread `ref` silently kills a prop-getter engine

- **Symptom:** Dropzone's keyboard path dead and drag-depth counting broken, with every test green.
- **Root cause:** `{...getRootProps()} ref={ref}` — JSX places the later `ref` (even `undefined`)
  over the engine's root ref, and react-dropzone gates BOTH its keydown handler and its dragleave
  filtering on `rootRef.current`. No error, no warning; two behaviours just stop existing.
- **Systemic fix:** merged refs, and the hook's docs now name `dropProps.ref` as load-bearing. The
  class: any prop-getter library ref must be MERGED, never assigned over — and a test that only
  exercises the geometry the broken path still handles (dragleave on the root itself) certifies
  the state machine while being blind to its real failure mode; test the CHILD-crossing case.

## 2026-07-27 — Cross-parent remounts fire no blur: sessions that end "on blur" never end

- **Symptom:** a cross-column keyboard move left the board card in move mode forever with focus on
  `<body>`; the same flow within one column worked perfectly.
- **Root cause:** React unmount fires no blur event, so any interaction session whose exit path is
  `onBlur` survives a cross-parent remount — while the focused node itself is destroyed.
- **Systemic fix:** the hook restores focus to the moved item's registered handle after each render
  while a keyboard move session is live (a counter pointer drags reset, so it cannot fire
  mid-drag). The class: keyed remounts across parents need explicit focus continuity; blur is not
  a lifecycle signal.

## 2026-07-27 — A component that overwrites `data-slot` after its spread makes caller slots dead

- **Symptom:** three tests asserting "no handle/menu renders when disabled" passed against fully
  enabled components — their selectors could never match anything.
- **Root cause:** `IconButton` places `data-slot="icon-button"` AFTER `{...props}`, so a caller's
  `data-slot` is discarded silently; the callers kept passing one anyway.
- **Systemic fix:** the dead attributes removed; the tests re-anchored on accessible names. The
  class: a selector-based negative assertion must first be proven able to match in the positive
  case, or it asserts nothing.

## 2026-07-28 — Production uploaded successfully but a stale boundary contract failed the workflow

- **Symptom:** deploy run `30309811715` signed, reverified, and uploaded the exact `main` artifact,
  then finished red in `verify-protected-boundary`; package publication and the Cloudflare upload
  were healthy, but the workflow could not be called complete.
- **Root cause:** the operator had intentionally made every non-registry route public, including
  `/internal/*`, while `deploy.yml` retained the abandoned phased-cutover model and still expected
  those routes to require SSO. The repository and production control plane described different
  policies.
- **Systemic fix:** one unconditional post-deploy verifier now enforces the approved topology:
  every non-registry route is anonymous, every internal derivative is noindex/no-store and absent
  from discovery, and only `/r/*` is private. The authenticated half additionally pins Stepper's
  live version to the deploying tree and verifies its integrity against the Sigstore-signed
  manifest. Negative mutations prove that a cutover switch, conditional verifier, or missing
  canonical probe is rejected.

## 2026-07-28 — A public policy sentence made an unlisted route discoverable

- **Symptom:** the first recovery ship run stopped before contracts because metadata verification
  found an internal-route URL in `llms-full.txt`.
- **Root cause:** the public registry-auth guide named the operations path while explaining that it
  was anonymous. The corpus generator correctly copied the public guide into LLM output; the prose
  itself had violated the no-discovery contract.
- **Systemic fix:** public guidance describes unlisted operations pages without publishing their
  route. The build continues to reject any internal-route literal in search, sitemap, and LLM
  corpora. Do not add an allowlist for explanatory prose: a URL is discoverable wherever it appears.

## 2026-07-28 — The ship gate's docs warm-up overlapped a lane it claimed not to overlap

- **Symptom:** one SortableList WebKit test timed out at 15 seconds during the first full ship run,
  while 4,407 sibling tests passed. The exact test then passed six consecutive targeted runs, and
  the warmed complete suite passed all 4,408 runnable tests.
- **Root cause:** `gates.mjs` said the cold Next export overlapped “only unit and smoke,” but never
  awaited that build before starting the complete three-engine suite. The implementation allowed
  resource pressure to spill into WebKit despite the documented ordering guarantee.
- **Systemic fix:** the ship ladder now awaits the cache warm-up after smoke and before the complete
  suite. A warm-up failure remains non-authoritative—the contract runner rebuilds and owns the
  verdict—but a still-running cold export can no longer contend with the longest browser lane.

## 2026-07-28 — A historical SSO requirement remained visually current after the boundary changed

- **Symptom:** current operator surfaces correctly said `/internal/*` was anonymous, while the old
  requirement document still presented its D11 SSO topology without an explicit supersession at the
  reading point. An agent landing on that document could reintroduce the failed production policy.
- **Root cause:** the boundary recovery updated executable probes and active runbooks, but no
  semantic gate required a historical authority to identify the newer decision before preserving its
  old text.
- **Systemic fix:** `tooling/verify-operator-docs.mjs` now checks every current operator surface and
  requires a prominent historical supersession marker on `docs/requirements.md`. Three mutation
  fixtures prove that SSO, Cloudflare Access, and missing-supersession claims fail for the intended
  reason. Historical decision text remains unchanged below the marker.

## 2026-07-28 — An untracked path made a working tree look like a pure version bump

- **Symptom:** with one untracked plan in the tree, `classify-change --json` reported one substantive
  changed file but `pureVersionBump: true`, then disabled contracts, unit, and smoke. The same hole
  was reachable by the receipt-carry predicate.
- **Root cause:** the changed-file inventory correctly appended `git ls-files --others`, but the
  version predicate inspected only `git diff`. Git emits no diff record for an untracked path; the
  empty record set was mistaken for “no offender.” Mode-only and binary records had analogous
  non-body shapes.
- **Systemic fix:** untracked paths now reject before batching, every remaining inventory path must
  have a parsed diff record, and mode/binary metadata rejects explicitly. Isolated repositories
  exercise source, test, binary, symlink, generated, unknown, mixed version+untracked, deletion,
  rename, mode, and binary mutations; two real Version Packages generations and allowed package/header
  version churn remain positive controls.

## 2026-07-28 — Deploy accepted a scoped receipt that could not represent the complete browser lane

- **Symptom:** a synthetic `mode: ship` receipt with two routes / 16 contracts and no
  `all-browsers` field passed the same guard expectations deploy used. The production instruction
  claimed a complete three-engine/full-contract requirement the schema could not express.
- **Root cause:** schema 1 stored one status per gate, omitted `all-browsers` from its gate universe,
  and treated any positive contract count as sufficient. `mode` was descriptive text, not a profile.
- **Systemic fix:** schema 2 introduces an explicit `production-full` profile and a canonical sorted
  manifest reconstructed from machine authority: one Chromium unit leaf, three smoke leaves, three
  complete-browser leaves, and 108 routes × four projects × two assertions = 864 contract leaves.
  Deploy names that profile explicitly. Negative mutations reject old schema, scoped/missing-route/
  wrong-count evidence, missing engines, absent/duplicate/extra/unsorted/stale leaves, wrong
  fingerprint/tree/toolchain/authority, and a root without leaves.

## 2026-07-28 — A cold browser-unit run reloaded after discovering its test dependencies

- **Symptom:** the first schema-2 full-ship attempt failed Chromium unit/axe after Vite discovered
  dependencies twice during the active run. Eight files were disrupted, 23 tests failed, and only
  1,375 tests executed. The same sweep's complete three-engine lane later passed.
- **Root cause:** Vite's default optimizer crawl ignores test files, but the browser suite's entry
  graph begins in `*.test.tsx`. Bare imports were therefore discovered after the browser mounted.
  The resulting reload split React identity; the log showed unresolved linked
  `@vegastack/design` entrypoints followed by invalid-hook errors and unrelated timeouts.
- **Systemic fix:** the shared Vitest config declares both browser-test trees as optimizer entries
  and explicitly pre-bundles the linked design package root and theme-scope entrypoint. A semantic
  verifier rejects removal of either entry graph or linked entrypoint. After the supported cache
  clear, the cold suite passed all 1,471 tests with one bundle in 21.8s; smoke then passed 643 with
  five intentional skips in 21.5s. No timeout, retry, worker, or coverage setting changed.

## 2026-07-28 — The docs warm-up still overlapped WebKit/Firefox smoke

- **Symptom:** after the optimizer fix, a full ship attempt passed all 1,471 Chromium tests but its
  smoke lane timed out waiting for WebKit `CopyButton` to enter the copied state. The immediately
  following complete three-engine suite passed the same case. The preceding failed sweep had shown
  the same shape on a different Firefox animation-replay case.
- **Root cause:** the earlier scheduling repair waited for the docs export only before the complete
  lane. `runPush` and `runShip` still ran WebKit/Firefox smoke concurrently with the export, despite
  the no-cross-engine-overlap policy. Two different isolated timeouts under that schedule proved it
  was not safe cover.
- **Systemic fix:** both ladders may overlap the docs warm-up only with Chromium unit/axe and await it
  before smoke. `verify-gate-schedule.mjs` rejects an overlap mutation in either ladder. No retry,
  timeout, worker, selector, or assertion was relaxed; the failed sweeps remain non-evidence.

## 2026-07-28 — The docs warm-up also destabilized Chromium canvas timing

- **Symptom:** after moving the warm-up barrier ahead of smoke, the next full attempt failed three
  `ParticleField` first-frame assertions during Chromium unit/axe while the export was still active.
  Isolated smoke then passed after waiting at the barrier.
- **Root cause:** “Chromium is safe overlap” was an unmeasured optimization assumption. The canvas
  draw depended on browser scheduling and was starved under the same export pressure that had
  already destabilized WebKit/Firefox interactions.
- **Systemic fix:** component, push, and ship now await the docs warm-up before their first browser
  gate. The schedule verifier rejects removing any of the three barriers. The mandatory build cost
  is reported honestly rather than hidden under an unstable lane; no test budget was weakened.

## 2026-07-28 — Smoke ignored dependencies of selected components

- **Symptom:** changing Button did not require pre-push smoke even though Button reaches selected
  CopyButton, SortableList, Board, and NotificationBell tests. Twelve dependency source files were
  absent from the old exact-file trigger.
- **Root cause:** classifier and gate runner only collected source/test files on records directly
  marked `crossBrowserSmoke: selected`; neither traversed `registryDependencies`.
- **Systemic fix:** one shared selector follows the verified transitive registry/import closure. A
  generated manifest compares 40 modeled paths with Vitest 4.1.9's related graph, deduplicated across
  engines; the current graph has zero disagreements. All 12 audited dependency sources and
  direct/transitive/hook/global/unknown/stale/disagreement mutations fail closed. Disagreement
  widens to full smoke and cannot subtract registry coverage.
