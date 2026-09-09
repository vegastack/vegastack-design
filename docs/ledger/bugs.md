# BUGS LEDGER

Every bug found + root cause + fix. Append-only.

---

## 2026-09-09 — The geometry lane sweeps every fixture and found 15 pre-existing 24px/reflow defects

- **Symptom:** WP1 (#69) moved the reflow, RTL and effective-24px-target contracts into
  `packages/ui/test/geometry.browser.test.tsx`, which mounts every export of
  `apps/docs/components/preview/` — 522 fixtures — instead of the old lane's first fixture per
  route (~4.6× the compositions). Fifteen fixtures failed assertions carried over verbatim from
  `contracts.spec.ts`. None was ever measured before, so none is a regression.
- **Where they are recorded:** per assertion in the file's `EXCLUDED` map, which still EXECUTES each
  excluded assertion in expect-failure mode — an exclusion whose defect is fixed turns the fixture
  red with "the assertion now PASSES … the exclusion is STALE", so the map cannot go stale silently.
  Removing an entry is the act of claiming the fix.
- **Measurements (Chromium, 320px reflow / 1280px target probe, compiled token CSS):**
  - reflow + RTL: `scrollFadeEdge`, `scrollFadeSize` — two side-by-side scroll panels,
    scrollWidth 332 > clientWidth 320 (a demo-layout overflow, not the utility).
  - 24px size floor: `breadcrumbCollapsed`, `breadcrumbEllipsisMenu`, `breadcrumbTrail` — the
    ellipsis/collapsed-crumb trigger measures 20.00×20.00; `datePickerDropdownCaption` — caption
    dropdown 50.36×21.00; `iconText`, `iconTextSides` — focusable truncation trigger 206.00×21.00;
    `markerLinkButton` — marker link 270.00×21.00; `messageScrollerVisibility` — control 99.00×16.00;
    `stepperVertical` — vertical step 152.08×23.00; `tabsChip` — chip tab 237.97×21.00.
  - 24px obstruction (5-point probe, 0.5px inset): `actionBarPending` — the pending ActionBar
    surface owns its own control's centre, 5/5 misses; `attachmentImageThumbnail` — the
    `absolute inset-0` trigger covers the 24×24 action beneath it, 5/5; `resizableNested` — nested
    handles overlap, the outer handle's centre is owned by the inner one, 3/5; `timeline` — the
    separator marker owns the centre of the adjacent 63.4×16.0 link, 1/5.
- **Not a defect, unswept:** `relativeTimeLive` re-renders on its own timer; every other
  `relative-time` fixture pins `now` and is swept.
- **Ownership:** component work for the audit epic #31's end round, routed per owning batch; the
  rebuild did not touch component sources. Fix at the component (invisible ≥24px hit area or a real
  24px control), then delete the map entry — the expect-failure guard forces that order.

## 2026-09-09 — `docs-shell.spec.ts` asserted two properties the built site does not have, and no gate ever ran it

- **Found while** restoring the five docs-shell assertions WP3 deleted, as
  `tooling/verify-docs-shell.mjs` (release stage). Re-implemented faithfully from
  `origin/main:apps/docs/vrt/docs-shell.spec.ts`, **two of the five failed immediately** against a
  fresh `SITE_VISIBILITY=public` export of that same tree.

- **1. The background-isolation probe read the wrong node.** The spec asserted
  `article.closest("[aria-hidden='true']") !== null` once the fullscreen preview is open. Measured
  against `@base-ui/react` 1.6.0: the two isolation markers land at **different depths** — the
  outside subtree ROOT (`#nd-docs-layout`) gets `data-base-ui-inert`, while `aria-hidden="true"` is
  applied to the outside elements one level in, i.e. the article's own children (`H1`, `P`,
  `H2#installation`, …) and never to `<article>` itself. So `article.closest(…)` is `false` on a
  correctly isolated page. Fixed by probing `article h1` for the AT marker and `article` for the
  inert marker.

- **2. The fullscreen focus trap does not hold — OPEN DEFECT.** The spec's 25-step Tab walk allowed
  only `dialog`, `guard` and `body`. Measured on a fresh public export of this tree, four
  consecutive runs of the same walk (`D`=dialog, `g`=Base UI focus guard, `chrome`=a body-level
  anchor outside the docs layout, `NAV`=inside `#nd-docs-layout`):

  ```
  run 0  D g body chrome chrome D D g body chrome D D g body chrome chrome chrome D D g body chrome chrome chrome D
  run 1  D g D D g body D D g body chrome D D g body chrome chrome chrome NAV D g body chrome chrome D
  run 2  D D g body chrome chrome chrome NAV NAV NAV D D g body chrome D D g body chrome chrome chrome NAV D g
  run 3  NAV D D g body chrome chrome chrome NAV NAV NAV NAV D D g D D g body chrome chrome chrome NAV D D
  ```

  Focus leaves the dialog in **every** run and reaches the docs **navigation** in three of four.
  Mechanism: Base UI 1.6.0 `aria-hidden`s outside elements but never sets `inert`, so they stay in
  the tab order, and the inside guard drops focus to `<body>` instead of cycling — from which Tab
  restarts at the top of the document. Deterministic in _that_ it leaks, non-deterministic in
  _where_.

  **Not fixed here, and not asserted here.** The fix is a shell change (make the outside subtrees
  genuinely untabbable while a modal is open) or a Base UI upgrade, neither of which belongs in a
  verification PR. Asserting it would ship a permanently red release gate; asserting a
  watered-down version would ship a false coverage claim — the exact failure mode of the
  forced-colors focus check. So `verify-docs-shell.mjs` asserts the two DC-03 halves that DO hold
  (background isolation and its release on close, Escape) and prints a `! NOT ASSERTED` line naming
  this defect on every run, pass or fail.

- **Root cause of both: the file was executed by no gate.** It was the `@vegastack/docs` `test`
  script, reachable only through a root `pnpm test` that nothing in the ladder or in CI ran — the
  hooks ran `gates:push` (unit + smoke + contracts) and no CI runner launched a browser. A spec that
  nothing runs drifts silently; both defects above predate WP3 and neither was ever reported.

- **Fix.** `tooling/verify-docs-shell.mjs`, wired into `pnpm verify:release` right after
  `docs lint:links (public)`, with a `--self-test` in the same stage that injects nine defects (at
  least one per assertion) and requires each to be rejected. Reproduction for the open focus leak:
  `SITE_VISIBILITY=public pnpm -F @vegastack/docs build`, then open
  `/docs/components/button`, click "Fullscreen preview", and press Tab six times.

---

## 2026-09-08 — The `relative-time` 320px contract fails nondeterministically under the full sweep

