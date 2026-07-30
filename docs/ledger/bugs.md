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

## 2026-07-28 — Full-ship reports omitted total and warm-up cost

- **Symptom:** the retained ship JSON had eight gate durations but no total, no docs-export warm-up,
  no environment/cache classification, and no per-run history. A later run overwrote the prior mode
  report, so p50/p95 and exact-tree sequence claims could not be reconstructed locally.
- **Root cause:** the ladder collected only blocking `gate()` calls in one latest-mode object. The
  nonblocking warm-up lived outside that collector, and no measurement schema distinguished measured,
  API-reported, modeled, estimated, or unknown values.
- **Systemic fix:** every segment and total now writes an immutable gitignored schema-v1 measurement
  keyed by run ID. Reports bind the gate implementation generation, environment, cache/cold state,
  scope, and retry count; unavailable CPU/RSS remain explicitly unknown. The read-only summarizer
  separates generations and route/check cohorts. Schema, negative duration/class/retry, and mixed
  cohort mutations fail for their intended reason.

## 2026-07-28 — Invalid receipts did not stop expensive PR verification

- **Symptom:** run `30262728421` spent roughly 14m41 in the free-mini verification job after the
  independent receipt guard had already made the PR terminally red. The same job invoked
  `design:verify` explicitly and then invoked it again through root `pnpm lint`.
- **Root cause:** CI jobs were parallel and the duplicated command ownership was only documented in
  comments, not structurally asserted.
- **Systemic fix:** `verify` now needs `receipt-guard`; `pnpm lint` is the single named owner of
  design verification. The no-cache alternative is present only as a disabled, exact-runner canary
  with cached default and structured setup/install cohort reporting. Workflow mutations reject every
  removed dependency, restored duplicate, unconditional canary, or missing cached control.

## 2026-07-28 — Cloudflare upload had no unambiguous terminal state

- **Symptom:** a deploy could upload successfully and create a version while later production probes
  failed. Operators saw the upload as near-completion, and no structured version ID connected the
  candidate to the final result.
- **Root cause:** `deploy-curated` was the last mutation job, while the live probe had no downstream
  all-success summary. Wrangler console output was not captured through its machine interface.
- **Systemic fix:** Wrangler writes NDJSON and exactly one successful deploy/version record is required.
  A self-hosted `deployment-complete` summary depends on sign, upload/reverify, and the external live
  probe without `always()` or `continue-on-error`. Eight new workflow mutations cover this surface.

## 2026-07-28 — Later pre-push could erase stronger exact-tree ship evidence

- **Symptom:** an unchanged `gates:push` after a production-full `gates:ship` wrote a new
  change-profile receipt. The same browser/contract facts had been executed more completely, but the
  mutable receipt retained only the weaker profile.
- **Root cause:** receipt writing had no dominance rule and used a direct truncate/write operation.
- **Systemic fix:** receipt replacement now compares independently verified exact-tree evidence.
  Stronger production-full evidence dominates a later successful weaker run; a later failure is
  annotated and invalidates reuse rather than being erased. Receipt writes use flushed same-directory
  temporary files and atomic rename. Reuse remains shadow-only, and malformed, carried, stale,
  wrong-toolchain, wrong-authority, partial, and failing mutations all force execution.

## 2026-07-28 — Gate retries had no exact diagnostic boundary

- **Symptom:** after one browser or contract assertion failed, the only supported recovery was to
  rerun its whole lane. A passing rerun had no machine distinction from blocking evidence, and the
  original failure target was retained only in terminal text.
- **Root cause:** Vitest used terminal-only reporting and the failure summary named a gate command,
  not exact file/engine/test or route/project/title selectors.
- **Systemic fix:** normal browser lanes now retain structured Vitest failures; contracts accept and
  cross-check exact project/title selectors. `gates:retry` rejects empty, renamed, stale-tree, and
  unknown targets, verifies nonzero execution, and hashes the receipt, evidence store, and original
  failure before/after. Its result is explicitly diagnostic and cannot clear or write evidence.

## 2026-07-28 — Blanket Turbo tooling input hid unrelated gate costs

- **Symptom:** an exact one-contract retry after a release/gate helper edit took 130.4s because the
  docs export missed cache even though the helper could not affect its bytes. The live Turbo dry-run
  placed 81 `tooling/**` files in every task's global hash.
- **Root cause:** `turbo.json` uses one global tooling glob instead of the external scripts and data
  each package task actually invokes. That is safe but erases task ownership and invalidation reason.
- **Systemic fix (shadow only):** `gates:affected` reports current Turbo hashes beside proposed
  task-specific external-tool fingerprints, including content, type, mode, symlink target, and
  transitive relative imports. Mutation tests cover every currently referenced script and reject
  dynamic/unparsed references. The report is deliberately activation-ineligible until root
  data/config reads have the same complete inventory and mutation proof; the blanket dependency is
  unchanged.