- **Symptom.** `/docs/components/relative-time contains its primary fixture at 320px` fails with
  `locator.scrollIntoViewIfNeeded: Element is not attached to the DOM` — but only in the FULL
  110-route sweep, and in a **different subset of Chromium projects each run**. It blocks
  `pnpm gates:push` for any change whose scope is global, so no such change can produce a receipt.
- **Proven pre-existing, not caused by any branch.** Four runs on the Ryzen `gates2` box:
  - `origin/main` @ `9c33dfaf`, unmodified — that one route in isolation: **8/8 pass**.
  - `origin/main` @ `9c33dfaf`, unmodified — `pnpm contracts:all` (880 checks): **1 failed**,
    `chromium-dark`.
  - `audit/f1-docfix` (docs/doctrine only) — `gates:push` full sweep: 3 failed — `chromium`,
    `chromium-dark`, `mobile-chromium`.
  - `audit/f1-docfix` — the same sweep rerun: 2 failed — `chromium-dark`, `mobile-chromium`.

  The unmodified base fails the identical check, and the failing project set varies run to run: this
  is a race, and it is on `main`.

- **Root cause: the probe races the component's own clock.** `relative-time.tsx` runs a
  self-rescheduling `setTimeout` that calls `setClock`, so the fixture re-renders on a timer.
  `contracts.spec.ts:269-271` resolves `page.locator("[data-vrt-preview]").first()`, asserts it
  visible, then calls `scrollIntoViewIfNeeded()`, which waits for the element to be _stable_. Under
  the loaded parallel sweep a tick lands inside that window and the handle goes stale. Isolated, the
  machine is fast enough that the window closes before a tick arrives — which is exactly why an
  isolated rerun "proves" nothing here and the sweep is the only place it shows.
- **Corroborated structurally: the detaching node is a Fumadocs `<Tabs>` panel child.**
  `apps/docs/components/component-preview.tsx:75-87` puts `data-vrt-preview` on a `div` INSIDE
  `<Tabs>` (`fumadocs-ui` 16.11.5) — a client tab host that can remount its panel, so the measured
  node is detachable for reasons that have nothing to do with the component under test. Two things
  follow. First, a `RelativeTime` `dateTime`-hydration change was tried and did NOT stop the failure,
  which is what rules the component out as the sole trigger. Second, the same detach window is open
  on **every** contract route, not just the ones whose fixture keeps a timer — which is the second
  reason the fix belongs in the probe. Confirming the exact remount trigger inside `<Tabs>` would
  need a `MutationObserver` probe on the box and is not worth a sweep slot; it would change nothing
  about the fix.
- **Systemic fix — the probe, not the fixture.** Fixed at the root in `apps/docs/vrt/contracts.spec.ts`
  (the 320px reflow check): the bare `await fixture.scrollIntoViewIfNeeded()` is now a bounded retry —
  `expect.poll` around a 2s-timeout scroll that swallows the detachment and lets the locator re-resolve
  on the next attempt. A Playwright locator is lazy and re-resolves per action, so the retry lands on
  the fixture's post-re-render element instead of a stale handle. This is deliberately a fix to the
  PROBE and not a pin on `relative-time`: every fixture that legitimately re-renders on its own timer
  hits the same window, so pinning one component's clock would leave the trap armed for the next one.