## 2026-07-28 — Release network failures were interpreted as unpublished versions

- **Symptom:** `classify-change --check-npm` added a package to `unpublished` for every nonzero npm
  lookup, so timeout, 5xx, malformed output, and a genuine 404 all selected the same hosted publish
  path. The `has_changesets` boolean also allowed an all-empty set to produce a green Version job
  that could never advance.
- **Root cause:** gate scheduling, npm registry truth, Changesets state, and outward job selection
  were compressed into two booleans. Neither carried an unknown state or an explicit recovery action.
- **Systemic fix:** `release-state.mjs` queries exact public `name@version` values and emits a
  resumable state, reason, next action, and approval boundary. Only E404 is missing. Network/data/PR
  uncertainty, all-empty/invalid changesets, and workflow/changeset conflicts block. Only
  `versioned-unpublished` selects hosted build/OIDC; registry-only `published` selects zero hosted npm
  jobs, and publication ends with an exact-version readback. Mutation tests pin every branch.

## 2026-07-28 — Concurrent tsup config deletion raced ESLint discovery

- **Symptom:** the Stage K full lint oracle failed with ENOENT for
  `packages/design/tsup.config.bundled_<random>.mjs` while Turbo ran that package's build and lint
  tasks concurrently.
- **Root cause:** tsup creates, imports, and deletes a temporary bundled config in the package root.
  `eslint .` could discover that transient file before deletion and try to read it afterward.
- **Systemic fix:** the package flat config ignores `tsup.config.bundled_*.mjs`. A semantic negative
  fixture places invalid JavaScript at that exact pattern and requires ESLint to ignore it; removing
  the ignore makes the fixture fail. No Turbo concurrency, coverage, or gate was weakened.

## 2026-07-28 — Smoke shadow digest broke the Version Packages carry

- **Symptom:** the clean release preflight failed because a simulated pure version bump changed
  `packages/ui/smoke-impact.generated.json`'s full contract digest, and receipt carry correctly
  classified that line as substantive.
- **Root cause:** Stage D added a contract-derived generated surface after the carry's independently
  rederived output inventory was last reconciled.
- **Systemic fix:** the tracked manifest joins the generated surfaces that `design:derived:check`
  reconstructs on the exact release tree. Carry now also requires an actual `package.json` version
  field change, so an arbitrary generated-file edit or provenance restamp cannot qualify alone.
  Mutations prove both rejection directions and the combined version-plus-derived case.

## 2026-07-28 — Strong production receipt was rejected by the weaker Release guard

- **Symptom:** after the derived smoke fix, release preflight carried a valid `production-full`
  receipt, but the default `change` guard rejected its profile and all 871 canonical leaves as extra.
- **Root cause:** schema-2 verification required profile equality instead of modeling one-way
  strength, then reconstructed the expected evidence universe from the weaker requested profile.
- **Systemic fix:** `production-full` may satisfy `change`, and verification reconstructs the full
  receipt profile. The reverse remains rejected; deploy still explicitly requires production-full,
  and carried receipts remain excluded from exact-tree reuse. Positive/negative fixtures pin both
  directions.

## 2026-07-28 — Accumulating consume roots masked an over-broad dependency assertion

- **Symptom:** the first isolated full consume run failed only `icon-a-arrow-down` in both layouts:
  the real CLI installed its declared `@vegastack/design` dependency, but the runner demanded the
  unrelated `@vegastack/design-tokens` package. The old consolidated real consumer had installed
  tokens for an earlier root, so the same false assertion always appeared green.
- **Root cause:** real roots shared one package/install directory and the verifier checked the global
  union of public VegaStack packages rather than the exact dependencies of each resolved root graph.
  Simulated consumers deliberately link the workspace dependency set, so they could not expose this
  real-install defect.
- **Systemic fix:** every real and simulated root/layout now uses a unique consumer. Required public
  packages are parsed from that root's complete resolved graph and checked exactly. Mutations pin
  scoped version parsing, unrelated-package exclusion, transitive union, unique consumer identity,
  nonempty output manifests, collision detection, post-write/typecheck presence, full layout/count
  completeness, and duplicate immutable report-key rejection. The corrected full oracle passed all
  26 real and 26 simulated leaves plus both 554-root consolidated layouts.

## 2026-07-28 — Pinned artifact download could not hard-fail a digest mismatch by configuration

- **Symptom:** the first Stage M workflow draft set `digest-mismatch: error` on the pinned
  `actions/download-artifact@v6`, assuming the newer upstream input existed. The pinned v6 action
  does not define it, while GitHub's general artifact documentation describes a digest mismatch as a
  warning. The workflow would therefore have looked fail-closed without owning that guarantee.
- **Root cause:** current-main action documentation was applied to the repository's pinned major
  without checking that version's input contract.
- **Systemic fix:** candidate discovery retains the API's immutable artifact ID and `sha256:` digest.
  Before extraction, `deploy-candidate.mjs download` fetches that exact REST archive and independently
  compares SHA-256, failing on mismatch. Only then does the pinned action extract the same immutable
  ID. Workflow mutations reject removal of the hard check, and the unit mutation corrupts archive
  bytes. Candidate reuse remains disabled; the mandatory rebuild is still the sole production input.

## 2026-07-29 — Visual review changed on identical trees

- **Symptom:** the first completion VRT reported 57 changed screenshots despite no component visual
  edit: 56 showed only syntax-token colour changes and one showed a different Fumadocs TOC marker.
- **Root cause:** Fumadocs 16 defaults build-time highlighting to Shiki's JavaScript RegExp engine;
  consecutive parallel builds emitted different TSX token scopes. Chromium full-page stitching also
  scrolled through headings while Fumadocs updated its IntersectionObserver-driven TOC marker.
- **Systemic fix:** build-time MDX pins Shiki Oniguruma, which upstream recommends for Node/build-time
  maximum grammar compatibility. The VRT harness normalizes only scroll-driven TOC active/track state
  immediately before capture. A verifier rejects removal/reordering. Across consecutive builds,
  77,338 extracted Shiki blocks were byte-identical; raw full HTML was explicitly rejected as an
  oracle because Next build-specific asset identifiers changed. Human review remains required for
  the intentional syntax-colour difference.

## 2026-07-29 — Operator-doc verifier recognized only yesterday's wrong counts

- **Symptom:** semantic fixtures rejected 7 hosted jobs and 96/768 contracts, but a future wrong
  value such as 6 or 109/872 would pass. Current CLI source comments/help and a direct package-level
  Playwright contract alias were outside its inventory.
- **Root cause:** independent stale constants and a 16-file prose-only inventory were treated as
  semantic verification.
- **Systemic fix:** hosted jobs are derived from every workflow YAML and route/check counts from the
  contract authority; 29 current surfaces and nine executable `--help` paths are checked. New
  mutations cover future wrong values, provenance/preflight/history wording, direct wrappers,
  missing structured diagnostics, and terminal probe evidence. Historical incidents remain labelled
  by date instead of being rewritten.

## 2026-07-29 — Diagnostic and deployment summaries trusted step outcomes without their reports

- **Symptom:** runner diagnostics wrote complete-browser/contract JSON but summarized only Actions
  step outcomes; the engine-launch probe had no JSON. The production probe emitted only logs/exit
  status, so `deployment-complete` could not name the attempted probe count or exact registry version.
- **Root cause:** `continue-on-error` was used to collect diagnostics without a second structured
  reconciliation step, and deployment terminal state depended on job ordering rather than carrying
  the probe facts.
- **Systemic fix:** launch, complete-browser and contract reports are parsed into explicit
  executed/pass, executed/fail, skipped, not-reached or unknown states; empty/corrupt reports fail the
  terminal verdict. The external probe atomically writes structured pass/fail observations, and the
  terminal deploy job requires Cloudflare version ID, nonzero passing probe count and exact registry
  version. Workflow-security now rejects 50 mutations including swallowed/missing/empty outcomes.

## 2026-07-29 — Final review found two current instructions contradicting their executables

- **Symptom:** release gotchas said `gates:push` ran the root lint umbrella even though the gate
  executes Turbo lint, and runner diagnostics said browser jobs had to remain GitHub-hosted even
  though current policy keeps every browser lane on developer machines.
- **Root cause:** both lines survived broad terminology corrections because neither exact semantic
  contradiction had a mutation fixture.
- **Systemic fix:** current prose now names the actual gate command and local browser policy. Two
  dedicated operator-doc fixtures reject either regression; the final unchanged-scope review must
  rerun all current semantic fixtures before it may report zero medium findings.

## 2026-07-29 — Historical gate timings were still presented as current budgets

- **Symptom:** active agent, release, ship, and gate-runner surfaces still said full ship took about
  20 minutes and complete browsers took 1m39s after the retained completion run measured 48m25s and
  7m12s respectively.
- **Root cause:** timing prose had no generation label and was outside the operator semantic
  mutations, so the benefits ledger could reject the target while day-to-day instructions kept
  advertising it.
- **Systemic fix:** historical estimates are explicitly labelled; current surfaces name the retained
  `n=1` sample and its unknown thermal/cold state, and direct command summaries avoid unsupported
  latency promises. A timing-generation fixture rejects reintroducing the stale current wording.

## 2026-07-29 — Runner diagnostics bypassed the standard complete-browser package authority

- **Symptom:** the diagnostic workflow invoked `vitest-run.mjs` directly while the documented
  `test:all-browsers` package command still called Vitest without the structured nonempty reporter.
  A component-testing reference also mislabeled that command as a main/Release lane.
- **Root cause:** the workflow and package script had parallel entry points, so either could drift
  while both appeared to run the same configuration.