- **What it did NOT change.** The assertions are untouched — the scroll is a setup step for the
  `scrollWidth <= clientWidth` reflow check, which still fails on a real 320px overflow, and the RTL
  containment and 24px target-floor checks are unmodified. The `.first()` fixture selection is left
  alone; that remains **G1-b (#49)**'s call. No timeout was widened and nothing retries an assertion:
  only the scroll setup step retries, which is why this is not "re-run until green" — the same failure
  mode the VRT baselines were deleted for.

## 2026-09-07 — `design:sync:check` cannot see prose that names a deleted token

- **Symptom.** F1 deleted `track`, `--alpha-surface-subtle`, `--alpha-fill-hover` and
  `--alpha-input-hover`, and every gate stayed green while six documents kept teaching them:
  `design.md` named `track` as the switch off-track, `theming.mdx:63` and `colors.mdx:171` both
  taught `bg-primary/(--alpha-surface-subtle)` as the canonical override example, and the internal
  token skill described `surface-1` as covering "every well/track". A reader following the guides
  would have written a class that compiles to nothing — Tailwind emits
  `color-mix(… var(--alpha-surface-subtle) …)` for an undefined variable and the wash silently
  vanishes. Found by a post-merge Codex review, not by any gate.
- **Root cause: `tooling/sync-design-md.mjs` verifies the GENERATED regions and nothing else.** It
  reconciles the resolved-token tables, the recipe references and the foundation tables — surfaces it
  writes itself — so a token that disappears from `dist/theme.css` disappears from those tables too
  and the check stays green. The **hand-authored prose** around them, in `design.md`, the foundations
  MDX and the skills, is never cross-referenced against the built token set. Deleting a token is
  therefore the one token change with no failing gate anywhere: adding or retuning one moves a
  generated table, but removing one only invalidates prose.
- **Same class as the `class-histogram` blind spot**: a gate that regenerates its own evidence, or
  only checks what it generates, cannot catch a claim it never reads.
- **Fix applied here is manual** — every occurrence corrected by grep across `design.md`, the
  foundations MDX, the component MDX and both skill trees.
- **Recommended structural fix (for G1-b): a token-reference lint.** Walk `design.md`,
  `apps/docs/content/docs/foundations/*.mdx`, `apps/docs/content/docs/components/*.mdx` and
  `skills/{internal,public}/**`; extract every `--*` custom property and every backticked semantic
  token name; fail on any that is absent from `packages/design-tokens/dist/theme.css`. It must run
  inside `pnpm design:verify` so it is one of the rows CI **re-executes** for free rather than an
  attested one. Two carve-outs are needed and should be explicit, not inferred: an allowlist for
  historical records that name a token precisely _because_ it was deleted (`/CHANGELOG.md`, the
  generated `changelog.mdx`, `docs/plans/**`, `docs/audits/**`, `design-v1.md`), and for consumer-side
  examples that define their own variables. Like every other gate here it needs a negative fixture —
  a file naming a nonexistent token, proving the lint fails — or it is an assumption.

## 2026-09-07 — 439 reduced-motion effects with no dependency array, and a reduced-motion assertion that could not fail

Two defects in the same contract, found while replacing the per-icon controllers with one factory
(issue #46). They are recorded together because the second is why the first survived so long.

### (a) The effect ran after every render

- **Symptom:** every one of the 439 mirrored icons carried
  `useEffect(() => { if (shouldReduceMotion) stopAnimation(); });` — no dependency array, so the
  effect ran after **every** render of every icon. On the docs icons page that is 439 effects per
  render pass, each closing over a fresh `stopAnimation`.
- **Root cause:** the generator emitted the effect without a dependency list
  (`tooling/mirror-animated-icons.mjs`, `addReducedMotionEngine`). Because the icons were generated,
  the mistake was made once and copied 439 times — which is the structural argument for the factory,
  not merely a tidiness one.
- **Fix:** the effect now lives once in `createAnimatedIcon` with `[shouldReduceMotion,
stopAnimation]`, where `stopAnimation` is a `useCallback` over stable inputs. `[]` alone would have
  been wrong in the other direction: it would stop settling the icon when the preference changes
  mid-session, which is the behaviour the gate requires.
  `tooling/verify-animated-icons.mjs` now fails if that effect has no dependency array or does not
  depend on `shouldReduceMotion`, and its `--self-test` proves that failure.

### (b) The reduced-motion test could not fail (pre-existing fail-open)

- **Symptom:** `animated-icons.test.tsx`'s "reduced motion keeps imperative playback in the immediate
  resting state" passed whether or not reduced motion was actually in effect.
- **Root cause, two independent reasons:** (1) the test forced the preference with
  `vi.spyOn(window, "matchMedia")`, but Motion resolves `useReducedMotion()` from a **module-level
  singleton** captured when the module is first imported — before any test body runs — so the spy
  never reached it; and (2) the assertion compared `path.getAttribute("style")`, which does not
  change during a `pathLength` stroke-draw animation, so it would have held even with motion running.
  Reproduced by asserting on `path.outerHTML` instead: the icon animated under a "reduced" mock.
- **Fix:** the factory subscribes to `(prefers-reduced-motion: reduce)` itself, through
  `useSyncExternalStore`, and reads `MotionConfigContext` for the `<MotionConfig reducedMotion>`
  override. (Two intermediate fixes were wrong: `useReducedMotionConfig()`, and then a two-way
  `MotionConfig` override — see (c) and (d) in the entry below.) That is both the stronger contract
  and a seam a test can actually drive. Five tests now cover it: hover suppressed, handle suppressed,
  an un-configured tree with the preference off as a **negative control** so a green set cannot come
  from a probe that never animates, a live media-query transition in both directions, and the
  un-configured tree with the preference ON.
- **Rider:** the browser-unit suite renders without the compiled stylesheet, so the new host-element
  assertion checks the `inline-flex` class rather than the computed `display`. The rendered box is
  the pixel lane's job, not this suite's.

---

## 2026-09-07 — Three more in the same corpus: a fail-open gate, a touch-inert gallery, and a "live" preference that was not live

Found by the Codex adversarial round on PR #57, all three reproduced before being fixed.

### (a) The animated-icon gate could not see a hand-edited module (fail-open)

- **Symptom:** changing one digit of Bell's glyph path (`…3 9 3 9H3` → `…3 8 3 9H3`) left
  `node tooling/verify-animated-icons.mjs` fully green across all 439 icons.
- **Root cause:** `packages/ui/animated-icon-sources.json` pinned `sha256` of the bytes **fetched
  from upstream**, and the verifier only checked that those hashes _looked like_ SHA-256. Nothing
  bound the pinned upstream data to the module generated from it. Every other assertion in the gate
  is a schema check, and a hand-edited path is still schema-valid — so the corpus half of the gate
  was decorative.
- **Fix:** the manifest carries `moduleSha256` per icon — the hash of the generated module body with
  the `registry:build` provenance header excluded, which is exactly the slice the mirror compares
  when deciding a file changed — and `verifyIcon` recomputes it from disk on every run.
  `tooling/mirror-animated-icons.mjs` stamps it on every write run and verifies it under `--check`.
  Two of the now-fifteen `--self-test` mutations exist solely to prove nothing else catches this: a
  glyph-path edit, and a timing edit that uses a **sanctioned** duration so the Motion-vocabulary
  check cannot be what rejects it. Confirmed against live upstream: `mirror --check` regenerates all
  439 modules byte-identically and agrees with every stamped hash.

### (b) The docs icon gallery was inert on touch

- **Symptom:** on a touch device, no tile in the 439-icon gallery ever animated.
- **Root cause:** `AnimatedIconCard` drives its icon through a ref, and attaching a ref flips the
  icon into controlled mode — which suppresses **all** of its own triggers, including the touch
  `pointerdown` tap driver, not just the hover it was suppressing on purpose. The card re-provided
  mouse-enter/leave and focus/blur but not `pointerdown`, and a touch device has neither hover nor
  focus, so there was no driver left at all.
- **Fix:** the card wires `onPointerDown` (and switches to pointer events for enter/leave) under the
  same pointer-type rules the factory applies. The old coverage was a hand-retyped copy of the
  tile's markup, which could not have caught this; it is replaced by tests that render the real
  `AnimatedIconCard` and play it through hover, focus and tap, with an untouched tile as the
  negative control.

### (c) "Reduced motion updates live" was false

- **Symptom:** an icon already on screen kept animating after the OS preference was switched on.
- **Root cause:** Motion 12.42.2's `useReducedMotion()` is `useState(prefersReducedMotion.current)`
  with no subscription — its own source carries a standing `TODO` about this — and
  `useReducedMotionConfig()` layers `<MotionConfig>` over that same one-shot value. The dependency
  array added in the entry above was correct, but the dependency it watched could never change.
- **Fix:** `useSyncExternalStore` over a `matchMedia("(prefers-reduced-motion: reduce)")` change
  listener, SSR snapshot `false`, combined with `MotionConfigContext` so an explicit
  `reducedMotion="always"` still wins. (This fix also read `"never"` as an override, which was itself
  a defect — see (d).) Proven by a test that stubs `matchMedia` with
  dispatchable listeners and moves the preference in both directions while the icon is mounted, and
  that asserts the listener is removed on unmount. The verifier now asserts each half of the
  mechanism separately and rejects an import of either Motion hook.

### (d) …and reduced motion was not honoured **at all** without a `<MotionConfig>`

Found while verifying the fix for (c): the live-transition test failed on the first run, with the
icon animating under a `matchMedia` stub reporting `reduce`. Not a flake, and not the harness — the
fix for (c) was wrong.

- **Symptom:** with the OS preference set and no `<MotionConfig>` anywhere in the tree — the tree
  almost every consumer actually has — icons animated normally. The docs page promised the opposite
  in as many words: "no `MotionConfig` is required for VegaStack icon safety."
- **Root cause:** `MotionConfigContext`'s **default value** is
  `{ transformPagePoint, isStatic: false, reducedMotion: "never" }`. Motion does not reduce motion
  unless an app opts in with `reducedMotion="user"`. So the override branch
  `if (reducedMotion === "never") return false;` fires on every un-configured tree and the preference
  is never read. This was true of the ORIGINAL implementation too: `useReducedMotionConfig()` has
  that exact branch, so the earlier "fix" that adopted it (entry above, and the first commit of this
  PR) had silently disabled reduced motion for icons rather than strengthening it. Three separate
  reduced-motion tests were green throughout, because every one of them mounted a `<MotionConfig>`.
- **Why it cannot simply be repaired:** `MotionConfig` merges over its parent config, so an explicit
  `<MotionConfig reducedMotion="never">` and no provider at all yield identical context values.
  There is no public way to distinguish "the consumer opted out" from "the consumer configured
  nothing".
- **Fix:** the override is now **one-way**. `reducedMotion === "always"` forces reduction; every
  other value, the default included, falls through to the live OS preference. Losing the
  animate-anyway escape hatch is the deliberate cost — it is the branch that cannot be told apart
  from silence, and defaulting it against the user's stated preference is an accessibility failure,
  while defaulting it toward them is not.
- **Coverage that would have caught it, now present:** an icon rendered with the preference on and
  **no `<MotionConfig>`**, and a second asserting `<MotionConfig reducedMotion="never">` cannot
  defeat the preference. The verifier now _rejects_ a `reducedMotion === "never"` branch in the
  factory and requires the preference to be the fall-through value; a fifteenth `--self-test`
  mutation re-adds that branch and proves the gate rejects it.

### (e) Observed in passing, NOT fixed here: `/docs/components/relative-time` flakes in a full contract sweep

Not an icon defect and not caused by this branch — recorded so the next person who sees it does not
re-diagnose it, and because a race that flakes under load is a real race.

- **Observed:** `pnpm gates:push` on this branch went full-sweep (a global surface changed) and 4 of
  880 checks failed — the same assertion in all four Chromium projects:
  `/docs/components/relative-time contains its primary fixture at 320px`, failing at
  `fixture.scrollIntoViewIfNeeded()` with `Element is not attached to the DOM`, one line after
  `await expect(fixture).toBeVisible()` had passed.
- **Why it is not this branch:** `relative-time` imports nothing from
  `@vegastack/design/create-animated-icon`, renders no animated icon, and none of its files are
  touched here. Re-running that route in isolation on the identical tree passed 8/8 in 22s.
- **Mechanism:** `relative-time` reschedules a `setTimeout` on an adaptive interval that goes down
  to ~1s near the target, and also flips `hydrated` in an effect on mount. Under a 110-route sweep on
  a loaded shared box, a tick lands between `toBeVisible()` and `scrollIntoViewIfNeeded()` and
  replaces the node the locator resolved. Under no load the window is too small to hit — which is
  exactly why it only appears in the full sweep.
- **Not fixed on this branch in the end — main got there first.** This branch did carry a spec-side
  fix (re-resolve the fixture and retry the scroll under `expect(...).toPass()`), because the first
  re-run of the full sweep reproduced it (2 failures instead of 4): it is not an occasional flake but
  a race that lands on essentially every full sweep, and it therefore blocks the gate receipt for
  _any_ change touching a global surface, not just this one. While this PR was in review the F1
  follow-up (`065315d5`, #59) landed the **same fix by the same mechanism** on `main` — a bounded
  `expect.poll` retry around `scrollIntoViewIfNeeded`, with the component untouched. On the rebase
  onto that main, this branch's version was dropped and main's kept, so there is exactly one
  implementation. The full entry for it is the 2026-09-08 record at the top of this file.
- **Why the spec and not the component:** the contract lane must tolerate fixtures that legitimately
  re-render, or every future self-updating component becomes unverifiable. Both branches reached that
  conclusion independently.

---

## 2026-09-07 — Making a leaf server-safe silently breaks its Story explorer

- **Removing `"use client"` from a storied component broke `next build`.** Dropping the directive
  from `avatar`, `button`, `progress`, `separator`, `slider` and `toggle` turned each into a plain
  server function. `@fumadocs/story` (1.2.0) builds `{ Component, displayName, presets }` in the
  story module and hands it to its OWN `"use client"` `WithControl` renderer — and only a _client
  reference_ survives that boundary. The export failed prerendering `/docs/components/avatar` with
  `Functions cannot be passed directly to Client Components`, naming the offending `Component` key.
  Both of the package's `defineStory` variants (the build-plugin one in `dist/client/compiled.js` and
  the RSC one in `dist/index.js`) pass `Component` across that boundary, so there is no server-safe
  path in this version. **Fix:** re-export through a `"use client"` shim
  (`apps/docs/components/stories/<name>.client.ts`) — the pattern already in the tree for
  `label`/`kbd`/`skeleton`/`spinner`/`status-icon`/`textarea`/`progress-indicator`, and for
  `switch`/`checkbox` via `story-shims.tsx`. The docs Explorer, not the component, owns that
  boundary; no canonical source changed. After rebasing onto Do1-a (which retired 24 Explorers under
  DD-3), only `slider` still has one, so `slider.client.ts` is the single shim this batch ships — but
  the trap is unchanged for the six Explorers that remain.
- **Why no gate caught it.** `verify-rsc-safety`, `verify-ui-use-client`, `design-lint`, `typecheck`
  and the 864 behaviour contracts were all green — the failure only exists in the static export, and
  the docs build is not in `gates:push`. **Rule of thumb:** deleting a `"use client"` directive is a
  distribution change; run `pnpm --filter @vegastack/docs build` before believing it, and check
  `apps/docs/components/stories/` for a story that names the component.

---

## 2026-09-07 — Two undeclared registry dependencies, surfaced by consolidating the leaves

- **`tooltip` imported `Kbd` without declaring `@vegastack/kbd`; `relative-time` imported
  `TruncatedText` without declaring `@vegastack/truncated-text`.** Both appeared the moment B2-07
  made `TooltipKbd` render the real `Kbd`, and B2-04 gave `RelativeTime` the shared
  `useTruncationFocusable`. `verify-registry-deps` caught them inside `registry:build` and blocked it
  — exactly the fail-closed behaviour intended, and worth recording because it is the failure mode a
  consumer would have hit as a missing module after `shadcn add @vegastack/tooltip`. **Fix:** both
  `registryDependencies` arrays now declare the item they import. The lesson for anyone consolidating
  two components into one: a new cross-component import is a distribution change, not just a code
  change.

- **A doctrine paragraph asserted two `motion-reduce:` copies were load-bearing when they are not.**
  While writing the reduced-motion rule this batch claimed `board`'s and `sortable-list`'s
  `motion-reduce:data-drag-pending:animate-none` had to survive because the global reset does not
  cover them. It does: the reset sets `animation-duration: 0.01ms` and `animation-iteration-count: 1`,
  and `animate-pulse`'s keyframes are `opacity: 1` at both 0% and 100%, so a single 0.01ms iteration
  already lands on exactly the frame `animate-none` would. Both were deleted and `design.md` was
  corrected. One copy WAS load-bearing — `staggered-text-reveal`'s
  `motion-reduce:[animation-delay:0s]`, because the reset zeroed duration but not `animation-delay`,
  so a reduced-motion reader still watched the words arrive one at a time across the full stagger
  window. That is a hole in the reset, not a property of the component: **fix:** the
  `prefers-reduced-motion` block now also sets `animation-delay: 0s !important` and
  `transition-delay: 0s !important`, and the component's copy went with the rest. The registry now
  contains zero `motion-reduce:` utilities. **Rule of thumb:** if a component seems to need its own
  `motion-reduce:` variant, the global reset is missing a property — widen the reset, do not grant an
  exception. A duration-only reset is an incomplete one; delay is motion too.

---

## 2026-09-08 — The 24px floor never saw the combobox chips, and Tag's hit area never existed

- **`ComboboxChipRemove` shipped a 16px target with no expansion at all** (`combobox.tsx`,
  pre-T2): `size-4` with no `::before`, no padding, nothing. That is a straight WCAG 2.5.8 failure
  in shipped code, and the contract lane's target-floor probe never saw it — the probe measures
  `page.locator("[data-vrt-preview]").first()`, and `/docs/components/combobox`'s first fixture is
  `comboboxGroups`, which has no chips. **Root cause: one fixture per route.** Fixed at the
  component (every chip's remove control is now `ChipRemove`, a real 24×24 `IconButton`) and
  narrowly at the gate: `contracts.spec.ts` gained an `EXTRA_TARGET_FIXTURES` map that probes named
  non-first fixtures, with `comboboxMultiple` as its first and only entry, and a guard that fails
  when a named fixture exposes no control (a scope that matches nothing must not pass silently).
  Probing EVERY fixture on every route is the root fix and stays G1-b's, because it surfaces
  defects across many components at once — see the 2026-09-07 entry above, which measured 12
  failures from moving the probe by one fixture.

- **`Tag`'s remove control had a hit area that was measurable and un-hittable.** It used
  `before:absolute before:-inset-2` on a native `<button>`. Tailwind Preflight sets
  `appearance: button`, and Chromium clips a nested `<button>`'s generated content to its own
  border box — so `getComputedStyle(el, '::before')` reported a 24px box that `elementFromPoint`
  never resolved to the control. `filter-bar.tsx` had already discovered this in situ and worked
  around it by growing the real box with compensating margins, complete with a twenty-line comment;
  `tag-group.tsx` never got the memo, and nothing tested it, because the assertion available in the
  CSS-less unit harness is `getComputedStyle` — which reports the lie. **Fix:** `ChipRemove`'s real
  border box is 24×24 for every chip, and `chip.test.tsx` proves it with a style-mirror plus a real
  `elementFromPoint` hit that then fires `onRemove`. A pseudo-element hit area on a native
  `<button>` is now a known-bad pattern: grow the real box.

- **Five live regions were mounted, but their state was in the wrong place.** Each of the
  hand-rolled `{ text, seq }` announcers held its state in the HOST component, so every
  announcement re-rendered the whole DataGrid / Board / drop surface — invisible in tests, real on
  a thousand-row grid. `useAnnouncer` keeps the state in a per-hook store that only the region
  subscribes to. Same visible behaviour, one `<span>` re-rendered instead of a grid.

---

## 2026-09-07 — Two defects the audit did not name, found while building the surface ladder

- **A light-only alias leaks the light value into `.dark`.** `chart-single` was authored once, in
  `semantic.tokens.json`, as `{foreground}`. Style Dictionary resolves an alias **per run**, and the
  dark run only emits the variables its own source file declares — so `.dark` inherited the LIGHT
  `--chart-single` (near-black ink) through the cascade and a single-series chart in dark mode drew
  a black line on a dark card. Caught by the token contrast gate, not by eye. **Fix:** any semantic
  token whose alias target is itself theme-split must be declared in BOTH source files; `chart-single`
  now is, with a comment saying why. Anything added later that aliases `foreground`, `primary` or
  `card` needs the same treatment — the gate is the safety net.

- **The toaster mirror is not covered by `registry:build`.** `packages/ui/src/provider/toaster.tsx`
  must byte-match `packages/ui/registry/ui/sonner.tsx` (minus the provenance header), but nothing in
  `pnpm registry:build` writes it — only `tooling/sync-toaster-mirror.mjs` does, and only
  `pnpm design:verify` checks it. So a component change to `sonner.tsx` leaves a clean
  `registry:build && git status` **and** a green pre-commit, and fails later in `design:verify`.
  Hit exactly that in this batch. Not fixed here (the gate scripts are G1-a's file boundary), but it
  is a real fail-late: the mirror sync belongs inside `registry:build` alongside the copy-in
  generation, or the check belongs in the pre-commit gate.

---

## 2026-09-07 — The 24px target floor is measured on ONE fixture per route, and three heroes fail it

- **Symptom (found, not fixed, by Do1-a):** routing the frontmatter hero through
  `ComponentPreview` (DC-05) gave the hero a `data-vrt-preview` key. `contracts.spec.ts` probes
  `page.locator("[data-vrt-preview]").first()` — **one** fixture per route — so the hero became the
  probed fixture on all 110 routes, and `pnpm gates:push` went from green to **12 failures**:
  `/docs/components/timeline`, `/docs/components/data-grid` and `/docs/components/text-edit`,
  in all four Chromium projects, on "effective 24px pointer targets". Example, verbatim:
  `interactive control 0 on /docs/components/timeline must own a centred >=24px effective pointer
target (visual 64.4×16.0px)` — the hit lands on `<li data-slot="timeline-separator">` rather than
  a control of its own.
- **Not caused by the type-scale fix.** Removing the DC-01 `font-size`/`line-height` lines from
  `.vs-type-product` and re-running the three routes reproduced all 12 failures unchanged, so the
  smaller inherited base is not the mechanism. `main` at 6f11a4bc (this branch's merge-base at the time) passed 24/24 on the same
  three routes, which places the change on this branch.
- **Root cause, in two parts.** (1) The blocking lane measures a single fixture per route, so which
  fixture carries the probe key silently decides what is verified — a chrome change moved it for
  every component at once. (2) The hero fixtures `timeline`, `dataGrid` and `textEdit` genuinely
  fail the 24×24 floor, and had never been measured because they are not among the body examples
  those three pages document (button and dialog, by contrast, document their hero fixture in the
  body, so they were already covered).
- **What Do1-a did:** the hero keeps identical frame chrome but does NOT take the probe key
  (`ComponentPreview hero`). Coverage is unchanged from `main` — the documented example fixture is
  probed exactly as before. To be precise about the mechanism: nothing _chooses_ which fixture the
  lane measures. `.first()` takes whichever element carries `data-vrt-preview` first in DOM order,
  and the hero renders above every body example, so it would have taken the probe on every route.
  Keeping it out restores the pre-existing selection rather than making the selection a decision;
  making it one is part of the root fix below. Do1-a changed no component source (`git diff origin/main -- packages/ui/registry` is empty), so it cannot fix the three components without colliding with the
  wave-3/4 batches that own them.
- **Open, and owned by the component batches.** Reproduce in one line by dropping `hero` from the
  `<ComponentPreview>` in `apps/docs/app/docs/[[...slug]]/page.tsx` and running
  `node tooling/contracts-run.mjs --routes /docs/components/timeline,/docs/components/data-grid,/docs/components/text-edit`.
  The real fix is an invisible ≥24px hit area on the timeline separator marker, the data-grid row
  checkbox cell, and the text-edit control — the same class the `target-size` axe findings on
  data-grid report.
- **Worth fixing at the root too:** probing only `.first()` means every route has exactly one
  verified fixture no matter how many it documents, and _which_ one is decided by DOM order rather
  than by any authority. That is a coverage ceiling nobody chose; the contract lane should probe
  every fixture the contract lists. Raised for G1-b.

---

## 2026-09-07 — The agent-facing markdown export shipped JSX instead of docs (DS-01)

- **Symptom:** the per-page `.md` route and `llms-full.txt` contained `<AutoTypeTable path=…
name="ButtonProps" />` and `<ComponentPreview name=… file=… />` verbatim. Measured on the built
  export before the fix: the tag survived on **107 of 110** component pages and **260 times** in
  `llms-full.txt`, and 18 pages carried **138 "(no own props)"** placeholder rows. An agent reading
  the docs — the channel this repo tells consumers to use — got zero prop tables and zero example
  source, while a human on the same page got both.
- **Root cause:** `lib/source.ts` called `page.data.getText("processed")` with no components. In
  fumadocs-core 16.11.5 `remarkLLMs` keeps every MDX JSX element in the processed markdown unless a
  `stringify` callback overrides it, so the tags passed straight through. Nothing was broken; the
  rendering step was simply never written. It went unnoticed because **no gate read the export.**
  The docs build asserted the `.md` files existed and were the right size — never that they had
  content an agent could use.
- **Fix:** `lib/mdx-markdown.ts` renders every MDX component to markdown at compile time, or emits
  a placeholder that `lib/markdown-export.ts` resolves at build time for the elements needing the
  file system or the type generator. Both API-table renderers share `getApiDocs()`, so the page and
  the `.md` cannot drift again.
- **Systemic fix — the export is now gated.** `tooling/verify-docs-export.mjs` reads the BUILT
  markdown and fails on any JSX tag outside a code fence, any unresolved placeholder, and any empty
  API table, with a negative self-test proving each check rejects its defect. That, not the
  rendering code, is what stops this recurring: the defect class was "an artifact nobody verified",
  and a second unverified artifact would have gone the same way.
- **Note on the acceptance number.** The audit's acceptance criterion was
  `grep -c "<[A-Z]" apps/docs/out/docs/components/*.md` → 0. That can never hold once the fixture
  source is inlined, because example code legitimately contains `<Button>`. The gate strips code
  fences and inline code first; JSX outside code is the real measure, and it is 0.

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

## 2026-08-27 — A sticky table corner covered a plan action after horizontal scrolling

- **Symptom:** Comparison Matrix passed its component tests, but the narrow contract route failed
  pointer-target checks after the runner scrolled a plan CTA into view. The button existed and was
  visible, yet the blank top-left table corner intercepted its hit point.
- **Root cause:** the empty corner cell and the body row headers shared the same sticky-start
  treatment. Once the table scrolled horizontally, the decorative corner became a raised overlay
  across the action row even though it had no content or interactive purpose.
- **Systemic fix:** the corner retains its column width but is no longer sticky; sticky positioning
  is limited to the feature row headers that need reading context while the matrix scrolls. The
  component test pins the scroll-region contract, the targeted route passes 8/8 checks, and the full
  behavior suite passes 880/880. The class to recognise is a sticky decorative table corner sharing
  the z-layer of interactive column headers without an explicit overlap probe.

## 2026-09-07 — A loading Button lost its accessible name to `visibility: hidden`

- **Symptom:** the F2 rebuild stacked the loading spinner over the label so the button's width would
  stop moving (audit B1-08), hiding the label with `invisible`. The unit suite, design-lint and
  `pnpm lint` all passed; `capture.mjs --routes button` reported `axe=2` — `button-name` (critical)
  on the loading fixture in both themes.
- **Root cause:** `visibility: hidden` removes a subtree from the accessibility tree, not just from
  paint. The button's only text was inside it, so a pending "Save changes" button announced nothing.
  Nothing in the unit lane could see it: axe there runs without compiled CSS, so the label was still
  visible to it.
- **Systemic fix:** the label is hidden with `opacity-0` instead — it keeps its box, keeps its name,
  and the spinner still covers it. A named regression test (`a loading button keeps its accessible
name`) pins the role-plus-name query, which is the assertion that actually fails when a future
  change reaches for `invisible`, `hidden` or `sr-only` here. The class to recognise: **any
  visual-only hide applied to the element that carries a control's accessible name.**

## 2026-09-07 — A `display: contents` wrapper changed how Chromium hit-tests a child SVG

- **Symptom:** after wrapping Button's children in a permanent `<span class="contents">` (so the
  loading spinner could stack over them), `filter-bar.test.tsx`'s `elementFromPoint` probe started
  returning the `<svg>` instead of the `<button>` at a point 1px inside the chip's remove control.
  The 24×24 pointer target was intact; only the element under the point changed.
- **Root cause:** reproduced in isolation — a bare icon child returns `BUTTON` from
  `document.elementFromPoint`, and the identical markup with the icon inside a `display: contents`
  span returns `svg`. Production compiles `[&_svg]:pointer-events-none`, so the real app and the
  contract suite were unaffected; the unit lane runs without compiled CSS and is exactly where the
  difference shows.
- **Systemic fix:** the wrapper is rendered ONLY while `loading`, so the resting DOM is unchanged
  and hit-testing is identical to before. The rule worth keeping: **`display: contents` is not
  layout-neutral for hit-testing**; do not introduce it on a permanent path in a control whose
  pointer target is under contract.

## 2026-09-07 — The state probe's own presses hide the hover it is measuring

- **Symptom:** `probe-states.mjs` flagged 21 of 24 elements on `/docs/components/split-button` as
  `hover-invisible` / `active-same-as-hover`, plus later `popover-trigger`s on color-picker and
  emoji-picker and later `pagination-link`s. The same recipes were clean on `/docs/components/button`.
- **Root cause:** the probe hovers, then `mouse.down()`s, every element in DOM order. Pressing a
  menu or popover trigger OPENS it, and Base UI renders an internal backdrop over the viewport; from
  that point on `loc.hover({force: true})` lands on the backdrop, so `:hover` never applies to any
  later element. The tell is in the data: the FIRST element of each fixture is always clean and
  everything after the first trigger is flagged. A direct hover-only pass over the same elements
  measured a real hover AND a real pressed step on every one.
- **Systemic fix:** none in this change — the probe is an audit instrument, not a gate, and F2 does
  not own `tooling/`. Recorded so the finding is not re-litigated: **`07-state-probe.md` SP-04's
  `split-button-primary` / `popover-trigger` / `sheet-trigger` / `dialog-trigger` rows are suspect
  for the same reason** and should be re-measured with a hover-only pass before anyone "fixes" them.
  The probe should dismiss (Escape) after each press, or skip pressing elements with
  `aria-haspopup`.

## 2026-09-07 — Tailwind's `--color-*` aliases do not follow a nested theme scope

- **Symptom:** the rendered-contrast gate's dark half failed on the new `outline` status buttons with
  four `color-contrast` violations — foreground `#b9031d` (the LIGHT `destructive-text`) on a dark
  ground. The light half passed, the docs captures looked right, and every unit test passed.
- **Root cause:** the Button tone vars were written as
  `[--btn-tint:var(--color-destructive-text)]`. Tailwind's `@theme inline` emits
  `--color-destructive-text: var(--destructive-text)` **once, on `:root`**, so its value is computed
  there. `.dark` redeclares `--destructive-text`, not the alias — and a custom property's value is
  computed where it is DECLARED, then inherited. On a page whose `.dark` sits on `<html>` this is
  invisible; inside a NESTED scope (`<div class="dark">`, `MarketingSurface`, the docs preview theme
  toggle, a portal under `useInternalThemeScope`) the alias keeps the light value while everything
  around it goes dark. Utilities are unaffected — `text-destructive-text` is inlined to
  `var(--destructive-text)` by `@theme inline`, which is exactly the mechanism the alias bypasses.
- **Systemic fix:** every `--btn-*` declaration references the RAW token variable
  (`var(--destructive-text)`), never the `--color-*` alias. `test/button-matrix.browser.test.tsx`
  pins it directly by rendering the same button inside and outside a nested `.dark` and asserting the
  ink differs. The rule: **never reference a `--color-*` alias from an arbitrary property or inline
  style — reference the raw token.** Utilities may keep using the alias; they are inlined.

## 2026-09-07 — The rendered-contrast gate had been measuring unstyled Badges and Alerts

- **Symptom:** found while expanding the fixture for the Button matrix — `packages/ui/test/` is
  outside the package's `tsconfig.json` `include`, so nothing type-checks the compiled-CSS gates.
- **Root cause:** the fixture passed `<Badge color="…">` (Badge's prop is `intent`; `color` does not
  exist) and `<Badge variant="soft">` / `<Alert variant="success">` (neither value is in those
  unions). CVA returns nothing for an unknown variant and an unknown prop is dropped, so those
  specimens rendered as the NEUTRAL badge and alert. The gate reported "no contrast violations" for
  the badge and alert families while measuring the same neutral chip repeatedly. It also still
  rendered `<Button variant="secondary">` after F2 deleted that variant.
- **Systemic fix:** the fixture now uses the real props, so the specimens are the ones the gate
  names. The type hole itself is NOT fixed here — adding `"test"` to the package's `include` surfaces
  a dozen pre-existing errors in sibling files (CSS side-effect imports, `overlay-portal`,
  `stacking`, `surface-ladder`) that belong to other batches in flight. **Left for MK / G1-a**, and
  listed in the F2 PR: an untyped test directory is exactly where a fixture rots into a
  green-but-empty gate.

## 2026-09-07 — The video overlay chrome inverted in dark mode

- **Symptom:** the video player's control bar read as dark-scrim/light-ink in light mode and
  near-white-scrim/near-black-ink in dark — the opposite of what chrome over a video should do, and
  the one place in the system where switching the theme made a surface harder to read rather than
  easier.
- **Root cause:** the scrim gradient and the control ink were built from `primary` and
  `primary-foreground`. Those are theme tokens: `primary` is near-black in light and near-white in
  dark. A video frame is not a theme token — it is whatever the content is — so chrome laid over it
  must not follow the theme at all. Measured in dark before the fix: scrim oklab L **0.92**.
- **Systemic fix:** three theme-invariant tokens (`--media-scrim`, `--media-scrim-strong`,
  `--media-foreground`, landed with F1) are the only colours media chrome may use, and
  `packages/ui/test/media-chrome.browser.test.tsx` asserts against the COMPILED CSS in both themes
  that the scrim resolves under L 0.3 while the overlay ink resolves over L 0.85. The test was
  confirmed to fail when the pre-fix `primary` recipe is restored — a chrome gate that has never
  been seen failing is an assumption, and this one was: nothing had ever measured these surfaces.

## 2026-09-07 — Slider was restyled from outside, so the players owned rules Slider should have

- **Symptom:** `audio-player.tsx` and `video-player.tsx` carried ~60 `[&_[data-slot=slider-*]]`
  descendant overrides between them to build a seek rail, and the hidden-until-hover seek thumb was
  therefore a caller's rule. On a touch device the thumb was hidden with no hover to reveal it —
  there was no scrub handle at all.
- **Root cause:** Slider exposed no variant axis, so every media treatment had to reach through the
  public API into the internals it deliberately does not own. Two callers meant two copies that
  could drift, and neither copy could be tested as Slider behaviour.
- **Systemic fix:** the treatments are Slider's props now (`variant`, `orientation`, `thumb`,
  `marks`, `showValue`), and `thumb="hover"` hides the thumb ONLY under a hover-capable pointer —
  `(hover: none)` and `:focus-visible` both keep it drawn. Zero descendant overrides remain in
  either player (`grep -c "\[&_\[data-slot=slider" → 0`).

## 2026-09-07 — The overlay seek rail rendered at the default thickness (found in M1 review)

- **Symptom:** the video overlay's seek rail rested at 6px instead of 4px, and the "rail thickens on
  hover/focus" affordance it is supposed to have did nothing at all.
- **Root cause:** a cascade tie introduced by the same refactor that moved the media recipes into
  `Slider`. The shared `BaseSlider.Track` declared `data-[orientation=horizontal]:h-1.5`
  unconditionally, and `trackByVariant.overlay` declared `data-[orientation=horizontal]:h-1`. Both
  compile to the same specificity, so the winner is decided by Tailwind's utility sort order (`h-1`
  is emitted before `h-1.5`) rather than by the component — the base won, and the `group-hover` /
  `group-focus-within` thickening then had nothing to thicken from. The code this replaced was
  correct by accident: it overrode the track from the ROOT element (`hover:[&_[data-slot=slider-track]]:h-1.5`),
  a descendant selector that genuinely outranks the track's own rule.
- **Systemic fix:** the rail's thickness now lives in exactly one place — the per-variant record —
  and the base Track declares only the length axis. The same tie existed between the control's
  `py-1.5` and `bare`'s `py-0`; that is now an either/or, not an override.
  `packages/ui/test/media-chrome.browser.test.tsx` asserts the resting height against the compiled
  CSS, which is the only place a specificity tie is observable. Structural unit tests cannot see
  this class of defect: the class string is present and correct in the DOM either way.

## 2026-09-07 — A viewer's playback speed reset several times a second (found in M1 review)

- **Symptom:** selecting 1.5× or 2× held only until playback resumed, then snapped back to 1×.
- **Root cause:** the media-element effect in `media-player-controls.tsx` listed the consumer's
  `onTimeChange` in its dependency array (through `syncFromMedia`). `timeupdate` fires ~4×/s while
  media plays and re-renders the controls; a consumer passing an inline callback — the shape every
  docs example uses — hands over a new identity on each of those renders, so the effect tore down
  and re-ran at the same rate, and its first statement was
  `media.playbackRate = defaultPlaybackRate`.
- **Systemic fix:** the consumer callbacks are held in a ref updated in a layout effect, so their
  identity never reaches a dependency array, and applying the default rate is its own effect keyed
  on the default itself. Pre-existing in `audio-player.tsx`, but the refactor made it one module
  that both players inherit, which is the moment to fix it rather than duplicate it.

## 2026-09-08 — A rest-state assertion measured a hovered button, because the pointer never moved

- **Symptom:** `button-matrix.browser.test.tsx > a neutral ghost inherits its host ink; a status
ghost takes its own` expected the neutral ghost to compute `rgb(1, 2, 3)` (its host's ink) and got
  `oklch(0.145 0.003 75)`. It failed in **every** full `pnpm gates:push` sweep and passed 7/7 when
  the file was run on its own, on the same box and the same tree.
- **Root cause:** the received value is exactly `--foreground`, which for the neutral tone is exactly
  `--btn-tint` — the ink a ghost paints **on hover** (`hover:text-(--btn-tint)`). Every test file in
  a run shares one browser page, and the pointer stays wherever the previously executed file left
  it; in a full sweep it was already sitting where this button mounts, so the button was in `:hover`
  before the first line of the test ran. In isolation nothing had moved the pointer, so the same code
  passed. The failure screenshot settles it: `Dismiss` is drawn with a hover background and `Approve`
  is not. A diagnostic render confirmed the mechanism itself is intact — the host div computes
  `rgb(1, 2, 3)`, the button's parent is that div, `--btn-ghost-ink` reads back empty, and the button
  computes `rgb(1, 2, 3)` — and the compiled CSS is exactly
  `.text-(--btn-ghost-ink){color:var(--btn-ghost-ink)}` plus
  `.[--btn-ghost-ink:inherit]{--btn-ghost-ink:inherit}`, so `color` is invalid-at-computed-value-time
  and falls back to the inherited ink as designed.
- **Systemic fix:** the fixture renders a spacer and the test parks the pointer on it with
  `userEvent.hover` before measuring, so rest is actually rest. The rule worth keeping: **a test that
  asserts a rest-state style must establish rest — the pointer is shared, page-scoped state that no
  `render()` resets.** The tell for this whole class is a test that fails only in the full suite and
  passes in isolation while the "wrong" value is precisely some other state's token.

## 2026-09-08 — The same `relative-time` fixture also breaks the 24px target-floor probe

- **Symptom.** With the 320px reflow race fixed on `main` (`065315d5`), the full 110-route sweep
  still failed twice on the SAME route, in a different check:
  `/docs/components/relative-time retains focus visibility and effective 24px pointer targets`,
  `mobile-chromium` and `mobile-chromium-dark`. Every one of the five probe points reported
  `"hit": null` — `elementFromPoint` found nothing at coordinates derived from a rect the probe had
  just measured (visual 27.0×21.0px, at y≈2180).
- **Same cause, different assertion.** `relative-time` re-renders on its own self-rescheduling clock.
  The 320px fix made the _scroll_ step resilient; the target-floor check measures a rect and then
  hit-tests it, and a tick landing in that window leaves the probe firing at coordinates whose
  element no longer exists. `"hit": null` on **every** point — rather than a wrong element or a
  too-small box — is the tell that the target moved, not that it is undersized.
- **Pre-existing, not caused by F2.** F2 touches no `relative-time` file (`git diff origin/main..HEAD
--name-only` names none), and the route passes **8/8 in isolation on the same box and the same
  tree** while failing only inside the loaded parallel sweep — the identical signature to the 320px
  race recorded above.
- **Not fixed here.** F2 does not own `apps/docs/vrt/contracts.spec.ts`; the 320px fix reached this
  branch from `main`, and the sibling fix belongs with it. **G1-b**: the rect-measure-then-hit-test
  window in the target-floor check needs the same bounded retry the scroll step got, or the probe
  should re-measure the rect inside the poll. Until then a globally-scoped change can lose a full
  sweep to it, and the correct handling is a re-run plus an isolated confirmation — never `GATES_SKIP`.

## 2026-09-07 — Audit finding B3-10 was wrong: Base UI does NOT set `role="tooltip"`

- **Symptom:** B3-10 ("Tooltip drops explicit `role`") asserted that Base UI's Tooltip popup already
  carries `role="tooltip"`, so ours was redundant. Removing the prop made
  `getByRole("tooltip")` fail in `truncated-text.test.tsx`.
- **Root cause:** the claim is not true of the INSTALLED `@base-ui/react` **1.6.0**. The string
  `"tooltip"` appears in no role assignment anywhere in the package; the popup renders with no
  implicit or explicit `role`. The audit finding was written from the library's documented intent
  rather than from its shipped code.
- **Resolution:** the finding is **rejected**, not deferred. `TooltipContent` keeps
  `popupProps={{ role: "tooltip", ...props }}` — spread last so a caller can still override it — and
  the source carries a comment naming the version the claim was checked against, so the next sweep
  re-verifies rather than re-deletes. If a later Base UI does set the role, the prop becomes a
  harmless no-op and can go then.
- **Rule this reinforces:** an audit finding that says "the library already does X" is a claim about
  a specific installed version. Check it against that version's shipped code before deleting
  anything an assertion depends on.