- **Systemic fix:** `test:all-browsers` now owns the structured wrapper and diagnostics call that
  package command with exact run/report arguments. A dry-run proved argument forwarding. Operator
  and workflow mutations reject a direct Vitest package script, direct wrapper bypass, missing
  report path, or a renewed main/Release browser claim.

## 2026-07-29 — Component-contract authority still assigned browsers to main/Release

- **Symptom:** `verify-component-contracts` printed a current machine-authority rationale saying
  main/Release ran the complete three-engine suite, contradicting the locked local-first topology.
- **Root cause:** the earlier prose sweep did not inventory the contract authority's operational
  rationale, and its digest-derived copies faithfully propagated the stale sentence.
- **Systemic fix:** the authority now names local pre-push and `gates:ship`, explicitly stating that
  CI and Release only attest browser lanes. The operator verifier inventories the authority and a
  semantic mutation rejects the old claim; every digest-derived surface was regenerated.

## 2026-07-29 — Visual review reported numbers without explaining the visible change

- **Symptom:** the final handoff described a Button fixture as a “147-pixel delta,” which did not tell
  MK that only the antialiased letter edges of “Glass” differed or provide direct screenshot links.
- **Root cause:** the ship protocol required a route/project/pixel/verdict table but omitted a
  plain-language summary and explicit paths to the before, after, and difference images.
- **Systemic fix:** the canonical ship skill and visual-review reference now require both. The
  operator-doc verifier inventories the reference and a semantic mutation rejects a pixel-only
  handoff.

## 2026-07-29 — A fresh production-full receipt failed the staged format gate

- **Symptom:** all eight terminal ship lanes passed and generated a valid receipt, but committing
  only `.gates/receipt.json` failed because Prettier collapsed its three engine arrays.
- **Root cause:** both the atomic gate writer and Prettier claimed serialization authority over the
  committed machine-owned evidence.
- **Systemic fix:** `.gates/receipt.json` is explicitly excluded from Prettier, and the hook verifier
  fails if that exclusion disappears. Receipt schema/content verification remains the correctness
  authority; no generated receipt is hand-formatted after a gate run.

## 2026-07-29 — Clean release preflight packed public packages without their exports

- **Symptom:** the clean detached release simulation installed local tarballs but every real consumer
  typecheck failed to resolve `@vegastack/design` or its `theme-scope` export.
- **Root cause:** the public manifests include only ignored `dist/*` build products for their JS/type
  exports. Consume packed the current directory without owning a build prerequisite, so its outcome
  depended on whether an earlier command had populated `dist`.
- **Systemic fix:** consume builds both public packages in dependency order, validates every export
  and bin target against `pnpm pack --json`, and writes those artifact facts into the structured
  report. Missing output now fails once at the artifact boundary instead of surfacing as many
  downstream TypeScript errors. No publication lifecycle hook or token was added.

## 2026-07-29 — Packed-artifact exact-universe branches lacked complete mutations

- **Symptom:** missing/duplicate public artifact fixtures passed, but there was no forced unexpected
  package mutation; non-relative export strings were skipped rather than classified invalid.
- **Root cause:** the first archive closure focused on current missing `dist` files and did not
  adversarially enumerate every branch of the newly added exact-universe collector.
- **Systemic fix:** exact artifacts now reject missing, duplicate, and unexpected package names;
  invalid/escaping export or bin targets fail instead of disappearing. Each branch has an exact
  intended-reason fixture, and the production-full receipt must be regenerated after the fix.

## 2026-07-30 — Provenance subtraction hid a mode-only scheduler input

- **Symptom:** the new working-tree planner called the content-level provenance filter before
  classifying metadata. A mode-only change has no substantive `+`/`-` body, so it disappeared before
  the planner could widen it.
- **Root cause:** a content-only helper was reused as the complete scheduling inventory even though
  its own historical purpose was only to remove generated provenance lines.
- **Systemic fix:** the canonical inventory now disables rename detection and reconciles substantive
  content with raw add/delete/type/mode records plus untracked paths. A pure mutation proves
  provenance-only content drops while mode, empty add/delete, both rename halves, type changes, and
  untracked binaries remain. Binary content is independently detected and widens every product lane.

## 2026-07-30 — Import closure initially widened on dotted basenames and shared ownership

- **Symptom:** the first real dependency graph retained 43 false unresolved imports and treated
  legitimate shared tests/docs routes as duplicate ownership, forcing a full plan for Button.
- **Root cause:** any dot in a basename was mistaken for a complete source extension, and the first
  owner map assumed every file belonged exclusively to one registry record.
- **Systemic fix:** candidate resolution recognizes only modeled source extensions; ownership is a
  set for shared tests/routes while exclusive duplicate authority still rejects. The real graph now
  has 1,640 sources, 1,733 internal edges, zero retained issues, and a mutation-proven Button →
  CopyButton reverse edge. Over-capture remains acceptable; under-capture widens.

## 2026-07-30 — Common VRT plan and route selector could describe different work

- **Symptom:** changing `tooling/lib/route-scope.mjs` made the common planner require full VRT while
  the older pixel selector classified all `tooling/**` as nonvisual. `--full-pages` also expanded the
  grep without including those extra pages in the selector digest/report.
- **Root cause:** the visual runner consumed only the route selector and its structured report did
  not bind the common impact decision or the full-page expansion.
- **Systemic fix:** VRT now reconciles both independent oracles: either may add routes and either
  full result wins. Explicit diagnostic routes stay exact. Full-page expansion occurs before hashing;
  atomic reports retain reason, digest, disagreement, executed/safely-skipped state, and the
  human-review-only/no-receipt boundary. Five report mutations reject regression.

## 2026-07-30 — Friendly-looking future files could inherit an unreviewed safe skip

- **Symptom:** `gate-impact` treated every Markdown file below `docs/` or `skills/`, and broad
  `release-*`/`registry-*` tooling prefixes, as known. A future tracked executable input with a
  familiar name could therefore skip product lanes without an explicit authority decision.
- **Root cause:** directory and filename labels were being used as proof of semantics. Missing-file
  mutations widened, but did not reproduce an existing regular future file that matched the broad
  allowlist.
- **Systemic fix:** operational Markdown is limited to explicit current authorities/directories;
  consume and non-product tools use exact reviewed membership. Existing regular lookalike Markdown,
  release tooling, and registry tooling mutations now widen every product lane. Unknown remains the
  fallback, and ordinary push/ship remain the independent oracle.

## 2026-07-30 — Planner timing hid checkpoint and process-start cost

- **Symptom:** the first report called a roughly one-second impact subphase “selector overhead” while
  checkpoint attainability, module startup, inventory, cohort construction, Turbo parsing, and final
  tree reconciliation happened outside that number.
- **Root cause:** measurement began immediately around `planAffectedImpact` instead of at process
  time origin, and attainability was constructed after the terminal tree check.
- **Systemic fix:** `impact-plan` and `gates:affected` report total process-relative planning wall plus
  named impact, Turbo, cohort, and checkpoint subphases. Attainability now runs inside the caller's
  start/final exact-tree envelope. A controlled prose sample measured 2,805.537ms internally and
  2.85s externally (`n=1`); no percentile or hidden execution saving is claimed.

## 2026-07-30 — Selected rendered MDX could disappear from VRT authority

- **Symptom:** route scope selected a changed page such as `/docs/foundations/elevation`, but the VRT
  capture authority listed only a hand-maintained subset. The later authority filter silently
  removed the route, allowing zero expected leaves and a false not-applicable result.
- **Root cause:** the planner modeled all routable MDX while the Playwright test generator and VRT
  reader had a smaller independent list; filtering did not distinguish a legitimate one-tree
  addition/removal from a route absent on both trees.
- **Systemic fix:** `design:derived` now generates an exact 139-route root/MDX authority. Generation
  rejects dynamic, duplicate, symlinked, or unroutable content and is freshness-checked inside the
  VRT consumer. Selected routes absent on both trees fail; additions/removals retain exact leaves on
  the tree where they exist. A formerly omitted real page now produces four project leaves.

## 2026-07-30 — Runner diagnostic contract verdict constructed no expected universe

- **Symptom:** the deep diagnostic reader called `expectedContractLeaves()` with no route argument;
  every genuinely passing full contract report threw during reconciliation and became
  `executed/fail`.
- **Root cause:** structured output was added without executing the embedded reader against the
  required function signature, and workflow security checked only for the function name.
- **Systemic fix:** the workflow independently reconstructs all component routes from route scope,
  generates the exact 864 leaves, and matches both report scope and executed leaves. Mutations reject
  zero-argument, report-owned, or omitted-scope universes.

## 2026-07-30 — A checkpoint label could start a full oracle before shape rejection

- **Symptom:** `global` was offered when only one lane was full, while the retained proof required all
  six lanes full. Mixed workflow/header plus component diffs could similarly pass the label check and
  be rejected only after an expensive full ship.
- **Root cause:** scenario candidates and post-oracle proof used different predicates.
- **Systemic fix:** candidates now mirror pre-execution proof: global requires all lanes full;
  workflow/header require no selected executable. Partial-full and mixed-product mutations reject
  before the `gates.mjs ship` spawn site. A second fail-closed guard now rejects every affected
  `--oracle ship` path while the required foundation scenario is machine-unattainable, before report
  creation, selected execution, the full oracle, or retained sample writes. Fresh-directory
  integration mutations cover both raw and selected checkpoint commands, so the documented 0/30
  stop cannot silently burn a full ship run.

## 2026-07-30 — Component diagnostics overlapped a cold docs build with browser unit work

- **Symptom:** the broad root lint failed `verify-gate-schedule.mjs`: `gates:component` started its
  selected Vitest browser lane while the docs export warm-up was still running. This could recreate
  the historical CPU/thermal contention that made browser timing unstable and docs warm-ups fail.
- **Root cause:** dependency-aware component mode correctly avoided the export for a route-less hook,
  but its routed branch awaited the warm-up only immediately before contracts, after the selected
  unit browser lane had already executed.
- **Systemic fix:** a routed component may overlap docs warm-up only with plain-Node design lint, then
  must cross the same barrier as push/ship before any browser lane. The schedule verifier enumerates
  every Vitest and contract-wrapper invocation, moves each one ahead of the barrier independently,
  removes each mode's barrier, and removes either component route guard: all 14 mutations reject.
  Route-less sources still avoid the export entirely.

## 2026-07-30 — Exact VRT rerun could not name rendered docs pages

- **Symptom:** `--routes` accepted only component fixture authority, so a focused stability rerun
  could not name guide/foundation pages. The first `--page-routes` implementation then unioned
  inferred work while its help promised an exact diagnostic.
- **Root cause:** fixture and rendered-page authorities are intentionally different, but the CLI had
  only one selector and the added page selector reused additive change-derived semantics.
- **Systemic fix:** `--page-routes` now replaces inferred pages and clears inferred fixtures/icons;
  combining it with `--routes` retains exactly both explicit sets. Full common impact still wins.
  Mutations cover leaked inferred pages/fixtures/icons, empty/duplicate/malformed/whitespace routes,
  and the ambiguous `--all` combination. Same-tree use remains diagnostic-only.

## 2026-07-30 — OTP VRT captured an incomplete hydrated state matrix

- **Symptom:** an origin/main comparison showed only the final three of OTP's five fixture rows in
  one working-tree capture (4,037 mobile pixels / 4.26%), although component and preview source were
  identical. A same-tree rerun did not reproduce the missing rows.
- **Root cause:** the harness waited for the outer server-rendered preview shell, but did not require
  the client OTP state matrix to contain and lay out all five roots before screenshotting.
- **Systemic fix:** both sides now require exactly five nonzero, visible OTP roots before capture.
  Removing that readiness call is a failing harness mutation. The remaining same-tree 17-pixel dark
  glyph delta is visually identical rasterization and remains human-review evidence, not a retry
  pass or receipt.

## 2026-07-30 — OTP readiness did not prevent locator screenshot clipping

- **Supersedes the diagnosis above:** the first readiness-hardened same-tree rerun reproduced the
  exact 4,037-pixel mobile image. Its full failure screenshot showed all five rows; only the locator
  screenshot omitted the first two. The roots were hydrated and visible, so hydration was not the
  remaining cause.
- **Root cause:** nested boxes with `overflow-x-auto` compute the other overflow axis to `auto`.
  Locator screenshot scrolling could leave valid row boxes outside the screenshot target; the first
  fix checked box size/style but not geometric containment.
- **Systemic fix:** reset nested vertical scroll, anchor the first OTP row, and require every row's
  top/bottom to remain within the capture target before screenshotting. Four additional mutations
  reject removal of reset, anchor, top containment, or bottom containment.

## 2026-07-30 — Locator screenshot re-scrolled after OTP containment proof

- **Supersedes the containment fix as sufficient:** a retained same-tree run at `11f06af2` again
  produced the 4,037-pixel mobile delta after all five rows passed the pre-capture containment poll.
  The full failure image contained every row, while the locator snapshot clipped the first two.
- **Root cause:** Playwright performs its own scroll-to-element step inside a locator screenshot.
  The pre-capture scroll reset and containment proof cannot constrain that later internal action.
- **Systemic fix:** retain the five-row visibility/layout, scroll-reset, anchor, and containment proof;
  then, for the exact OTP fixture only, derive its non-null bounding box and use a page screenshot
  clipped to that rectangle. Every other fixture retains locator screenshots. Nineteen harness
  mutations reject route widening, missing readiness/containment, invented or missing rectangles,
  omitted clipping, locator fallback for OTP, and removal of the ordinary fixture path.
- **Runtime proof:** exact same-tree commit `0202fb160ff2ede9c1003f6caef55f3af88aa808`
  executed all four desktop/mobile light/dark leaves and reported 0 changed / 4 unchanged / 0 new /
  0 removed / 0 broken. Retained snapshots visibly contain empty, filled, masked, error, and disabled
  rows. This is capture-mechanism evidence only; it does not write receipt evidence or relax the
  human VRT decision.

## 2026-07-30 — OTP verifier accepted unreachable, swallowed, and truncated proof paths

- **Adversarial finding:** the first page-clip verifier accepted unreachable screenshots, early
  returns, a post-derivation 1×1 overwrite, ignored or short-circuited readiness, short-circuited
  throw guards, and `.catch(() => {})` failure swallowing. It also required a non-null bounding box
  without proving that the full rectangle was inside the current viewport; Playwright permits
  negative viewport-relative coordinates.
- **Root cause:** source-fragment presence and weak AST shape checks were mistaken for executed
  control-flow proof. Page clip validity was inferred from visibility instead of checked against the
  capture API's viewport geometry.
- **Systemic fix:** parse the TSX with installed TypeScript 6.0.3. Require one exact ordered OTP
  readiness function, directly awaited calls with exact terminal methods, an exact OTP/ordinary
  sibling branch, no extra OTP statements, exact null guards, and an exact seven-term
  finite/positive/in-viewport OR-chain immediately before capture. Forty-four mutations reject
  unreachable, early-return, overwritten, ignored, short-circuited, swallowed, negative, zero-size,
  overflow, widened-route, and removed-default variants.
- **Runtime evidence:** same-tree commit `8a5cd944079ee85ec43285bdb5bc23bb5105c7ac`
  executed four viewport-bounded leaves and reported 0 changed / 4 unchanged / 0 new / 0 removed /
  0 broken (cold base 7.0m, warm head 3.2m; CPU/RSS/thermal unknown). The terminal-method verifier
  commits change no rendered source. Final review closure remains separate.

## 2026-07-30 — Classifier mutation harness failed on a frozen clean HEAD

- **Symptom:** full `pnpm lint` reached `verify-classify-change.mjs`, copied the current classifier
  closure into a clone of the same committed HEAD, then unconditionally ran `git commit`. With no
  staged delta, Git correctly exited 1 (`nothing added to commit`), so the positive verifier failed.
- **Root cause:** fixture setup assumed current source bytes were necessarily newer than cloned HEAD.
  That was true during dirty implementation but false at the exact final state the verifier exists
  to validate.
- **Systemic fix:** inspect the staged diff first. Status 0 means the harness is already current and
  HEAD is preserved; status 1 commits the real closure delta; any other Git failure propagates. A
  self-contained fixture proves both paths and clean committed HEAD `9d6ff0df` passes all 74
  classifier assertions. No `--allow-empty` bypass is used.

## 2026-07-30 — Vitest reporter exclusions blocked a truthful full-ship receipt

- **Symptom:** terminal `pnpm gates:ship` run
  `2026-07-30T02-40-56.470Z-ship-91b880d2-faf1-4d96-8c10-16f7df3b5e65` executed every lane,
  including 108 routes / 864 contract checks, but evidence freeze correctly refused to write a
  receipt. Smoke reported 643 passed plus five skipped definitions; all-browser reported 4,408
  passed plus the same five skipped definitions.
- **Root cause:** Firefox cannot express synthetic clipboard files for five Dropzone paste cases.
  Vitest's pre-run list omitted those `test.skipIf` definitions, while its runtime reporter retained
  them as skipped. Selection reconciliation already treated the pre-run list as the required
  universe, but the final validator separately required the reporter skip count to be zero.
- **Systemic fix:** freeze the independently planned/pre-listed leaves as required evidence and keep
  reporter-only skips in a separate visible exclusion manifest. A listed required leaf that skips
  still fails. Count mismatch, duplicate/malformed exclusions, foreign file/engine, and smuggling an
  exclusion into the required selector all fail by mutation. The failed run remains diagnostic
  evidence only; no receipt, retry evidence, or ship-completion claim was recovered from it.

## 2026-07-30 — Broad reporter-exclusion repair could hide an arbitrary skipped regression

- **High finding:** the first receipt-freeze repair accepted any reporter-only skipped definition
  inside an expected file/engine. Replacing one of the five names with an arbitrary disabled test
  still validated, so reporter visibility had accidentally become approval.
- **Root cause:** file/engine membership was treated as capability authority. The validator did not
  bind the excluded identity to reviewed source or require an independently reconstructable exact
  exclusion manifest.
- **Systemic fix:** one authority now names the five exact Firefox Dropzone paste leaves and the
  `synthetic-clipboard-files` capability, with a SHA-256 binding over the capability probe and
  `pasteTest` declaration. Static AST mutations reject direct, aliased, computed, conditional,
  todo, renamed, removed, extra, and cross-file disabling. Runtime reconciliation and receipt freeze
  independently reject every unapproved, duplicate, stale, wrong-lane/file/engine, or pre-listed
  skipped leaf. The failed full-ship run remains diagnostic only; no evidence was recovered.

## 2026-07-30 — New Vitest authority widened the independent consume planner

- **Symptom:** the clean deterministic sweep reached the new gate-impact assertion and found the
  Vitest-only authority correctly selected full browser lanes but also selected full registry consume.
- **Root cause:** the common planner modeled the new paths, while the independent consume planner
  still treated them as unknown. Its safe default widened rather than skipping, so guarantees were
  preserved but the promised dependency-aware explanation and efficiency were inconsistent.
- **Systemic fix:** classify only the exact runtime-exclusion authority and its mutation verifier as
  having no consumer-byte effect. Direct consume-plan and common-impact assertions require browser
  invalidation, zero invented contract/VRT/consume impact, and continued full widening for unknown
  paths. No production-full or D1 consume requirement changed.

## 2026-07-30 — Exact Vitest identities could disappear without terminal accounting

- **High finding:** source verification counted `pasteTest(...)` descendants even when one or all
  registrations were unreachable, conditional, deferred, or shadowed. Receipt freeze also accepted
  an approved identity absent from both the excluded and required-passed universes. Consequently an
  empty exclusion manifest could falsely resemble Firefox capability recovery.
- **Root cause:** exact identity allowlisting proved which skips may be accepted, but did not prove
  that each reviewed test was actually registered and terminally accounted for.
- **Systemic fix:** bind one direct imported Vitest `test`, one exact `test.skipIf` declaration, and
  five exact direct top-level registrations. Independently require every applicable identity exactly
  once as reporter-excluded or independently listed and passed. Dead/conditional/deferred/shadowed/
  aliased/computed/reflective registration, partial or total disappearance, duplicate accounting,
  and false zero-exclusion recovery fail by mutation. A genuine recovery passes only when all five
  exact leaves are listed and execute successfully.
- **Evidence boundary:** focused source, runtime, receipt-freeze, and 61-fixture operator-document
  suites pass. The previous adversarial closure and failed full-ship sample remain superseded until a
  fresh unchanged-scope review and exact-tree full ship complete.

## 2026-07-30 — Full contracts passed but serialized a noncanonical route order

- **Symptom:** terminal ship run
  `2026-07-30T04-44-21.761Z-ship-f662f64a-d828-4b51-a6fb-ecdce4acd6e5` passed every substantive
  lane and all 108 routes / 864 contract leaves, then correctly failed evidence freeze with
  `scope routes disagree with the independently planned route universe`.
- **Root cause:** full mode copied registry-order `COMPONENT_ROUTES`; scoped mode sorted its set and
  receipt validation canonicalized its independent universe. The route sets were equal but the full
  report was not byte-canonical. The previous one-route producer fixture could not expose ordering.
- **Systemic fix:** the runner now sorts both full and scoped route authorities before count, leaf,
  execution, and report construction. A full `--all --dry-run` fixture requires 108 canonically
  sorted routes and 864 expected leaves; the pre-fix producer fails that assertion.
- **Evidence boundary:** the failed 31m20s run is retained measured diagnostic evidence only. Its
  substantive passes cannot be recovered into a receipt; a fresh exact-tree full ship is required.

## 2026-07-30 — PR receipt guard imported an uninstalled parser

- **Symptom:** the first real PR run, `30535403126`, failed before receipt verification because
  `classify-change.mjs` reached `smoke-scope.mjs`'s top-level `typescript` import. The receipt-first
  job intentionally has no dependency installation; downstream `verify` was correctly skipped.
- **Root cause:** local parser-backed selection and pre-install scheduling classification shared one
  module boundary. Local tests inherited workspace `node_modules`, so none reproduced the runner.
- **Systemic fix:** a dependency-free classifier rederives registry smoke closure and consumes the
  generated Vitest comparison only when its contract, pinned toolchain, complete byte content, file
  type/mode, and symlink digest are current. Missing, stale, malformed, unmodelled, or disagreeing
  evidence widens. A clean clone with no `node_modules` now tests both an empty range and a changed
  registry source whose stale shadow must select full smoke.
- **Evidence boundary:** run `30535403126` remains failed evidence. No rerun can repair it, and the
  previous production-full receipt cannot cover this tracked fix; a fresh exact-tree ship is required.

## 2026-07-30 — Dependency-free classifier reported a narrower scope than it scheduled

- **Medium finding:** exact range `8e4c2897..480611a6` scheduled smoke because contract/route scope
  widened to all, but serialized `smoke_scope: "0 test file(s)"` and the narrower registry/Vitest
  reason. Coverage still ran; the machine/operator explanation was false.
- **Second medium:** malformed/conflicting mutations covered the installed parser-backed selector,
  not the newly separated pre-install authority. Scratch attacks widened safely but were not retained
  as executable regression evidence.
- **Low hardening:** `existsSync` followed dangling symlinks before `lstatSync`, collapsing different
  missing targets to one `missing` digest.
- **Systemic fix:** scope/reason now derive from the effective metadata → route → dependency widening
  chain. A no-dependency 27-assertion suite covers clean, stale, malformed, conflicting, invalid,
  global, and unknown cases. Digest construction uses `lstatSync` with explicit `ENOENT`, preserving
  dangling link type and target. The 0-high/2-medium/1-low review is superseded, not closure evidence.
