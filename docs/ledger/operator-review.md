# OPERATOR REVIEW LEDGER

Every judgment-call / assumption / best-guess decision made instead of pausing — options considered, what was chosen, why. For MK to review.

---

## 2026-09-09 — post-rebuild audit: two fail-opens, a wrong plan target, and main left unprotected

**Context:** after WP0–WP6 landed, an adversarial audit went through the three workflows and the two
paths the rebuild rewrote but never executed — `deploy.yml` (last real run 2026-09-05) and
`release.yml`'s `publish` job (skipped on every run since). What follows is what it found, what was
fixed, and the three calls MK made.

**Fixed the same day.**

- **The release path had been dead since WP5.** Every `Release` run on `main` failed at `version-pr`
  because the job checks out a detached HEAD, so `changeset status` — newly reached through
  `changelog-assemble.mjs` — could not find where HEAD diverged from `main`. One step,
  `git branch -f main "$GITHUB_SHA"`, fixed it (#81); two consecutive green runs and a Version PR
  carrying the assembled `[0.7.0]` entry are the proof.
- **A stale docs build cache accused the shell of drift.** `turbopackFileSystemCacheForBuild` can
  serve a stylesheet compiled before a `global.css` change, and `verify:emitted-css` reads the built
  CSS — so `verify:release` reported ten off-ladder font weights on a tree that builds clean. CI never
  sees it (`actions/checkout` runs `git clean -ffdx`), which is exactly why it cost a local run an
  hour. Release mode now clears `.next` and `out` first (#84). **The audit's conclusion that
  production would ship an off-system shell was wrong** and is recorded here so it is not repeated.
- **`assert-clean-tree` called any untracked file "registry drift"** — a lie in the direction that
  wastes the most time. It now snapshots before the build and compares after (#84).
- **The cross-engine lane could silently become two engines.** Nothing set `WEBKIT_LANE`, so the
  default was `auto`: a WebKit that stopped launching would print a banner and continue, while
  `AGENTS.md`, `verify.mjs` and the `ship` skill all promised three engines to a deploy that relies on
  it. CI now defaults to `require` (#85). `auto` still covers the developer Mac that physically cannot
  run WebKit.
- **`.claude/worktrees/` had never been gitignored** (pre-existing, not a rebuild regression). One
  `git add -A` staged 22 embedded repositories holding the audit epic's unpushed commits (#82).

**MK's calls, 2026-09-09.**

1. **WP3b is dropped, not deferred, and the plan's line target is withdrawn.** `tooling/` is 18,333
   lines across 60 files against a "~7,000" target and a 16,257 baseline — the rebuild deleted 5,331
   lines of attestation and added more in new commands, tests and runbooks. The count was never a
   proxy for the thing being fixed. Migrating the surviving verifiers into the vitest project buys
   legibility, not coverage, and risks losing a fail-closed property in translation. See § 3.3 of the
   plan, now annotated.
2. **`main` stays unprotected — deliberately.** There is no required review and no required check;
   the reviewed-PR flow `docs/RELEASING.md` describes is convention, and anything holding a token can
   push straight to `main`. MK accepted this while the audit epic is merging quickly, on the grounds
   that required checks would slow a train that is already gated by `pnpm verify` on every PR. **This
   is a choice, not an oversight — revisit when the epic lands.** The exposure it leaves: a direct
   push to `main` skips `ci.yml` entirely (it triggers on `pull_request` only).
3. **`quality-gate` must become unconditional.** It runs only when the release detector reports
   `publish == 'true'`, which is currently always true because `release-detect --check-npm` is
   fail-open — `npm view` run from the repo root hits `EBADDEVENGINES` against the `devEngines` pin and
   the script reads the error as "unpublished". Fixing the detector therefore OPENS a hole in which a
   push to `main` touching no package with no changeset is verified by nothing. The two must land
   together; noted here because the sequencing is the trap, not either change alone.

**Still true and unfixed at the time of writing:** `deploy.yml` has still never run in its current
form, and the `publish` job has still never run since the rebuild. Neither can be exercised without
an MK-gated dispatch, so both remain unproven by execution rather than by reading.

## 2026-09-09 — rulebook rewrite: history moved out of AGENTS.md

**Context:** WP6 of `docs/plans/2026-09-08-verification-rebuild.md` cut `AGENTS.md` from 478 lines
back to a rulebook. Everything below was TRUE when it was written and is preserved here as the
record; none of it is a current rule, and nothing here should be quoted as present behaviour.
Original decision dates are kept.

- **Why the attestation existed at all (decided 2026-07-25, deleted 2026-09-08).** No free runner
  could launch a browser, so the browser-unit suite, the cross-engine smoke, the three-engine suite,
  and the 864 behaviour contracts ran in the pre-push hook and in a local full-sweep command, and
  each run wrote `.gates/receipt.json` bound to a tree hash of the working tree with `.gates/`
  excluded. Every workflow's `receipt-guard` job rejected a push whose receipt did not cover the
  pushed tree. It was written down at the time that a receipt is **attestation, not proof** —
  `--no-verify`, `HUSKY=0`, or a hand-edited JSON defeated it — and what it bought was that skipping
  a browser gate became a visible, auditable act. Seven of eleven gate rows stayed machine-verified,
  and the split was published row by row. `tooling/gate-receipt-carry.mjs` existed for the one
  legitimate carry: `changeset version` moved the tree hash while changing no code a browser gate
  could observe, so without it every Version PR failed `receipt-guard` and no npm publish was
  reachable at all. The measured saving that justified the topology: ~1,892 billable minutes over
  7.2 days became ~100–150 per month, with a pull request costing zero. On 2026-09-07 the LAN Debian
  boxes ran Chromium, Firefox, and WebKit under Playwright; the premise was gone, and R1 deleted the
  mechanism rather than maintaining evidence about evidence.
- **Why the minis could not run browsers.** Their Actions runner had no per-user Mach bootstrap
  namespace, so every Chromium launch died with `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP
  (`launchd manager: System`, `gui domain: MISSING`), while the identical suite passed locally on
  the same OS and CPU. The fix was always host-side — reinstall the runner as a LaunchAgent inside a
  logged-in session — and it is now optional: the Linux boxes execute the browser lanes, and the
  minis keep the credential-only jobs and the cross-platform static signal.
- **Why job containers were banned outright, and why R2 narrowed it.** The ban was written for the
  minis, which are macOS and cannot start a Linux container at all. The one job that legitimately
  needed one — the three-engine suite in the digest-pinned Playwright image, because bare
  `ubuntu-latest` WebKit could not settle the compiled-CSS Toaster contrast check — stopped running
  in CI. On the LAN Linux runners the pinned image is what makes a box interchangeable, so the
  workflow-security gate now REQUIRES a container there and rejects one everywhere else.
- **npm provenance, and the E422 story.** npm trusted publishing works on self-hosted runners; only
  the provenance _bundle_ requires a GitHub-hosted runner, and npm rejects a self-hosted bundle with
  **E422**. `NPM_CONFIG_PROVENANCE` is not honoured by the changesets action's OIDC path, so
  `publish` calls `npm publish --no-provenance` directly. Hosted runners could attach provenance but
  are billing-locked, so releases ship without an attestation. npm's public docs claim self-hosted
  is unsupported for trusted publishing; that is stale — sibling repo `vegastack/vegafactory`
  published `@vegastack/skills` 0.16.1–0.17.0 from self-hosted runs on 2026-09-01, token-free OIDC,
  no attestations. Empirical reality outranked the docs, and still does.
- **The focus-indicator check that could not fail (measured 2026-07-25, dropped 2026-09-08).** The
  retired `apps/docs/vrt/contracts.spec.ts` ran under `forcedColors: "active"`, where Chromium
  paints its own ≥2px focus ring and forced-colors repaints borders on focus — so both branches of
  the assertion were unconditionally true, and deleting the design system's `:focus-visible` rule
  left every check green. It was never coverage, it was documented as such, and R3 dropped that half
  rather than porting it. Reflow, RTL containment, and the 24px target floor did fail on real
  defects and were ported verbatim into `packages/ui/test/geometry.browser.test.tsx`. Evidence:
  `docs/ledger/bugs.md`, 2026-07-25.
- **The pixel-review lane (deleted 2026-09-08).** It captured the base ref and the working tree on
  one machine and emitted a before/after report a human read during `/ship`. It exited 0 for any
  pixel outcome, produced zero recorded findings in its life, and no screenshot was ever committed.
  Its stated cost is now the accepted one: nothing enforces layout drift in CI, which was the price
  of removing a gate whose only escape hatch was overwriting the evidence under review.
- **Route scoping and the cross-browser policy (deleted 2026-09-08).** `tooling/lib/route-scope.mjs`
  decided which routes a change could reach, shared by the contract and pixel lanes with per-lane
  overrides and proved in both directions by its verifier; the pre-push hook ran a contract-selected
  WebKit/Firefox risk smoke generated from `coverage.crossBrowserSmoke`. Both are gone because the
  loop they optimised is now short enough that scoping has nothing to optimise: `pnpm verify` runs
  everything, and `pnpm verify:release` runs all three engines before a deploy.

**Judgment calls made in this rewrite, rather than pausing:** the work package's deletion list named
the retired contract-suite commands, the CI attested-versus-executed table, and the attestation
paragraphs; each was removed. Three things on no list were KEPT in `AGENTS.md` because a script
enforces them and losing the rule would lose the enforcement — the empty GitHub-hosted-runner
allowlist (with the negative harness that proves it), the no-`NPM_TOKEN` rule, and the production
boundary contract every deploy probes. `pnpm run clean` was kept for the same reason: it is the
documented interface to the cleanup `pnpm verify` runs in its `finally`.

---

## 2026-09-08 — Fo1 fix round: the stepper wash climbs the ladder through a group-scoped twin

**Context:** the Codex review of F1 routed two items to Fo1 — `number-field.tsx` hand-wrote
`hover:bg-surface-2 active:bg-surface-3` instead of spreading `surfaceInteractive`, and the
`auto-save-input` preview painted a legacy `hover:bg-accent` wash with no pressed step.

**Decisions taken instead of pausing:**

- **A new export, `surfaceInteractiveGroup`, rather than a literal or a restructure.** The stepper's
  wash is deliberately an inset chip inside the button (SP-02: a full-bleed fill ran into the field's
  hairline), so the two rungs must fire on the BUTTON's hover while painting on a child — which
  `surfaceInteractive` cannot express. Three options were weighed: (a) keep the literal, which is the
  defect the finding names; (b) drop the child and use `p-1 bg-clip-content` on the button, which does
  inset the paint natively but silently changes the chip's corner radius and needs a `not-disabled:`
  re-write of the recipe to keep a disabled stepper from lighting up — a pixel change on a one-sweep
  budget; (c) export the group-scoped twin once, documented as the single geometry that needs it.
  Chose (c): the rungs stay written once, the shipped geometry is unchanged, and the API cost is one
  named export with an explicit "everything else spreads `surfaceInteractive`" note. The group is
  named `wash` (not left unnamed) so a consumer's own `group` on an ancestor of a copied-in component
  cannot fire it.
- **The preview's record selector became a real `Button`, not a re-tokenised `<button>`.** The chip
  was a hand-rolled `border + hover:bg-accent` with no pressed step. Rather than swap the wash for a
  recipe and keep the hand-rolled element, it is now `Button variant="soft" | "outline" size="sm"`
  with `aria-pressed` — the selected/rest pair the system already ships, hover and pressed rungs
  included. A preview that hand-rolls a control the system exports is itself the finding.

**Needs MK:** nothing. Both are corrections routed by review; neither re-opens a decision.

---

## 2026-09-08 — M2 judgment calls (prose recipe shape, Toolbar adoption, the 100ms exit)

**Context:** M2 (#36) implements B4-09 (one prose recipe), B4-10 (Base UI `Toolbar` in TextEdit,
ActionBar and FilterBar), B8-11/B9-08 (the docked-control motion pair) and B4-11 (fixtures). Four
calls were made rather than pausing; the third and fourth are deviations from the issue text and are
flagged in the PR body.

**Decisions taken instead of pausing:**

- **`prose` lives in `@vegastack/design`, not as a registry `lib` item.** The package already holds
  exactly this kind of thing — `surfaceInteractive`, `fillInteractive`, `TIMINGS`, `FLOATING` — and
  `preset.css` scans its `dist` through `@source "./dist"`, so the class literals reach a consumer's
  Tailwind build with no new plumbing. Both consumers already declare `@vegastack/design` as an npm
  dependency, so `verify-registry-deps` needs nothing new and a `shadcn add markdown-view` still
  installs a working component. A registry `lib` item would have added a second distribution path for
  a file with no JSX in it.
- **The recipe is descendant variants worn on the root, NOT per-element class strings handed to
  react-markdown's components map** — a deviation from the issue's wording (`class strings per
element … consumed by MarkdownView's components map`). Two facts forced it. First, TextEdit cannot
  use per-element classes at all: ProseMirror owns the contenteditable DOM, so its half must be
  descendant rules, and Tailwind's scanner only emits candidates it can see as literals — so a
  per-element map plus a descendant map means the whole recipe written **twice**, which is the
  duplication B4-09 exists to remove. Second, the two forms cannot coexist on one tree:
  `[&_h1]:mt-6` compiles at specificity (0,1,1) and a plain `.mt-6` on the element at (0,1,0), so any
  element-level typography class inside a prose root is a silent no-op. `prose` is still a
  per-element record (the issue's substance); each value is that element's rules already scoped.
  MarkdownView's map keeps only the four genuinely behavioural entries (`a`, `input`, `pre`,
  `table`), and the file is ~150 lines shorter. The acceptance criterion — "the same computed styles
  for h1/p/code" — is now true by construction and asserted by measuring the resolved cascade.
- **FilterBar keeps `role="group"`; only TextEdit and ActionBar became toolbars.** B4-10 names all
  three. TextEdit and ActionBar are rows of single-action controls — textbook APG toolbars, and both
  were announcing a role whose traversal they did not implement. FilterBar is not that shape: a
  `FilterChip` is a composite (label plus its own remove button), so it is not a single tab stop; the
  search `Input` under Base UI's composite gains select-all-on-focus, which is not wanted in a filter
  box; and `trailing` is an arbitrary host slot that cannot register. Converting it would trade a
  truthful `group` for a `toolbar` whose roving order covers only part of the row — the exact defect
  B4-10 objects to. It should be re-decided on the shape T2 (#38) leaves behind, since that batch
  replaces `FilterChip` with the shared `Chip` primitive. **Flagged for MK.**
- **ActionBar gains `ActionBarButton` / `ActionBarSeparator` rather than auto-wrapping children.**
  Base UI's toolbar builds its single tab stop from items that register with it, and ActionBar's API
  is free-form `children`. Auto-wrapping every child in `Toolbar.Button` was considered and rejected:
  it cannot tell a `Button` from a `Separator`, and it would turn the separator into a focusable
  button. Explicit parts keep every existing prop working, match the composition Base UI documents,
  and make the roving promise true for the sanctioned shape. A bare `<Button>` still renders — the
  page and the JSDoc say plainly that it keeps its own tab stop.
- **100ms stays inside `motion-dock-out` instead of becoming a fifth `--duration-*` token.** The
  system's durations are 150/200/300; D11's docked exit introduces a fourth value with exactly one
  role. A global `--duration-quick` would invite reuse D11 did not sanction, and O1 (#40) is
  concurrently working the overlay timings, so inventing a shared name here risks two batches naming
  the same value differently. The utility IS the name of the role; the raw value sits in the token
  package, where every other raw motion value already sits.
- **Motion register M-39 / M-49 are dispositioned, in the living register rather than the audit
  file.** Both rows (action-bar enter/exit; message-scroller button "copy of M-39") called for
  150 in / 100 out, no scale, and both are now implemented through one shared utility pair, so the
  duplication the register recorded is gone as well as the timing. The audit batch files are
  point-in-time records under the truth hierarchy and were deliberately **not** rewritten; the
  register that governs today is `design.md` §Motion, `foundations/motion.mdx` (a new "Docked
  presence" mechanism row and a vocabulary row) and `component` skill §2 (a new matrix row) — all
  three updated in this change.
- **The recipe uses logical properties and `text-start`** where the two originals used `ml-6`,
  `pl-4`, `border-l-2`, `mr-1.5` and `text-left`. Prose is the surface most likely to carry
  translated content and the contract lane already asserts RTL containment, so authoring the new
  single source physically would have booked avoidable work for G1's `no-physical-direction` lint.
  `font-medium` on `strong`/`a`/`th` is deliberately NOT touched: `text-label` also changes font-size
  and tracking, which would shrink a `<strong>` inside a heading, and the `font-medium` ban is C1/G1's
  with its own vocabulary decision.

## 2026-09-08 — Mk1 (#47): marketing leaves, hooks and the dashboard block

**Context:** implementing B9-03…B9-07 and B9-09…B9-12 under D29 (single-series chart = foreground
ink) and D30 (next-themes sanctioned). Every item below is a call made instead of pausing.

**Decisions taken instead of pausing:**

- **The block's chart keeps `chart-1`/`chart-2`, because B9-05's premise is false.** The finding
  describes "the single-series area chart", and the brief's item 3 says to move it to
  `--chart-single`. The source renders TWO `<Area>`s — `requests` and `errors` — and did so at the
  audit commit itself (`git show 6f11a4bc:…/dashboard-chart.tsx` lists both `dataKey`s). D29 reserves
  `chart-*` for two series and up, so changing this chart would have VIOLATED the decision the
  instruction cited. Left as-is. The genuinely single-series chart in the repo is the docs preview
  `chartDemoTooltipVariants` (one `<Bar dataKey="desktop">`), which was on `chart-1` and is now on a
  dedicated `chart-single` config — otherwise the one place a reader sees a lone series would have
  contradicted the doctrine written into `design.md` in the same PR. `chart` is in this batch's file
  list; no other batch owns it.
- **`SettingsSection` got `titleAs`, not Base UI `render`.** The brief said "`render`/`as`. `render`
  goes through `useRender`, which calls `React.useRef` internally (`tooling/verify-rsc-safety.mjs`
  names it explicitly), so it would have forced `'use client'` onto `settings-row.tsx` and cost the
  whole settings family the server-safe status its JSDoc asserts three times — to pick a tag name.
  `as` is also the file's own existing idiom (`SettingsRow`'s `LabelTag`). Constrained to
  `h2`…`h6` so it cannot be used to render a non-heading.
- **The visibility gate REMOVES the reveal rather than adding it.** The obvious spelling —
  `useState(!whenVisible)`, words start at `opacity-0` — leaves real content permanently invisible on
  a page whose JavaScript never runs, which is a worse failure than the animation the fix is about.
  `revealed` therefore starts `true` (so the server-rendered markup animates, exactly as before) and
  a layout effect pulls off-screen words back before the first paint. The synchronous
  `getBoundingClientRect` check exists because an `IntersectionObserver` callback is async and would
  paint one frame of visible text before hiding it. `useLayoutEffect` is behind the standard
  isomorphic shim so it never warns during a server render.
- **`ShortcutOverlay` is `size="md"`, which NARROWS it from 512px to 448px at ≥sm.** The brief and
  the issue both name `md` explicitly, and `md` is the Dialog's own default, so the component now
  overrides nothing. Flagging the width change because it is a real visual difference, not a no-op:
  if the shortcut list wants the old width, `size="lg"` is the one-word change.
- **`mergeRefs` is in `@vegastack/design`'s main entry, typed with `import type * as React`.** That
  entry is server-safe by contract (it must not touch a React runtime value under the `react-server`
  condition). A type-only import is erased at build, and `mergeRefs` only assigns to ref objects the
  caller already holds, so it touches no React runtime value at all. Its two behaviour tests moved to
  `packages/ui/registry/ui/merge-refs.test.tsx` — the only suite in the repo that renders into a real
  browser DOM, which is what a ref-attachment contract actually needs; `@vegastack/design`'s own
  tests are plain-node and would have had to fake React's ref plumbing.
- **The `function usePrefersReducedMotion` acceptance grep reads 1, not 0, and that is correct.**
  The issue asks for `grep -rn "function usePrefersReducedMotion\|typeof ref === \"function\""
packages/ui/registry/ui` → 0. The ref half IS 0. The other half cannot be 0 while the hook exists
  in the registry — the finding it encodes is "three components define their own", and all three
  private copies are gone; the single remaining match is the canonical definition in
  `use-media-query.ts`. Spelling it `export const usePrefersReducedMotion = () =>` would satisfy the
  regex and break consistency with every other hook in the repo (`export function useFileDrop`,
  `useAnimationReplay`, `useListNav`, …), so the grep is reported honestly rather than gamed.
- **`usePlatform`'s first-render contract changed, and its test changed with it.** The old test
  asserted `seen[0]` equals BOTH fallbacks. With `useSyncExternalStore`, `getSnapshot` — not
  `getServerSnapshot` — runs on a client-only mount, so `isTouch` is the real value on the very
  first render. That is more correct (no wasted frame reporting a value nobody asked for) and matches
  React's documented contract; `fallbackIsTouch` is now honestly described as the server/hydration
  answer only. The test asserts the new split rather than being deleted.
- **`ShortcutOverlay` is entirely O1's, and this batch ships nothing for it.** Item 5 asked for
  `DialogContent size="md"`, the `--layout-overlay-max-height` scroll region and O1's `panelSearch`
  recipe. The recipe did not exist while this work was being written (O1, #40, was unmerged), so it
  was deferred; O1 then merged as `54c5cb68` carrying `PanelSearchFrame`, the full-bleed search row
  AND `size="lg"` on this very surface. Rebasing onto it, the whole file was taken from O1 — a
  narrower `size="md"` would have fought the full-bleed header O1 built for it, and the overlay is
  O1's to own. `git diff origin/main -- packages/ui/registry/ui/shortcut-overlay.tsx` is empty by
  design. The changelog bullet this batch had written for it was removed for the same reason.

**Needs MK:** nothing blocking. The `function usePrefersReducedMotion` grep reading 1 is the one
item worth an explicit nod.

---
## 2026-09-07 — F1 follow-up: reconciling the doctrine, the guides and the media gate with the ladder

**Context:** a post-merge Codex review of F1 (#32, `9c33dfaf`) found that the token layer moved but
several prose and gate surfaces did not. Every item below is a correction to what a document or a
gate _claimed_, not a change of direction — no F1 decision is re-opened.

**Decisions taken instead of pausing:**

- **The switch off-track is `surface-3`, and design.md now says so twice.** `design.md` had two
  contradictory statements: the wells bullet listed the switch off-track under `surface-1`, and the
  Components line still named the **deleted** `track` token. The source (`switch.tsx`) is
  `bg-surface-3`, and the `surface-3` token description already documents "the switch off-track", so
  the source and the token were right and both prose sites were wrong. Written up as an explicit
  exception ("a pressed-weight affordance, not a well") rather than silently deleting the mention,
  because a reader who finds a well-weight rail and a pressed-weight rail needs to know which is
  which. The same carve-out was added to `skills/internal/component/references/tokens.md`, and the
  `/CHANGELOG.md` 0.7.0 bullet that asserted all three tracks were `surface-1` was corrected — 0.7.0
  is unreleased, so this is a fix to an unshipped claim, not a rewrite of history.
- **The chromatic ramp is eight tokens, not seven (design.md) or six (colors.mdx).** F1 added a
  precomposed `<family>-subtle-active`; neither count was updated. Verified against
  `dist/theme.css` (`--info`, `-hover`, `-active`, `-foreground`, `-subtle`, `-subtle-hover`,
  `-subtle-active`, `-text`) rather than counting the DTCG source, because four of the eight are
  derived by `sd-hooks.mjs` and never appear there. `colors.mdx`'s theme-split sentence was corrected
  at the same time: `-subtle-hover`/`-subtle-active` ARE theme-aware (confirmed in the `.dark` block),
  while `-hover`/`-active` are emitted only in the light run.
- **`media-foreground` on `media-scrim` is gated at AA text (4.5:1), not the 3:1 non-text floor.**
  The token contract permitted labels on the soft scrim while the gate only checked it as a graphic —
  a contract wider than its enforcement. Two options: narrow the contract to send all text to
  `media-scrim-strong`, or raise the gate. **Chose to raise the gate**, because the pair already
  measures **5.22:1** over the white worst case, so the stricter floor costs nothing today and simply
  makes a future scrim retune fail loudly; narrowing instead would have invalidated shipped media
  chrome that legitimately labels on the soft scrim. Proven falsifiable: temporarily raising the floor
  to 6:1 fails both themes at 5.22:1. The three media token `$description`s now state where text is
  allowed and which floor enforces it. Check count unchanged (434) — a floor moved, no pair added.
- **`secondary` and the text-entry fill claims in design.md's Components section were simply wrong.**
  `secondary` was described as "card fill + the one border"; it is `bg-secondary` (= `surface-1`) over
  the shared `border-transparent` base. `Input/Select/Textarea` were described as "`secondary` fill";
  they are `bg-transparent` with a dark-only `bg-input/(--alpha-input)` wash. Both corrected from the
  registry source. The second was outside the reported finding but is the same drift in the same
  paragraph, so fixing one and leaving the other would have been arbitrary.
- **The `SurfaceLadder` alpha-twin specimen was rebuilt to paint real composites.** It labelled two
  swatches `--alpha-hover` / `--alpha-pressed` while filling them with `var(--surface-2)` /
  `var(--surface-3)` — the opaque rungs. That made the panel unfalsifiable: it could not drift from
  its own label, and it demonstrated the opposite of the twins' claim (that they composite onto a
  backdrop that is _not_ a rung). It now mixes `foreground` at each alpha over **three** hosts (page,
  card, well) in both themes, with the opaque rung shown beside each wash for comparison and labelled
  as such. Three hosts rather than the two asked for: in light, `card` **is** the page colour (P1), so
  a page+card specimen would have shown two identical columns and taught nothing.

**Needs MK:** nothing. Every item is a document or gate catching up to shipped, decided behaviour.

## 2026-09-07 — Animated icons: three calls from the Codex round on PR #57 (issue #46)

**1. `chevron-first`'s handle type is a RENAME, not an alias removal — and the rename is kept.**

- **What was actually there:** upstream copy-pasted `chevron-first`'s `displayName` from another
  icon, so its primary exported interface was `ChevronsDownUpIconHandle` and `ChevronFirstIconHandle`
  was the `@deprecated` alias _of_ it. The other seven icons in the same list are the ordinary shape
  (primary survives, `@deprecated` alias deleted). The first changelog draft counted all eight as
  alias removals, which described the opposite of what happened to this one.
- **Options:** (a) keep `ChevronsDownUpIconHandle` as the surviving name, matching the old primary;
  (b) keep `ChevronFirstIconHandle`, matching the exported component symbol and the registry item
  name; (c) keep both.
- **Chosen: (b).** The exported symbol is what consumers import and what `component-contracts.json`
  pins, and a handle type whose name disagrees with its own icon is the upstream bug, not a
  contract. (c) is a compatibility alias, which the audit mandate forbids outright. Documented as a
  breaking rename with both names named, so a consumer of the old name can act on it.

**2. Reduced motion is a hand-rolled store, not a Motion hook — and that is a deliberate cost.**

- **Why:** neither Motion hook can express "live". In 12.42.2 `useReducedMotion()` is
  `useState(prefersReducedMotion.current)` — one read of a module singleton captured at first import,
  its own source carrying a `TODO` about not updating — and `useReducedMotionConfig()` composes
  `<MotionConfig>` over that same one-shot value. The previous implementation therefore claimed a
  behaviour it did not have: an icon already on screen when the user turned the preference on kept
  animating. The factory now subscribes to the media query through `useSyncExternalStore` and keeps
  the `<MotionConfig>` override by reading `MotionConfigContext` directly.
- **The cost:** `MotionConfigContext` is a public export of `motion/react` but is not part of the
  documented hook surface, so a future Motion major could move it. **D3 (motion 13) compatibility:**
  this is one import in one file, `tooling/verify-animated-icons.mjs` asserts each half of the
  mechanism separately, and the suite tests a live media-query transition in both directions — so a
  break surfaces as a named gate failure, not as silently dead reduced-motion support. If Motion
  ever ships a subscribing hook, delete the store and the override branch and use it.

**2b. `<MotionConfig reducedMotion>` overrides in ONE direction only — this is a deliberate
capability loss, and it needs MK's eye.**

- **What forced the call:** `MotionConfigContext`'s default value is `reducedMotion: "never"` —
  Motion does not auto-reduce; an app opts in with `"user"`. And `MotionConfig` merges over its
  parent, so an explicit `<MotionConfig reducedMotion="never">` and **no `<MotionConfig>` at all**
  produce identical context values. Nothing public can tell them apart. Honouring `"never"` as an
  opt-out therefore also switches reduced motion off for every consumer who configured nothing,
  which is how both `useReducedMotionConfig()` and my first fix for it ended up ignoring the OS
  preference entirely (see `bugs.md`, 2026-09-07 (d)).
- **Options:** (a) honour `"never"`, and accept that the un-configured tree — almost every consumer
  — never reduces motion; (b) ignore `"never"`, so the OS preference always wins and only
  `"always"` can add reduction; (c) reach into React internals to capture the default context object
  and compare identity, recovering both behaviours.
- **Chosen: (b).** (a) is a WCAG failure on the default path and contradicts what the docs page
  promises. (c) depends on `MotionConfigContext._currentValue`, a private React field, to keep an
  escape hatch whose only purpose is to animate against a user's explicitly stated preference —
  paying in fragility for a capability the design system should probably not offer. (b) fails safe:
  the worst outcome is a consumer who wanted motion getting stillness.
- **What it costs:** a consumer cannot force full motion for icons. `<MotionConfig
reducedMotion="never">` is now inert for them. **Needs MK:** confirm that trade, or say that the
  escape hatch must exist and take option (c).

**3. The animated-icon gate now pins each generated module by hash.**

- **The hole:** `animated-icon-sources.json` pinned only the SHA-256 of the bytes fetched from
  upstream. Nothing bound those to the module generated from them, so editing a digit of a glyph
  path left all 439 icons passing — every remaining assertion is a schema check, and a hand-edited
  path is still schema-valid. Reported by Codex as a fail-open gate; reproduced exactly.
- **Chosen:** the manifest carries `moduleSha256` per icon — the hash of the generated module body
  with the `registry:build` provenance header excluded, which is precisely the slice the mirror
  itself compares when deciding a file changed — and the verifier recomputes it from disk. The
  mirror stamps it on every write run and re-checks it under `--check`. Two of the fifteen
  `--self-test` mutations (a glyph-path edit and a timing edit that uses a _sanctioned_ duration)
  exist specifically to prove nothing else in the gate can catch these.

---

## 2026-09-07 — Animated-icon factory: seven calls D28 did not settle (issue #46)

D28 fixed the architecture ("factory + data modules") and the constraints ("public icon names and
the `AnimatedIcon` wrapper API stay unchanged"). These seven were left open and were decided here.

**1. Host element — an `inline-flex` `<span>`.**

- **Options:** (a) keep the block-level `<div>`; (b) an `inline-flex` `<span>`; (c) make the `<svg>`
  itself the root and drop the host entirely.
- **Why (b):** (a) is the audit's own finding — an icon sits inside a line of text and a block box
  there breaks the line. (c) is leanest but changes the public prop type from HTML attributes to SVG
  attributes, which breaks `AnimatedIcon`'s `as` contract and every consumer spreading `className`,
  `role` or a data attribute — a wrapper-API change D28 forbids. (b) fixes the layout bug and keeps
  the prop surface, at the cost of one type change: `AnimatedIconComponent` and the icon props move
  from `HTMLDivElement` to `HTMLSpanElement`. **Needs MK:** that is a public type change and is why
  `@vegastack/design` takes a minor, not a patch.

**2. Subpath — `@vegastack/design/create-animated-icon`, not `./icons`.**

- **Options:** (a) export the factory from the existing `./icons` entry; (b) a new subpath.
- **Why (b):** `./icons` deliberately imports no `motion` — it carries `Icon`/`BrandIcon`, which a
  consumer uses without any animation engine. Putting the factory there would force `motion` into
  their graph and make the whole entry client-only. This is the same reason `./theme-scope` is
  already separate. `motion` becomes an **optional** peer dependency of `@vegastack/design`.

**3. Choreography is a closure, not a step table.**

- **Options:** (a) reify every icon's start/stop into declarative step data; (b) let the 49
  non-default icons carry a small `start`/`stop` closure over the factory's context.
- **Why (b):** 390 of 439 icons need neither — they take the factory's default play/rest pair and say
  nothing. Of the rest, the choreography is genuinely per-icon (awaited sequences, `Promise.all`,
  a 1.5s deferred hide, a re-entrancy latch). A declarative step language rich enough to express all
  of that would be a worse, less readable encoding of the same four lines, and every construct would
  need its own interpreter in the factory. The duplication D28 targets — the controller — is gone
  either way; what remains per icon is irreducibly per-icon. The factory supplies the primitives
  (`run`/`reset`/`set`/`after`/`flags`) so a closure never touches React.

**4. A reviewed override table for six icons, and a hard failure otherwise.**

- Six icons (`wifi-low`, `projector`, `phone-call`, `satellite-dish`, `keyboard`, `volume`) reached
  for a component-local helper, a timer, or React state that the mechanical rewriter cannot express.
  Rather than approximate them, `CHOREOGRAPHY_OVERRIDES` in the mirror carries a hand-reviewed
  transcription for each, reachable **only** after the mechanical path has refused the icon. A new
  archetype therefore throws instead of silently taking the default. Upstream cannot change one of
  these without failing the manifest's SHA-256 first.

**5. The icon gallery keeps its route.** See the separate entry below — the measurement changed the
answer.

**6. The acceptance thresholds were estimates, and one was not met.** The issue predicted
`< 12,000` lines and a `≥ 2 MB` drop in `apps/docs/public/r`. Measured on the branch head:
**12,951 lines** (from 79,078, −83.6%; 599,280 bytes from 2,158,838, i.e. 0.57 MiB from 2.06 MiB)
and a **1.56 MiB** registry drop (4,697,592 → 3,061,351 bytes, i.e. 4.48 → 2.92 MiB). Neither
threshold is met. The residual is upstream path geometry and Motion variant data — the per-icon
payload itself — so closing the remaining gap would mean discarding upstream choreography, not
removing duplication. The one lever that would move the line count is `printWidth`, and widening it
to hit `< 12,000` would be gaming the target rather than removing anything, so `printWidth` stays at 200. **Needs MK:** accept the measured numbers, or say which data should be dropped.

_Corrected 2026-09-07 (Codex round on PR #57): the figures first recorded here (12,823 lines,
1.57 MB) predated later commits on the branch and were never re-measured. Every number above is
re-measured at the branch head; `CHANGELOG.md` and the changeset carry the same figures._

**7. Formatting for generated data files.** A root `.prettierrc.json` now sets `printWidth: 200` and
`objectWrap: "collapse"` for the two icon directories only (no repo-wide options are set, so nothing
else changes). Without it the mirror's output and `pnpm format` would disagree and the mirror's
idempotency check would fail after anyone ran the formatter.

## 2026-09-07 — The icon gallery keeps its route; the refactor was the fix (issue #46)

**Decision:** Do not split `/docs/foundations/icons` into its own route segment.

- **Options:** (a) a dedicated `app/docs/foundations/icons/` segment; (b) remove `IconGallery` from
  the global MDX map and import it inside the MDX file; (c) leave the routing alone.
- **Why (c):** the gallery's own JSDoc records that (b) was already tried and measured — a dynamic
  `import()` isolated the wall into its own chunk but left `button.html`'s total script payload
  unchanged, because the catch-all `app/docs/[[...slug]]` route has **one** client-reference manifest
  shared by every docs page. Moving the import into the MDX lands in that same manifest, so it buys
  nothing. That leaves (a), which is the only mechanism that would work — and it is out of this
  issue's lane: the route slug is pinned in `component-contracts.json` and consumed by
  `tooling/lib/route-scope.mjs`, `verify-route-scope.mjs`, `verify-component-contracts.mjs`,
  `apps/docs/vrt/page-routes.ts` and `vrt-review.mjs`, all of which G1-a owns, and
  `apps/docs/app/**` is declared global for both pixel lanes so the change forces a full sweep on
  every subsequent edit.
- **What the refactor itself did to the number — measured, with a caveat.** After this change every
  docs page loads 26 scripts totalling **3,645 KB**. The gallery's JSDoc records **3,873 KB** for the
  same page before it. That is a ~228 KB improvement, but the two figures were taken on different
  content at different times and **the baseline was not rebuilt here**, so treat the delta as
  indicative rather than exact. The shared-manifest problem is unchanged: every docs page still
  carries the wall.
- **Revisit — this is still the largest client cost on every docs route.** A dedicated route segment
  remains the right fix and should be scoped as its own issue against the route-scope owners.
  **Needs MK.**

---

## 2026-09-07 — Di1 display leaves: three calls the batch brief did not settle

**Decision:** delete every reduced-motion copy — including the one that looked load-bearing, by fixing the global reset instead; leave `CommandShortcut` as plain text; leave the `TruncationFocusProvider` consumption side to T1.

- **The two `data-drag-pending` `motion-reduce:` copies went.** Options: (a) keep them and write the doctrine around them, as the in-progress draft did; (b) delete them and state the rule without an exception. Chose (b): the global reset makes them provably redundant (`animate-pulse` rests at `opacity: 1`, and the reset caps the animation at one 0.01ms iteration), and a doctrine that carries a false exception is worse than one with none. `design.md` and `docs/ledger/bugs.md` both record the reasoning. Registry source now holds **zero** `motion-reduce:` utilities.
- **The last surviving `motion-reduce:` was removed by widening the reset, not by keeping an exception (uncovered by the decision register — flagged for MK).** `staggered-text-reveal` zeroed its own per-word `animation-delay` under reduced motion, and that was genuinely load-bearing: `base.css` zeroed `animation-duration` and `iteration-count` but never `animation-delay`, so without the component's copy a reduced-motion reader still watched words appear one after another across the whole stagger window — instant pops in sequence, which is still motion. Options: (a) keep it as the doctrine's one permanent carve-out, as the in-progress draft did; (b) add `animation-delay: 0s !important` / `transition-delay: 0s !important` to the reduced-motion block and delete the copy. Chose (b): `design.md` §Motion now states "reduced motion is global and is never restated in a component", and a rule with a standing exception is a rule that erodes — and the exception existed only because the reset was incomplete, which is a defect in the reset, not a property of the component. `staggered-text-reveal` is the ONLY `animation-delay` user in the repo, so the blast radius of the widened reset is that one component plus any future consumer-authored delay, where zeroing is the correct behaviour anyway. Cost: this touches `@vegastack/design-tokens` published CSS (minor changeset), which is a wider surface than a display-leaf batch would normally move. **Needs MK:** confirm the reset is the right home for this rather than a documented per-component exception.
- **`CommandShortcut` was NOT converted to `Kbd`,** despite the batch task line asking for it. Two authorities say otherwise and both outrank the task line: the audit finding itself (`02-batch-02-display-leaves.md` B2-07) defers `command.tsx`'s shortcut chips to Batch 3, and `command.tsx`'s own source carries a prior audit-reviewed decision that palette shortcut hints are plain muted text on purpose — chip-styled keys would make every palette row read busier than the menus beside it. Converting it would have re-opened a settled call and stolen scope from O1. **Flagged for MK:** if the intent really is chips in the palette, that is one render change in Batch 3, not here.
- **`TruncationFocusProvider` ships without its consumers.** `TruncatedText` / `IconText` / `TableCellText` / `RelativeTime` all take `focusable`, and the provider that sets a region-wide default is exported — but nothing wraps `DataList` / `DataGrid` in it yet, because those files belong to T1 (tables) and the brief made the wiring conditional on T1 having merged first. It has not. So the D9 default (`false` inside a grid) is currently reachable only by an explicit `focusable={false}` or a hand-placed provider. Docs and JSDoc were written to describe the mechanism and the contract rather than claim the hosts already adopt it. **T1 owes the two-line wrap.** Until then a truncated grid cell still takes a tab stop — the pre-existing behaviour, so nothing regressed; the fix just is not complete.

---

## 2026-09-08 — T2 judgment calls (chip tiers, the announcer's shape, what did NOT fold in)

**1. The chip tiers are `sm` 28px and `md` 32px — not 24px — and that forces a 2px hover inset.**

- **Options:** (a) `sm` = 24px (`--size-xs`), matching ComboboxChip's shipped height and closest to
  Tag's 20px; (b) `sm` = 28px (`--size-sm`), `md` = 32px (`--size-md`).
- **Why (b):** `design.md` §Components states the control scale as "**xs 24 (Button only)** / sm 28
  / md 32 / lg 40". A chip may not use the xs tier, and a 24px chip cannot hold a 24px remove
  control at all. So `sm` is 28px, and `Tag` grows 20 → 28px — the largest visible change in this
  batch.
- **The cost, stated plainly:** a 24×24 remove control inside a 28px pill leaves a **2px** inset,
  where §Hover geometry (F1's amendment 2) asks for ≥4px. 24px is a WCAG floor and 28px is the
  system's tier; they cannot both be honoured, and the target wins. Written into `design.md`'s Chip
  bullet rather than left as an undocumented deviation. **Flagged for MK:** the alternative is a
  32px-only chip, which would make every inline tag as tall as a Button.

**2. Chips are `rounded-full` at both tiers, so `FilterChip` stops being a rounded rectangle.**

- `design.md` §Shapes: "`full` is for inherently round / tag-like objects (avatars, switch tracks,
  badges/chips…)". `FilterChip` and `ComboboxChip` shipped `rounded-md`. One primitive cannot hold
  two radii without becoming two recipes again, and the doctrine already named the answer, so both
  moved to `full`. This is a visible change to the FilterBar and to combobox multi-select.

**3. `active` is a NEUTRAL-only promotion.**

- A chromatic hue already carries "this is a labelled thing"; layering a selection rung on top of a
  tinted fill would produce a colour no token defines. So `active` promotes only the neutral chip,
  `surface-1` → `surface-2`, and is ignored for a hue. Documented on the prop and in the docs page.

**4. `useAnnouncer` returns a component, and that forced an external store.**

- **Options:** (a) return the rendered element; (b) return a `useCallback`-wrapped component;
  (c) return a store-backed component memoised on a ref-held store.
- **Why (c):** the issue specifies `{ announce, Announcer }`, and (b) is a trap — a component whose
  _type_ identity changes is unmounted and remounted by React, which destroys the live region the
  platform is observing on every single announcement, i.e. it would silently break the thing the
  hook exists to guarantee. (c) keeps one stable type for the hook's life and, as a bonus, keeps
  announcement state out of the host. ~40 extra lines, all of them load-bearing.

**5. The hooks' `getLiveRegionProps()` was renamed, not kept alongside.**

- `useDragReorder`/`useFileDrop` now return `Announcer`. A props-getter cannot express "this node
  must stay mounted for the component's life", which is half the contract. Per the batch mandate —
  no shims — the old getter is gone; Board, SortableList and Dropzone (and their tests) are
  updated. **Cross-batch note for MK:** those three files are not in T2's stated file list but had
  to move with the API.

**6. CopyButton's live region no longer blanks after the timeout.**

- It used to render `copied ? copiedLabel : ""`, so the region emptied when the button reverted. A
  live region is announced when its content _changes_; blanking it is a second, silent mutation for
  no benefit, and the stale text is never read on its own. The region now keeps "Copied", and a new
  test proves that copying twice in a row still re-announces (previously it could not — the
  same-string setState was a React bail-out).

**7. What deliberately did NOT fold into Chip.**

- **`Badge bordered`** stays a Badge (the audit says so): status voice, never removable, never a
  selection. **`ToolCallChip`** and Tabs' `chip` variant were not touched — the first is an AI
  surface with its own state machine, the second is N1's `selectedChip` recipe.

**8. Two files outside the batch's stated boundary were edited, both unavoidably.**

- `tooling/design-lint.mjs` — `RAW_INTERACTIVE_EXEMPTIONS` for `tag-group.tsx` drops from 2 raw
  `<button>`s to 1 (tag removal is now `ChipRemove`); the counts are exact, so leaving it would
  fail the gate. The brief explicitly permits this one.
- `tooling/verify-component-contracts.mjs` — the inventory expectations are hard-coded there as a
  second authority (`totalRegistryItems`, `components`, `hooks`, the per-wave counts and member
  lists). Adding any registry item requires editing it. **Flagged for MK:** that duplication means
  every future component batch edits a gate script; deriving those numbers from
  `component-contracts.json` and keeping only the _self-test_ hard-coded would remove the class.

---

## 2026-09-07 — Fo1 forms: five calls the issue did not settle

- **`fieldControl` is a class STRING in `@vegastack/design`, not a `cva` exported from `input.tsx`.**
  B1-11's fix note suggested the latter. Two reasons against it: `input.tsx` is a registry item, so
  every consumer of the recipe would have taken a `registryDependency` on Input purely to import a
  string (the Select trigger does not otherwise depend on Input), and the recipe is chrome with no
  variant axis of its own — each control still adds its own size and layout classes, which is what a
  `cva` would have implied it owned. It lives beside `surfaceInteractive` and `fillInteractive`,
  which are the same shape and the same idea.

- **A second recipe, `fieldControlGroup`, rather than one recipe with `has-*` selectors.** The
  wrapper reads its state through `focus-within` / `has-aria-invalid` / Base UI's `data-focused`; the
  control reads its own pseudo-classes. Folding both into one string would have every field carrying
  the selectors it cannot use, and `twMerge` cannot collapse them because they are different
  variants. Two strings, one comment each explaining which is which.

- **`Spinner` keeps accepting `label=""`.** B8-09 asked for a `decorative` prop "instead of an empty
  string", which reads as a removal. It was not removed: an empty accessible name is how the whole
  system says "this has no name" (`StatusIcon` does the same), so removing it here would make Spinner
  the exception rather than the model, and the remaining `label=""` call sites are in `command.tsx`,
  which is O1's file boundary. `decorative` is now the sanctioned spelling and the docs say so.
  **For MK:** if the intent was a hard removal, it is a one-line change plus four call sites, and it
  should be done in one pass across `Spinner` and `StatusIcon` together rather than half of it here.

- **`FieldInline`'s `readOnly` folds into the hook's `disabled`.** The hook has one blocking flag, not
  two. To its state machine `readOnly` and `disabled` mean the identical thing — an edit may not be
  entered, and one in flight reverts — and they differ only in chrome, which stays in the component
  (`readOnly` drops button semantics entirely; `disabled` keeps the role and dims). A second flag
  would have been a distinction the machine never uses.

- **`CheckboxGroup` has no `orientation` and no `CheckboxGroupItem`.** A checkbox list reads
  vertically; a horizontal row of independent tick boxes is a toolbar or a ToggleGroup. And a child is
  a plain `Checkbox` with a `value`, exactly as Base UI composes it — a wrapper whose only job is to
  forward every prop adds a component and hides where `value` goes. Both are reversible if a consumer
  needs them; neither is worth shipping speculatively.

## 2026-09-07 — F1 surface ladder: eye-tuned rung values and the `bg-muted` mapping

**Decision:** ship the ladder at values that differ from `03-proposals.md` §P1's start values wherever the contrast gate said P1's number could not hold, and keep `bg-muted` on the sites where it already means "rung 1".

- **Dark rungs moved down from P1.** P1 proposed dark `surface-1/2/3` = 0.245 / 0.275 / 0.305. Shipped: **0.236 / 0.269 / 0.290**. The binding constraint is `muted-foreground` on the pressed rung: at P1's 0.305 it measures **4.31:1**, under the 4.5:1 AA floor the token build gates; 0.290 measures **4.54:1** and is the highest rung that clears. 0.269 and 0.236 are the existing `neutral.800`/`neutral.850` primitives, which keeps the ladder on the shared ramp instead of inventing two one-off values, and preserves the ~0.03 L dark step the references use. A new primitive `neutral.750` (0.29) was added for the pressed rung.
- **Light rungs kept P1's spacing, on-ramp.** 0.970 / 0.945 / 0.922 (P1: 0.970 / 0.945 / 0.920). `neutral.150` was retuned 0.955 → 0.945 so the three light rungs sit one even ~0.025 L apart; 0.922 is the existing `neutral.200` rather than a new 0.920, a 0.002 difference no eye resolves.
- **Alphas came out higher than P1's estimate.** P1 guessed `--alpha-hover` ≈5% and `--alpha-pressed` ≈9%. Shipped **7%** and **10%**, chosen by measuring the composite rather than guessing: `foreground` at 7% over the page lands at L 0.943 light / 0.267 dark, within 0.003 of the opaque `surface-2`; at 5% the alpha twin was visibly weaker than its opaque counterpart, which defeats the point of having twins. `--alpha-border` is P1's 8% / 14% unchanged (Geist `gray-alpha-400`).
- **The `bg-muted` mapping.** The audit's 87 `bg-muted` fills were NOT rewritten wholesale. `muted` is an alias of `surface-1`, and `surface-1` is exactly "rest fill of a filled control, and every well/track" — which is what the overwhelming majority of those sites already are (kbd, skeleton, code block, slider rail, progress track, disabled field, tooltip, avatar fallback, badge). Rewriting them to `bg-surface-1` would have changed 40 files for zero pixel and zero semantic difference, against the "delete what the audit says to delete, don't churn" mandate. What was migrated is the thing that was actually broken: every **`hover:`** literal (33 sites), which is now the recipe. Sites where the role was genuinely wrong were fixed individually — the toast action/cancel buttons (rest fill that never hovered), and ComparisonMatrix/PricingSection/the block empty state (`info` used for promotion). New code is told to name the rung; existing correct uses of the alias were left alone.
- **P1's "bordered elements hover by border, not fill" is deliberately NOT applied to outline buttons and cards.** Issue #32's Do-list §3 explicitly maps those sites to the `surfaceInteractive` recipe (a fill), Button variant mechanism is F2's scope, and a 1px hairline moving is below the state probe's visibility threshold — a border-only hover would have left `hover-invisible` non-zero, which is F1's acceptance criterion. **Flagged for MK:** if the intent was genuinely border-only hover on bordered controls, that is a one-line change in F2.
- **Status text inks were re-tuned to buy the soft pressed rung headroom.** Adding `<family>-subtle-active` (a second wash rung over `-subtle`) put `destructive/success/warning/info-text` at or under AA on their own pressed fill — light blue was worst at 4.50:1 on hover with nothing left. Each ink moved 0.015–0.04 L (darker in light, lighter in dark). Every other pair only gains contrast. This was not in the issue text but is forced by it: without the move there is no pressed step on soft buttons.

## 2026-09-07 — Do1-a judgment calls (docs canon, chrome, export gates)

**1. `dataAttributes` is extracted from source, not hand-typed.**

- **Options:** (a) hand-write the `data-*`/CSS-variable inventory into 110 contract records;
  (b) extract it from the canonical source in the generator and have the verifier check it.
- **Why (b):** 331 parts and 493 attributes is more than anyone will keep correct by hand, and a
  hand-typed inventory that drifts is worse than none — it documents attributes the component
  stopped rendering. `verify-component-contracts.mjs` now walks each exported part's own function
  body through the TypeScript AST, records literal values (and `values: []` where the value mirrors
  a prop), and fails when the field drifts; `--write-data-attributes` resyncs it. The field stays in
  the contract so the docs read one authority, but no human types it.
- **Revisit:** attributes rendered by an unexported helper a part composes are attributed to the
  helper, so they do not appear. That is deliberate — the contract records what a part's own
  function paints — but if a component ever moves its `data-slot` into a shared helper the table
  will silently shrink.

**2. The Explorer policy (DD-3) is applied per page, not by deleting every Explorer.**

- **Decision:** the 24 Story files whose pages already carry a curated `PropsPlayground` are
  removed; the 6 pages with no playground (audio-player, label, marker, password-input, slider,
  video-player) keep theirs. Verified by cross-checking the deleted set against every page matching
  a `*Playground` usage: within the 30 pages that had a Story file, the two sets are exact
  complements.
- **Measured, across all 110 component pages: 45 curated playground · 6 Explorer · 59 neither ·
  0 both.** "Neither" is the canon, not a gap: canon row 6 reads "Playground _(where curated)_" and
  DD-2/3 sanctions the Explorer only where no curated playground exists — a permission, not a
  requirement. An earlier draft of this entry said "no page left with neither", which was false and
  would have read as an obligation to put an interactive surface on all 110 pages.
- **Mechanism, not just state:** `verify-docs-export.mjs` fails any page carrying BOTH and any
  Explorer rendered outside `<StoryExplorer>`, with negative self-tests for each and an accepting
  fixture for "neither", so the policy holds as Do1-b migrates the rest rather than depending on
  this one sweep. It does not, and must not, require either.

**3. The "## Installation" heading is not renamed here.**

- **Options:** (a) rename it to the canon's "Install" on the three reference pages and teach
  `verify-component-contracts.mjs` to accept either during the migration; (b) leave the heading and
  change only the section's CONTENT to the generated form.
- **Why (b):** (a) means a dual-accept transitional rule — the kind of shim the audit mandate
  rejects — living in the verifier for a whole wave. The rename is one atomic Do1-b change across
  all 110 pages plus the verifier plus AGENTS.md. The valuable proof here is that the section is
  GENERATED, which (b) demonstrates fully.

**4. The emitted-CSS lane judges what reaches the page, not which rules exist.**

- Two findings on the first run were not defects. `@tailwindcss/typography` writes its heavy
  heading weights inside `:where()`, which contributes zero specificity — an overridable default,
  and unfixable at its source since the plugin owns it. And `.bg-neutral-900` exists in the built
  CSS only because Tailwind scans the foundations pages, which document that class as a Don't; no
  element carries it.
- **Decision:** the lane clears a `:where()` default only when the stylesheet also carries a real
  override for that element, and reports a palette utility only when it appears in a `class=`
  attribute of the built HTML. Both keep the gate falsifiable — delete the override in `global.css`
  and all ten findings return — while refusing to report the documentation of a rule as a violation
  of it.

**5. Two transitional aliases are kept for Do1-b, deliberately and recorded here.**

- `AutoTypeTable: ApiTable` in the MDX map, so the 107 pages that still author the legacy name
  render the new flat table without a body rewrite; and the slug-inferred `registry` frontmatter
  fallback in `app/docs/[[...slug]]/page.tsx`, so a page that has not yet declared `registry:` still
  resolves its item.
- **Why they are not shims in the mandate's sense:** each exists to let ONE atomic rename happen in
  Do1-b (rename the usages on all 110 pages; make `registry` required in `source.config.ts`) instead
  of a 110-page rewrite inside this batch. **Do1-b must remove both**; its acceptance requires it.
  No gate is added here to force their removal — a gate that fails on the current tree is not a
  gate, and Do1-b's own acceptance is the enforcement.

**6. The fullscreen dialog's background isolation is asserted as `aria-hidden`, not `inert`.**

- **Measured while writing the browser assertion:** `@base-ui/react` 1.6.0 isolates the background
  with `aria-hidden="true"` plus a `data-base-ui-inert` marker, and does NOT set the `inert`
  attribute on outside elements. `FloatingFocusManager.mjs:340-345` calls
  `markOthers(insideElements, { ariaHidden: modal, mark: false })` and then `markOthers(floating…)`
  for the marker; `inert` is a supported option of `markOthers` (`markOthers.mjs:147-157`) that Base
  UI never passes `true`. An assertion on `[inert]` therefore fails against a correctly-working
  modal dialog — it did, in all four Chromium projects, before this was measured.
- **Options:** (a) assert the mechanism Base UI actually implements; (b) add `inert` ourselves in
  `dialog.tsx` so the stronger attribute is present.
- **Why (a):** modality here rests on the focus trap + `aria-hidden` + the backdrop, which is
  complete for keyboard and assistive tech; `inert` would additionally block pointer and
  find-in-page, a marginal gain. And `dialog.tsx` is a registry source Do1-a deliberately does not
  touch — a component change smuggled in through a docs batch is exactly the collision the wave
  plan exists to prevent. The prose that claimed `inert` (the spec comment and
  `preview-controls.tsx`) is corrected to say what is true.
- **Revisit:** if a component batch that owns Dialog wants pointer/find-in-page isolation too, the
  assertion tightens to `[inert]` in the same commit.

**7. `<Wrapper>` is unwrapped from the emitted fixture source.**

- The extractor drops the docs-only `./wrapper` import, which left `<Wrapper>` in the snippet
  referencing an undefined component — the code shown to humans and agents did not compile. It is
  now replaced by its children, or by a fragment where the frame has sibling children (the frame is
  usually the returned root, so a plain unwrap would produce adjacent JSX with no parent). Verified
  across all 446 `ComponentPreview` usages: zero extraction errors, zero `Wrapper` residue.

##

## 2026-07-24 — GitHub Team approval boundary

**Decision:** Keep the already-working repository secrets and use reviewed merges/manual dispatches instead of GitHub environments.

- **Options:** (a) retain environment jobs that cannot exist on the current private Team plan; (b) move to a Team-compatible reviewed-PR and dispatch model; (c) upgrade the organization before any release.
- **Why (b):** GitHub history proves npm OIDC trusted publishing and Cloudflare deployment work with the present repository variables/secrets. The unavailable environment added a deadlock, not protection. Independent review, explicit MK approval at each ship boundary, least-privilege job permissions, protected workflow structure, Sigstore verification, and post-deploy Access probes retain the enforceable controls.
- **Revisit:** If Enterprise Cloud is enabled, required-reviewer environments may replace the procedural MK gates without changing publish/deploy mechanics.

## 2026-07-24 — Independent version lines

**Decision:** Keep the design-system/registry release at `0.3.0` and the two linked public npm packages at `0.2.0` rather than forcing every workspace package to share one number.

- **Options:** (a) force all package and system versions to match; (b) version each distribution contract independently while keeping the public pair linked.
- **Why (b):** `@vegastack/design` and `@vegastack/design-tokens` are a linked consumer surface and advance together; the private registry workspace has already advanced on a different line and its version is stamped into registry items. Artificial alignment would create unrelated bumps and would not improve compatibility. Changesets and the registry remain the machine authorities; prose never supplies the current version.

## 2026-07-24 — Public-docs cutover pause without environments

**Decision:** Model cutover as separate `prepare` and `verify` workflow dispatches; ordinary deployments remain the default.

- **Options:** (a) one workflow run with an unavailable environment pause; (b) one run with a timed/implicit pause; (c) two explicit dispatches around the manual Cloudflare Access change.
- **Why (c):** the required human change happens outside GitHub and must be independently approved. Separate dispatches produce an auditable stop while ordinary deploys continue to prove the current protected boundary and cannot accidentally opt into the one-time public transition.

## 2026-07-24 — VRT bootstrap sequencing

**Decision:** Do not synthesize or update screenshots on macOS; push the reviewed branch, run the pinned-Linux update workflow, review the full artifact, then commit it before release.

- **Why:** the release/deploy gates define Linux pixels as the contract. The local machine can prove render/type/a11y behavior, but committing platform-different images would weaken the blocking visual check. The pinned-Linux bootstrap is now complete: the shared capture/verifier route authority proves all 876 required images, so this blocker is resolved.

## 2026-07-24 — VRT route inventory authority

**Decision:** Share a typed route inventory between the Playwright capture spec and the completeness verifier; do not parse test source text to infer expected baselines.

- **Options:** (a) broaden the verifier's quote-matching regular expression; (b) keep independent route arrays; (c) import one data-only route module from both capture and verification.
- **Why (c):** the original single-quote parser silently omitted 17 double-quoted fixed routes and understated the four-lane contract by 68 images. A shared data module removes the lexical failure mode and retains exact-set, PNG-signature, and lane-width checks.
- **Verification:** the Linux artifact contains exactly 876 accepted images, byte-matches the copied snapshot tree, and the corrected verifier reports no missing or orphaned paths.

## 2026-06-21 — Token pipeline transform choice

**Decision:** Replaced detail/02 §2's `TRANSFORMS = [...,'size/rem','time/seconds']` with custom `dimension/css`/`duration/css`/`cubicBezier/css`/`fontFamily/css` transforms.

- **Options:** (a) use the spec's built-in `size/rem` + `time/seconds`; (b) custom transforms.
- **Why (b):** the built-in `size/rem`/`time/seconds` operate on NUMBER `$value`s, but DTCG 2025.10 `dimension`/`duration` `$value`s are objects `{value,unit}` and `cubicBezier`/`fontFamily` are arrays — the built-ins would mis-handle them. Custom transforms emit exact CSS (`0.625rem`, `150ms`, `cubic-bezier(...)`, quoted multi-word families).
- **Verification:** 87/87 token values match the platform; theme.css `:root`/`.dark`/`@theme inline` correct.

## 2026-06-21 — Token two-layer authoring (primitive aliasing vs direct values)

**Decision:** Authored a full primitive palette (neutral ramp + named chromatic anchors) and aliased ALL semantic colors to primitives (overlay is the one direct value — it carries alpha).

- **Options:** (a) direct oklch values in semantics (fidelity, no two-layer); (b) full primitive→semantic aliasing.
- **Why (b):** requirements §5.1/§7.5 mandate the primitive/semantic two-layer normalization; aliasing is the correct DS architecture and what reviewers expect. Exact fidelity preserved (verified 87/87).

## 2026-06-21 — pnpm build-script approval

**Decision:** Set `allowBuilds: { esbuild: true }` in `pnpm-workspace.yaml` (harness build-approval mechanism) + `onlyBuiltDependencies` for esbuild/@tailwindcss/oxide/sharp. esbuild's postinstall is required for tsup. Safe: local-only build, trusted deps.

## 2026-06-21 — a11y testing: axe-core direct instead of vitest-axe

**Decision:** Use `axe-core@4.12.1` directly via `test/a11y.ts` helper instead of the `vitest-axe@0.1.0` matcher.

- **Why:** `vitest-axe@0.1.0` calls `module.createRequire` which is unavailable under `@vitest/browser` (browser mode) → import crashes. axe-core is the SAME engine (pinned 4.12.1), runs WCAG 2.1 A/AA, and works in-browser. Same coverage, browser-compatible. (Detail/05 itself flags vitest-axe as lightly maintained.)

## 2026-06-21 — Component source layout: flat registry/ dir (shadcn-canonical)

**Decision:** Author copy-in components at `packages/ui/registry/ui/<name>.tsx` (flat) rather than detail/05's `src/components/<name>/<name>.tsx` (nested).

- **Why:** the flat `registry/` layout is the shadcn registry convention; it maps 1:1 to the consumer's `@/components/ui/<name>` copy-in target and lets the docs app dogfood via `shadcn add`. Components import `cn` from `@vegastack/utils` (per detail/05 CVA example) and siblings via `@/components/ui/<name>` (shadcn rewrites on add). tsconfig+vitest path aliases resolve these in-repo. `@vegastack/ui` npm package ships the provider + locked components (G22).

## 2026-06-21 — vitest browser mode retained (not jsdom)

**Decision:** Kept the spec's Vitest browser mode (Playwright Chromium) for unit+a11y; it launches reliably here. Real-browser focus/render fidelity > jsdom. Playwright `toHaveScreenshot` VRT remains deferred (Docker) per operating mode.

## 2026-06-21 — CommandMenu built on cmdk (not pure Base UI)

**Decision:** CommandMenu (registry `command`) uses `cmdk` (the platform's choice + the industry-standard headless command primitive) rather than a hand-rolled Base UI filter list.

- **Why:** cmdk is MIT, headless, battle-tested, and is exactly what the platform used; re-implementing fuzzy filter + keyboard nav on Base UI would be lower-quality. cmdk's `aria-required-children` quirk is disabled in its test with a documented reason; cmdk renders client-side (SSR→null), acceptable for an interactive ⌘K palette.
- **Revisit:** if a pure-Base-UI command is later desired, swap the internals (the flat export surface stays the same).

## 2026-06-21 — Flaky tooltip test

**Note:** `tooltip.test.tsx > content is not shown until the trigger is interacted with` failed once in a full-suite run, passes in isolation (Base UI tooltip open/close timing in headless). Not a component bug. Flagged for the bug-hunt to harden the timing assertion.

## 2026-06-21 — Self-correction judgment calls (no pause; logged for MK)

- **`onValueChange` as the value-emitting prop name (text-edit, filter-bar):** chose the system convention (`Switch`/`Checkbox`/`Slider`/cmdk all use `onValueChange`/`onCheckedChange`) over the DOM-y `onChange`. Kept `TextEdit.onChange` as a `@deprecated` alias to avoid a hard break for any early consumer; `FilterBarSearch` is a fresh nested config object with no installed base, so it gets `onValueChange` only. **Alternative considered:** leave `onChange`. **Why not:** inconsistent with the rest of the surface and invites confusion with the native input event.
- **Registry `dependencies` = direct imports only:** set each item's `dependencies` to exactly what its source imports, with two deliberate exceptions kept despite not appearing as a TS import — `@vegastack/tokens` (the CSS token/theme foundation every component renders against) and `@tiptap/pm` (a required peer of `@tiptap/react`/`starter-kit`). **Alternative:** keep the broader sets "to be safe." **Why not:** over-declaration installs packages the consumer doesn't need and misrepresents the dependency graph; `registryDependencies` already pull sibling components (which carry their own deps).
- **Excluded the VRT scaffold from the docs tsconfig rather than installing `@playwright/test`:** VRT is day-deferred until the pinned Playwright Docker image (operating mode). Installing Playwright locally just to satisfy the typecheck would contradict the deferral and add a heavy local dep. Excluding `playwright.config.ts` + `vrt/` from the Next typecheck keeps the scaffold in the repo for CI while unblocking the local static build.

## 2026-06-21 — Codex round 1 resolutions (judgment calls)

- **Ref forwarding via React-19 ref-as-prop, NOT `forwardRef`:** the 24 pre-existing forwardRef components were left as-is (they work), but all NEW ref support uses the ref-as-prop pattern (`ComponentPropsWithRef` + destructure / `useRender({ ref })`). **Why:** `forwardRef` is deprecated in React 19; ref-as-prop is the modern idiom and composes with `useRender`'s `ref` param. Mixing the two is fine in React 19. **Alternative:** convert everything to one style — rejected as churn with no behavior benefit.
- **Composite-orchestrator ref targets:** color/emoji/country-select forward `ref` to their `PopoverTrigger` (the focusable root; the panel is portaled). state-select/text-edit/field-inline forward to their own root host. sonner is documented N/A (mount-once portal toaster that drops unknown props — no single host root). **Why:** §7.6 "forwarded ref" applies where a component owns a referenceable host; for portal-only compositions it doesn't, and forcing a non-functional ref would mislead.
- **MED-1 color-contrast coverage — VRT is the contrast gate, unit disables kept (justified):** the 3 unit a11y tests that disable axe `color-contrast` (color-picker, sonner, text-edit) keep that disable. **Why:** the vitest browser run compiles NO Tailwind/token CSS (fast structural a11y: roles/names/ARIA), so semantic color tokens don't resolve and `color-contrast` would report FALSE failures — the disables avoid false-positives, they don't hide real issues. Real contrast is gated by the compiled-CSS Playwright VRT (now a real, separate, wired workflow — `.github/workflows/vrt.yml`), which is the design's §7.7 contrast acceptance gate, deferred to the pinned Docker image per the build-LOCAL-stop operating mode. color-picker's disable is additionally fundamental: its swatches are DYNAMIC user-supplied colors (`style={{backgroundColor}}`), not design tokens, so they're un-checkable by a token contrast rule regardless of CSS. **Alternative considered:** compile Tailwind+tokens CSS into the vitest browser run to check contrast locally. **Why not (at the time):** it might surface token-level findings whose only fix is changing the locked OKLCH palette.
  > **UPDATE (Codex round 3 — this alternative was ADOPTED):** the compiled-CSS contrast gate WAS implemented — `packages/ui/test/contrast.browser.test.tsx` (+ `test/contrast.css` + `@tailwindcss/vite`) compiles the token theme and runs axe `color-contrast` on rendered components in BOTH themes. It DID surface real sub-AA dark/soft variants, which were fixed by ADJUSTING the failing token values to meet AA (not re-architecting the system): dark success/info/destructive brightened with dark solid foregrounds, light success darkened, alert `opacity-90` removed. The 3 unit disables stay (no-CSS false-positive avoidance) but now have an active compiled-CSS compensating gate — superseding the "VRT is the only contrast gate" framing above.

## 2026-06-21 — Codex round 2 HIGH-2/HIGH-3: DataList + TextEdit port scope (DECISION FOR MK)

**Decision:** Resolved by HONEST RESCOPE (the resolution Codex explicitly offered: "split/rename as a smaller primitive and update docs/matrix honestly"), NOT by porting the platform's full feature set.

- DataList ships the presentational data table (columns/render/selection/sort-signal/loading/empty); the platform's search · pagination/load-more · drag-reorder · board-Kanban · grouping · view-persistence are host-composed/app-coupled or a future `data-grid`.
- TextEdit ships the base editor (controlled HTML + StarterKit toolbar + placeholder + read-only); the platform's image-upload · @mentions · markdown-IO · emoji · task-lists · code-block-lang · submit · min/max-height · Yjs collab are app-coupled or future composed addons / `text-edit-collab`.
- Made the scope EXPLICIT (no longer "materially false"): a **Scope** section in each component's JSDoc + docs MDX page, and a matrix note clarifying the green cells reflect the documented presentational-core contract, not platform parity.
- **Why not port the full features:** the dropped behaviours are app-coupled (storage/R2 for upload, app data for mentions, persisted state for views/order) or large separate modes (Kanban, CRDT collab) — porting them into a presentational primitive contradicts the locked G7 presentational/app-coupled split + the build-LOCAL/no-over-engineer operating mode.
- **FLAG FOR MK:** if you want full platform parity for these two flagship components, that's a dedicated follow-up (`data-grid`, `text-edit-collab` + extensions). I scoped them as presentational cores per G7; confirm whether that's the intended product contract or whether full ports should be built.

## 2026-06-21 — Codex round 3 HIGH-5 (re-raised): DataList/TextEdit — DECISION + IMPASSE flag for MK

Codex round 3 escalated the DataList/TextEdit scope to HIGH again, wanting EITHER full platform-parity features OR a real status downgrade + explicit replacement components with migration tests. This is a genuine product-decision impasse between Codex's "port everything / none dropped" stance and the LOCKED G7 presentational/app-coupled split (+ the build-LOCAL/no-over-engineer operating mode). I did the maximum defensible within the locked decisions:

- **Added G7-aligned presentational composition affordances** (NOT the app-coupled logic, which G7 keeps host-side): DataList → `onRowClick` (activatable, keyboard-accessible rows), `toolbar` slot (host search/filter mount), `footer` slot (host pagination mount). TextEdit → `onSubmit` (Cmd/Ctrl+Enter), `minHeight`/`maxHeight`. These make the host-composition pattern ergonomic without DataList/TextEdit owning search/paging/upload/mentions logic.
- **Genuinely downgraded the matrix status:** DataList/TextEdit are now `◐ core` (built as the presentational core — a documented subset), Group tagged `(core)`, legend + the "every column ✅" framing updated; they no longer claim platform parity.
- **Migration guidance** added to each docs Scope section (how the host composes search/paging into the slots) + the app-coupled deferrals enumerated.
- **IMPASSE FLAG FOR MK:** full platform parity (drag/Kanban/grouping/persistence for DataList; upload/mentions/markdown-IO/collab for TextEdit) would require either contradicting the locked G7 split (putting app-coupled logic in the primitives) or building dedicated `data-grid` / `text-edit-collab` components with migration tests — a large, unsanctioned scope expansion. **MK must decide** whether to commission those full-parity components. Until then these ship as the documented presentational cores. If Codex keeps flagging HIGH-5, it is this product decision, not a code defect.

## 2026-06-21 — Codex round 4: HIGH-5/HIGH-1 impasse RESOLVED via formal re-scope (no longer an MK blocker)

The round-3 DataList/TextEdit impasse is resolved by Codex's own accepted path (b): I FORMALLY re-scoped them in requirements §12 as first-class inventory items at the presentational-core / base-v1 scope, with full-parity `data-grid` / `text-edit-collab` as SEPARATE deferred inventory items. The matrix no longer carries ◐ "exception rows" — they're ✅ complete _for their defined scope_, which is honest (the inventory defines the scope). This aligns with the locked G7 split and needs no new architecture decision (it clarifies §12 to match G7). MK can still later commission the deferred full-parity components, but the completion gate is now honest WITHOUT requiring that — so it is no longer a blocker.

## 2026-07-25 — Locked decision reversed: committed-baseline VRT removed; CI moved to self-hosted mac minis

**Decision.** The locked "VRT is day-one" decision (AGENTS.md § Locked decisions) is reversed.
Committed screenshot baselines, `.github/workflows/vrt.yml`, and both `vrt-gate` jobs are deleted.
Visual verification is split in two:

- **Behaviour is the CI gate.** `apps/docs/vrt/contracts.spec.ts` — 768 checks over every component
  route (320px reflow, RTL containment, forced-colors focus, effective 24px pointer targets). No
  screenshots, no baselines, runs on any OS, cannot be cleared by regenerating its own evidence.
- **Pixels are a local review step.** `tooling/vrt-review.mjs` captures the branch's merge-base and
  the working tree on ONE machine, then emits `.vrt-review/report.json` plus before/after/diff PNGs
  for a human — reading them with their agent — to classify during `/ship`. Nothing is committed.

Every job except npm publishing and `deploy.yml`'s signing, deploy, and boundary probes now runs on
`[self-hosted, vsk-runners-mac-mini]`.

**Evidence this was the right reversal, not a convenience.**

- _VRT never caught a product bug here._ "VRT baselines absent" was raised as HIGH twelve times in
  `codex-rounds.md` and marked IRREDUCIBLE each time; baselines finally landed 2026-07-24. Every VRT
  entry in `bugs.md` is a defect in VRT's own machinery, not in a component.
- _Its original justification had already moved._ VRT was specified as the contrast/a11y acceptance
  gate (`design.md` §7.7). The entry above this one records that job moving to
  `packages/ui/test/contrast.browser.test.tsx`, which found real sub-AA dark tokens and got them
  fixed. Behaviour coverage likewise belongs to `contracts.spec.ts`, which caught a real forced-colors
  focus defect in `terminal.tsx` the day this decision was taken, and takes no photographs.
- _It was a review tool wearing a gate's clothes._ AGENTS.md § Verification ladder says "Every gate
  fails closed." Clearing a red pixel gate required regenerating the baselines — overwriting the
  evidence under review. It had a permanent escape hatch, so it never failed closed.
- _Committed baselines were unworkable for this team._ Screenshots compare only across identical
  platform AND CPU architecture, and 96 checks used `maxDiffPixels: 0`. Developers are on mixed macOS
  and Windows; CI is a third machine. No platform existed on which everyone could regenerate them, so
  every visual change required a CI round trip.
- _It ran four times per release._ The old `release.yml` classifier treated `^packages/design/` as
  visual, so a Version Packages PR — a pure version bump with no visual content — re-captured all 876
  screenshots. PR, main, version-PR merge, and deploy each paid ~72 minutes.
- _The failure it produced was undiagnosable._ Neither `vrt-gate` uploaded artifacts. Run
  `30115971397` failed after 1h12m and produced zero artifacts: no diff image, no trace, no report.
  That, not any runner choice, is what trapped the previous session in a loop.

**Portability of the contract lane — measured, not assumed.** The suite's tolerances were tuned
against Blink-on-Linux in the deleted pinned container (`OBSTRUCTION_INSET = 0.5` from a measured
pixel-snapping flip, a `>= 23.5` sub-pixel floor, a `scrollWidth <= clientWidth + 1` reflow check at
320px), and macOS Chromium differs in overlay scrollbars and font metrics. It was therefore run in
full on macOS ARM64 before the migration was trusted: **768/768 passed in 5.6 minutes**, including
every route previously flagged as tight on the 24px floor (attachment, code-block, filter-bar,
password-input, text-edit). Re-measure on the same terms if the assertions or the runner OS change;
do not re-derive the worry from the comments alone.

**Open gap for MK — nothing is a required status check.** `gh api
repos/VegaStack/vegastack-design/branches/main/protection` returns 404 and the only ruleset rule is
`deletion`. `ci.yml`'s contract job is called "the blocking visual-surface gate" but no branch
protection requires it, and `main` accepts direct pushes. `deploy.yml` therefore carries its own
unconditional `contracts-gate` — deliberately duplicating the PR run, because it is the last place
to catch a commit that reached `main` without one. Making `CI / verify` and `CI / contracts`
required checks is a repository-settings change and is MK's to make.

**What this gives up, recorded deliberately.** Nothing enforces layout drift in CI. A PR that breaks
a layout is not caught until someone runs `/ship`. Acceptable while MK ships; revisit if several
people begin merging component changes independently — the before/after tool can be pointed at a
PR's base ref with no redesign. Also unresolved: the `/internal/internal-projects` chromium-dark
pixel diff from run `30115971397`. It failed all three retries in one configuration and its baseline
commit was NEWER than the page's source commit, so it was not staleness. With zero artifacts it
cannot be diagnosed. Under this change it evaporates rather than gets answered.

**Judgment calls made while implementing, deviating from `docs/plans/2026-07-25-cicd-self-hosted-and-local-vrt.md`.**

- _The boundary-probe jobs stay on `ubuntu-latest`_ (the plan listed them for migration). This is
  correctness, not caution: `probe-precutover-protection.mjs` and `probe-deployment.mjs` assert that
  ANONYMOUS requests are rejected. A runner inside VegaStack's network can be silently authenticated
  by Cloudflare device posture, which would void the proof rather than merely risk it. A boundary
  test has to originate outside the trusted network. `deploy-curated` stays for the same reason the
  plan keeps `sign-curated`: credential-only, third-party actions, no repository code, nothing gained.
- _The terminal fix removes the transparent border as well as `outline-none`._ The plan expected a
  one-class removal. The shared outline is clipped both by the terminal root's `overflow-hidden` and
  by `scroll-fade-x`'s mask, so the fix is an INSET outline and the layout-reserving transparent
  border becomes dead weight. This makes the fix a 2px layout change, which is why it must land
  AFTER the migration PR rather than before it as the plan sequenced — under the old workflows its
  own pixel gate would have blocked it.
- _The visual classifier had to become diff-body aware, not just filename-based._ The first
  implementation subtracted `package.json`/`CHANGELOG.md` and claimed a Version PR merge would skip
  the browser gate. **That claim was false and was caught by testing it.** `pnpm run
version-packages` runs version-sync → `registry:build` → `registry-header.mjs`, which re-stamps
  `// @vegastack <name>@<version> sha256-<sha>` into every component source AND docs copy-in — 1082
  files, all matching the visual path list. No filename filter can distinguish that one-line comment
  from a real component change. The classifier now reads the diff body and drops
  provenance-header-only lines. Verified by executing the workflow's own shell against a
  synthesised Version Packages commit (`visual=false`) and against a real component change, a
  token change, and a prose-only change (`true`, `true`, `false`). It keeps `pnpm-lock.yaml`
  visual — a Base UI or Tailwind bump genuinely can break a reflow contract.
- _`tooling/verify-workflow-security.mjs` gained a `runs-on` allowlist._ The plan only required
  removing the `vrt.yml` assertions. Without a positive assertion, a job silently drifting back to
  `ubuntu-latest` would reintroduce billed capacity with no signal, and a job drifting off
  `ubuntu-latest` would break publishing or void a boundary proof. Job containers are now banned
  outright — on macOS they are not a portability warning, the job cannot run at all.

## 2026-07-25 — The mac minis cannot run browsers: a host bug found by the first real PR run

**What happened.** PR #4 was the first workload to ask these self-hosted runners for a browser.
Run `30131471680` failed both jobs identically:

```
<process did exit: exitCode=null, signal=SIGTRAP>
bootstrap_look_up org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)
No rendezvous client, terminating process (parent died?)
```

Chromium launches, cannot reach its parent's Mach port, and aborts. That is a missing per-user Mach
bootstrap namespace — the signature of an Actions runner installed as a **LaunchDaemon** (system
context, no user session) rather than a **LaunchAgent** inside a logged-in session.

**Why it is the host and not the code.** Deterministic across two independent jobs, two different
minis, and three Playwright retries each. The identical suite passes locally on the same macOS
version, same CPU architecture, and the same Playwright browser binary — 768/768, twice. Every
non-browser step on the minis succeeded: `setup-node`, pnpm, turbo, the token build, tsup, lint. And
no browser workload had ever run on these runners before, so nothing regressed; this simply had never
been exercised.

**Resolution.** The five browser jobs — `ci.yml`'s `verify` and `contracts`, `contracts-gate` in both
`release.yml` and `deploy.yml`, and `quality-gate` — are pinned to `ubuntu-latest` with
`playwright install --with-deps` (required there; `ubuntu-latest` is not a Playwright image). The
non-browser jobs stay on the minis: `changes`, `version-pr`, `ref-guard`, `build-curated`. The
reason lives in `GITHUB_HOSTED_JOBS` in `tooling/verify-workflow-security.mjs`, which fails closed on
any drift, so moving them back after the host is fixed is a one-line edit with a recorded rationale.

**For MK.** The runner fix is host-side and needs admin on the minis: reinstall the Actions runner as
a LaunchAgent in a logged-in session. Until then the migration is partial — the minis carry the docs
build and the release plumbing, not the test suites. The change that actually unblocked the release
was removing the 72-minute pixel gate, and that is unaffected.

**What this validates.** The diagnostics added in this same change worked on their first real
failure: the run uploaded a 29.6 MB `contracts-failure-<id>` artifact containing per-attempt
`trace.zip`, failure screenshots, `error-context.md`, and a browsable HTML report. Before this change
the same failure would have produced an exit code and nothing else — which is precisely how release
run `30115971397` became undiagnosable.

## 2026-07-25 — The contract lane is CPU-bound; parallelism has to come from machines, not workers

**Measured, in this order.**

| Run           | Config                                               | Result               |
| ------------- | ---------------------------------------------------- | -------------------- |
| `30132112459` | `ubuntu-latest`, Playwright's CI default of 1 worker | 768 passed, **1.4h** |
| `30136029776` | same runner, `workers: 4`                            | **752 passed**, 1.3h |

Raising workers bought nothing and cost reliability. The 16 failures were not random: the four most
control-dense routes — `message-scroller`, `hover-card`, `sidebar`, `data-list` — hit the 120s test
timeout in every project lane. `contracts.spec.ts`'s `focusViaKeyboard` walks the tab order one
`keyboard.press` + `evaluate` round-trip at a time, and on those routes it already runs close to the
timeout at one worker. Four workers on two cores removed the headroom without adding throughput,
because there was no idle CPU to claim.

**Resolution: shard across four runners** (`strategy.matrix.shard`, `--shard=$SHARD/4`), workers back
to 1. The split is exactly even — 192 tests per shard, verified with `--list --shard=i/4`. Wall clock
drops from ~1.4h to roughly a quarter of it; runner-minutes rise modestly because each shard repeats
the docs build. `fail-fast: false` so one shard failing still lets the others report, and each shard
uploads its own `contracts-failure-<run>-shard<n>` artifact. A matrix job's result is failure if any
shard fails, so `needs: contracts-gate` stays fail-closed.

**The real inefficiency is left standing, deliberately.** `focusViaKeyboard` is quadratic in
round-trips: it recomputes `maximumTabs` from every interactive element on the page — including the
entire Fumadocs sidebar, search, and TOC — and then Tabs through that chrome to reach each fixture
control. Fixing it would speed the lane up far more than sharding does, but it means changing the
mechanism of the one gate that currently protects the visual surface, and the plan lists changing
`contracts.spec.ts` as a non-goal. Worth doing as its own scoped change with its own verification.

## 2026-07-25 — The three-engine suite needs the pinned Playwright image; nothing else does

Release run `30140043824` passed all four contract shards and then failed `quality-gate` on **1 test
of 3765**: WebKit's compiled-CSS Toaster contrast check, `AssertionError: expected 1 to be +0` with
`Caused by: Matcher did not succeed in time`. The toast never reached its settled colour inside the
poll window on a two-core runner with no GPU, so axe sampled a mid-transition composite.

Not a contrast regression: the same suite passes in all three engines locally, and nothing in this
branch touched `sonner.tsx` or `contrast.browser.test.tsx`. What changed is the environment — that
suite used to run inside the digest-pinned Playwright image, and the migration had moved it to bare
`ubuntu-latest`.

**Resolution: `quality-gate` goes back into the pinned image.** Its `--with-deps` install is dropped
(the image ships the browsers), and the two container-specific workarounds come back with it — the
`safe.directory` trust for the host-mounted workspace, and `HOME=/root` for Firefox, which refuses a
HOME it does not own.

**Deliberately NOT restored elsewhere.** `ci.yml`'s Chromium lane, its WebKit/Firefox _smoke subset_,
and all four contract shards pass on bare `ubuntu-latest`. Only the complete three-engine suite is
this sensitive, so only it pays for the image.

**The container rule was wrong and is now correct.** This change had banned `container:` outright,
reasoning that containers are Linux-only and the runners are macOS. True for the self-hosted jobs,
false for the GitHub-hosted ones — and the blanket ban also discarded the digest-pinning assertion
that had protected the image reference. `tooling/verify-workflow-security.mjs` now bans containers
per-job on self-hosted runners and requires the pinned digest on GitHub-hosted ones. Both directions
negative-tested.

## 2026-07-25 — Release blocked by GitHub Actions billing, not by code

**State.** `main` is at `85d9818` with all of PRs #4/#5/#6 merged and seven changesets pending. npm is
still at `@vegastack/design@0.1.1` / `@vegastack/design-tokens@0.1.0`; there is no Version Packages PR
(`origin/changeset-release/main` is stale from the already-merged PR #1); the site has not been
redeployed.

**Why it stopped.** Release run `30143501843`: `changes` succeeded on `vsk-runner-mac-mini-2`,
`contracts-gate` was correctly skipped (`visual=false`), and `quality-gate` **never started** — no
runner was ever assigned. Its check-run annotation:

> The job was not started because recent account payments have failed or your spending limit needs to
> be increased. Please check the 'Billing & plans' section in your settings

Org usage this period: **20,412 Actions Linux minutes**, $24.15 billed past the included allowance.
No GitHub-hosted job can start until MK raises the spending limit or fixes the payment method. This
is an account action; an agent must not take it.

**Why it cannot be worked around.** `publish` hard-requires a GitHub-hosted runner — npm trusted
publishing does not support self-hosted ones and this repository holds no `NPM_TOKEN`. `quality-gate`
needs browsers, which the minis cannot launch (see the Mach-bootstrap entry above). So the npm
publish and the deploy chain are both gated on GitHub-hosted capacity.

**This change contributed to the overrun, and that is worth owning.** Moving the browser lanes to
`ubuntu-latest` shifted the most expensive jobs onto billed minutes, and getting there cost two full
~1.4h runs plus four sharded runs while the configuration was being found. The intended end state is
the opposite — with the minis fixed, the browser lanes move back and GitHub-hosted usage drops to
`publish`, `sign-curated`, `deploy-curated`, and the boundary probes, all of which are ~1 minute.

**Resume path, in order.** (1) MK raises the Actions spending limit. (2) Fix the mini runners —
reinstall the Actions runner as a LaunchAgent in a logged-in session — then move the five browser jobs
back by editing `GITHUB_HOSTED_JOBS`; that removes the recurring cost. (3) Re-run Release on the
current `main` tip; nothing needs to be re-pushed. `main` is release-ready and was verified locally at
`85d9818`: lint, typecheck, 1255 tests, `registry:build` and `design:derived` both idempotent, and
`registry:verify-consume` at 538/538 items × 2 layouts.

**Efficiency work left on the table** (do it when CI can validate it): `ci.yml`'s `contracts` job has
no path filter, so a docs- or tooling-only PR still pays four sharded browser runs. `release.yml`
already gates its equivalent on the visual classifier; `ci.yml` should too. That alone would have
avoided most of this session's Linux minutes.

## 2026-07-25 — CI/CD rebuilt local-first (Option A): CI verifies, it no longer executes

**Decision:** move every browser gate onto developer machines, have CI independently re-execute the
whole non-browser half on the free mac minis, and bind the browser half to a committed receipt.
Plan and measurements: `docs/plans/2026-07-25-cicd-local-first-revamp.md`. MK chose **Option A** — no
GitHub-hosted runner verifies a browser gate at all — over Option B, which would have kept a small
path-filtered hosted contract job as an independent re-run.

**What the measurements said, before any code changed.** GitHub API over 94 runs / 7.2 days:
**1,892 billable minutes**, 17 self-hosted, ~264 hosted minutes per day, ~7,900 projected per month.
`CI :: contracts` alone was 497 of those minutes at ~24.9m per shard × 4 shards, re-paid on every
push. Against that, the same work on this Mac: `design-lint` 1.4s, cold `typecheck` 12s, cold
`turbo run lint` 20s, the browser-unit suite 16s, the cross-engine smoke 15.8s, the complete
three-engine suite **1m39s**, `registry:verify-consume` 3m45s.

**Three findings changed the design rather than confirming it.**

1. _The contract lane's floor was the docs build, not the tests._ `playwright.config.ts` ran
   `pnpm build && serve out` per invocation with `reuseExistingServer: false`. A ONE-ROUTE run cost
   1m54s of which ~1m40 was that rebuild. Meanwhile `turbo run build --filter=@vegastack/docs` is a
   **2.9s** `>>> FULL TURBO` hit, because `turbo.json` already declares `out/**` as an output. So
   `tooling/contracts-run.mjs` owns the server and builds through turbo: one route now costs **24s**
   warm. Freshness did not weaken — it moved from "no server was reused" to a content hash over
   declared inputs, which additionally catches a stale `out/` that a liveness check would serve.
2. _`ci.yml`'s `verify` needed a hosted runner for exactly two steps._ Job `89606685733` had already
   proved `design:verify`, `typecheck`, and `lint` pass on a mini and failed only at `pnpm test`. And
   `pnpm test` is two packages: `@vegastack/design`'s three plain `node` test files (mini-safe, kept in
   CI) and `@vegastack/ui`'s Vitest browser mode (16s locally). Splitting them freed the entire lane.
3. _A recorded number was stale._ This ledger said "768/768 passed in 5.6 minutes" on macOS ARM64.
   Measured the same day on macOS ARM64: **13m36s** (`real 815.43` / `user 3789.34`). 13.6 min is the
   working figure; that is what kept the full sweep out of `pre-push` and put the deferred
   `focusViaKeyboard` fix back on the table.

**Result.** A pull request costs **zero** billable minutes. Seven hosted jobs remain, each for a hard
reason, and the runner split stays an enforced allowlist —
`tooling/verify-workflow-security-negative.mjs` now proves it rejects a move in either direction, plus
eleven other mutations. Projected hosted usage: **~100-150 minutes per month**, from ~7,900.

**The honest cost, stated where it cannot be missed.** Four gate rows — the browser-unit suite, the
cross-engine smoke, the three-engine suite, and the 768 contracts — are now **attested rather than
re-executed**. `.gates/receipt.json` binds them to a git tree hash (a real git tree, computed through a
throwaway index, so symlinks and file modes are handled by git rather than by hand). `--no-verify`,
`HUSKY=0`, or a hand-edited receipt defeats it. What it buys is that skipping a browser gate is a
visible, auditable act instead of a silent one. Seven of eleven rows remain machine-verified for free.
When more than one person merges component changes independently, the answer is required status checks
plus a second machine, not a cleverer receipt. `tooling/verify-hooks-installed.mjs` is inside
`pnpm lint` because husky's dispatcher exits **zero** when a committed hook is missing — a silently
disabled gate would otherwise look completely normal.

**Judgment calls made while implementing.**

- _`package-build` stays GitHub-hosted, and MK approved it explicitly._ `publish` uploads exactly its
  bytes and npm's OIDC provenance asserts this workflow built them; a persistent self-hosted runner
  can carry state between runs, which would make that assertion less true. ~4 minutes. Noted
  asymmetry: `deploy.yml`'s `build-curated` already builds the REGISTRY artifact on a mini, accepted
  in the previous plan, so the two paths differ in provenance.
- _`deploy.yml` requires ALL THREE browser lanes unconditionally_, unlike `ci.yml`/`release.yml` which
  require what the change class needs. Only `pnpm gates:ship` — a full 96-route sweep — produces such
  a receipt, so a production deploy still cannot happen without a complete contract run. Conditional
  requirements there would have let a docs-only deploy through on a partial sweep, which is the hole
  the deleted hosted gate existed to close.
- _`packages/ui/registry.json` and `component-contracts.json` are NON-visual for the contract lane._
  The conservative instinct was to call them global; that was wrong and measurably expensive, because
  `registry.json` carries every item's `meta.version`, so a pure version bump would have demanded the
  full 13.6-minute sweep — precisely the waste recorded as removed earlier the same day. The safety is
  not lost: a route-set change necessarily rewrites `contract-routes.generated.ts`, which IS global,
  and `design:derived:check` fails closed if the two drift.
- _The container ban replaced two assertions that had gone dead._ A digest-pin check and a
  `shell: bash` check both guarded a container that no longer exists. Dead assertions read as
  coverage, so they were removed and a ban put in their place — negative-tested.
- _`pnpm-lock.yaml` added to `.prettierignore`._ `pnpm add` writes a lockfile prettier rejects, which
  made the new pre-commit format gate fail after every dependency change. The existing file already
  exempts generated output whose own pipeline owns its serialization; a lockfile is exactly that.

**Where my own verification was wrong twice, and how it was caught.** Both are recorded because the
method matters more than the result:

- The first `verify-route-scope.mjs` passed a **broken** mapping. Mutation testing showed that deleting
  `contracts.spec.ts` from the contract lane's global list still produced a full sweep — via the
  unrecognised-is-global fall-through — so an `expectGlobal` assertion could not tell "declared global"
  from "global by accident". The genuinely dangerous case, the same path landing in the NON-visual list
  by copy-paste, was untested. Fixed with structural list assertions; all nine mutations now rejected.
- `dropProvenanceOnly` silently dropped **untracked** files (a brand-new component source has no diff
  against the base, so the body filter saw nothing), and then dropped them a second time because the
  final filter was applied to the wrong list. Both fixed; validated against the real
  `Version Packages (#1)` commit, where 1058 of 1593 changed files are provenance-only and 0 of 1052
  component-source paths survive as substantive.

**One finding is deliberately NOT fixed here.** The forced-colors focus assertion cannot fail —
Chromium supplies its own ≥2px focus ring in that mode, and forced-colors repaints borders so the
fallback tint branch is also unconditionally true. Verified against the unmodified spec, so it predates
this change. Fixing it changes what 192 checks assert, which this plan's non-goals exclude. Full
evidence and reproduction: `docs/ledger/bugs.md`, same date. **Until it is fixed, "forced-colors focus
visibility" must not be cited as covered.**

**`focusViaKeyboard` replaced, as its own scoped change.** It was quadratic in round-trips — it sized
its loop from a page-wide interactive count including the whole Fumadocs sidebar, search, and TOC, then
tabbed through that chrome once per control. `walkKeyboardFocus` stamps a probe index on each control,
walks the fixture's tab order ONCE from the container (skipping the chrome entirely), and records the
focus indicator at each landing. Both original facts are still proven by the same mechanism: focus
arrives via a real `Tab` press, and the indicator is measured while keyboard focus is on the element.
Verification: **768/768 pass, identical test count, 13m36s → 11m19s**, and the four routes previously
named as timing out (`message-scroller`, `hover-card`, `sidebar`, `data-list`) now run well clear.

**Four defects in the new tooling, found by running it rather than reading it.** Recorded because
each was invisible in review and each is the kind that would have degraded the tool quietly:

- _A failing cheap gate bought a full contract sweep._ A single type error ran the whole 10-minute
  96-route sweep whose result could not matter on a tree that does not compile. Fixed with a tier
  barrier: the cheap tier runs to completion so its failures report together, then the browser lanes
  are recorded as **not run** rather than started. 10 minutes became 10 seconds.
- _The docs cache warm-up raced turbo against itself._ Started in parallel with `pnpm typecheck` and
  `turbo run lint` — which are themselves turbo runs — it contended on the same task and died
  (`gates: the parallel docs build failed`, on a run whose contract lane then rebuilt and passed).
  Fixed by moving the warm-up after the turbo gates so it overlaps only the unit and smoke lanes, and
  by demoting its failure to a quiet note: `contracts-run.mjs` re-runs the same command and is the
  freshness authority, so a lost warm-up is never a gate failure.
- _The server reaper killed the runner instead of the server — twice over._ First, `detached: false`
  meant the reaper killed the `pnpm` wrapper while `pnpm exec serve` had already spawned `serve` as a
  child, leaving three orphaned servers still listening after a session of runs — exactly the hazard
  the deleted workflows warned about. Fixed with `detached: true` plus a process-GROUP kill. Then the
  belt-and-braces port sweep made it worse: `lsof -ti tcp:<port>` matches a socket with that port on
  EITHER end, so it returned this very process — which had just polled the server through `fetch` —
  and SIGKILLed it. The symptom was `exit 137` immediately after a clean `768 passed`, with the report
  already written as `"pass"`, so the failure appeared to come from nowhere. Fixed with
  `-sTCP:LISTEN` and an explicit self-pid guard. **The deleted workflows used the same unfiltered
  command**; it never bit there only because their shell held no connection to the port at reap time.
  Worth knowing before anyone reintroduces that idiom.
- _The pre-commit format gate would have blocked every new skill._ prettier ERRORS on an explicitly
  specified symlink, and this repository's skill convention adds exactly two per skill
  (`.claude/skills/<name>` and `.agents/skills/<name>`, both required by `skill-lint`). Found by
  adding the `gates` skill itself. Fixed by filtering symlinks out of the staged set; their targets
  are ordinary files and are still formatted on their own paths.

## 2026-07-27 — CRM commission round: judgment calls

- **`canAdvance` shipped as `blockedReason` (stepper).** Options: (a) a host-callback contract the
  component invokes, (b) a declarative reason string. Chose (b): gating is host logic by the plan's
  own words; the component's job is communicating the block, and a callback would have made the
  component the gate's owner. Plan §7.14 stays unamended (point-in-time record); recorded here.
- **Filter builder edits inline, not in per-condition popovers (§7.2 sketch).** Inline rows are
  keyboard-simpler (no portal focus management per condition) and the sketches were declared
  directional. FilterChip is composed for the summary; FilterBar itself is not reused (its chip row
  is host-state-driven; the builder's summary is tree-driven).
- **`editable-cell` reuses `AutoSaveStatus` by importing the type**, accepting auto-save-input as a
  registry dependency for one union — one system-wide vocabulary beats a types-only registry item.
- **Summary chips in the filter builder stay removable in `readOnly`** (pruning the tree), because
  FilterChip's remove affordance is type-required and a summary you cannot act on is a dead end;
  `disabled` makes the summary inert. Documented on the page.
- **ActionBar is `role="group"`, not `toolbar`** — the toolbar role promises APG arrow traversal;
  we make no such promise rather than half-keeping one. `useListNav` can upgrade it later.
- **Timeline separators are real `<li>`s** (an `<ol>` admits nothing else; axe enforces it) and
  non-interactive Item rows take `role="none"` — the `<li>` is the list item.
- **The §12 "do not fix §8.5" retraction was verified false against origin/main** (the sentence did
  include `Table`; there was no AutoTypeTable), so the fix stood. Recorded because a plan
  instruction was knowingly not followed after verification — the truth hierarchy's script-over-
  prose rule applied to a plan's own self-correction.

## 2026-07-27 — phase-3 judgment calls (round 20)

- **Same-container container-drops are a no-op, not an append.** The container target is what a
  gap/self drop falls through to; "4px twitch sends the row to the bottom" is worse than losing
  "drop on own column body to append" (drop on the last row's bottom edge still does that).
- **Dropzone adopts the ENGINE'S a11y model** (surface as `role="button"`, input as hidden bridge)
  rather than fighting react-dropzone into the input-as-control story the docs originally told.
  Doctrine follows implementation truth; every claim surface was rewritten in the same round.
- **DataGrid column reorder ships as applied `columnOrder` only** — the `onColumnOrderChange` stub
  that could never fire was removed rather than half-implemented. A reorder affordance (likely a
  drag layer on headers) is a future commission with a real consumer.
- **Board's Move menu appends-then-refines** (Move to column, then Move up/down/top/bottom) —
  lossless in two steps without a position-picker submenu.
- **The payload-blind document-level drop cancellation is accepted** as react-dropzone's default;
  the opt-out (`preventWindowDrop={false}`) now actually reaches the engine.

## 2026-07-28 — Public-site/private-registry production boundary

- **The operator's live policy is authoritative for the recovery:** all non-registry routes are
  public; “internal” is a discovery classification, not an authentication boundary. No Cloudflare
  Access rollback was made after this was clarified.
- **Upload success is necessary but not deployment completion.** The recovery keeps the final live
  probe blocking and makes it unconditional; completion requires the workflow as a whole to pass.
- **A 200 alone is insufficient production evidence.** The probe enumerates both internal pages and
  every generated derivative, rejects Access/external redirects, requires noindex plus browser and
  edge no-store, proves retired content is gone, and verifies the exact Stepper registry version,
  item hash, signed manifest, and signer identity through the service-token path.
- **The historical cutover record stays historical.** Current runbooks and the ship skill point to
  the new decision; the old phase scripts and workflow jobs were deleted instead of left as dormant
  recovery paths.
- **Counts are evidence, not decoration.** The first run's label said 96 routes while the contract
  runner selected 108. Runtime gate labels now derive from `COMPONENT_ROUTES`, the expected contract
  count derives from routes × assertions × projects, and the public introduction's count is a
  generated region checked by `design:derived:check`.

## 2026-08-27 — Manual QA responsive-layout judgment

- **Pricing Section uses intrinsic auto-fit rather than a named container query.** The reported bug
  was caused by viewport breakpoints inside constrained preview and split-pane widths. An intrinsic
  `auto-fit` grid with the semantic `--container-3xs` card floor responds to the component's actual
  available width while preserving PricingSection's single-root `className` and `ref` contract. A
  wrapper solely to host a named container would have changed that composition contract without a
  consumer need. Narrow static replay confirms one column at 375px; wider surfaces continue to fit
  multiple cards whenever their real width permits it.

## 2026-08-28 — macOS 26.6.2 degraded the local browser test environment; 0.5.0 shipped with all-browsers deferred

- **The macOS 26.6.2 upgrade broke both non-Chromium engines on the dev machine, and it is
  environmental, not a code regression.** WebKit's Playwright render child links the system
  `WebKit.framework` by absolute path and needs `_WKBrowserContext`, which 26.6.2 dropped — so WebKit
  cannot launch at all (made host-conditional in `webkit-lane.ts`). Firefox launches but its
  click/pointer actionability into popovers/portals times out: `locator.click: Timeout ~14900ms` on
  the DatePicker calendar and the Sidebar collapsible rail.
- **Proven environmental and pre-existing, so it did not block the release on merit.** `main`'s
  DatePicker fails in Firefox **identically** on the same machine (6 failures, same 15s click
  timeout), Chromium passes everything (3,008 unit tests + all 864 contracts), and VideoPlayer passes
  32/32 in isolation — its lone `all-browsers` failure was contamination from the timed-out DatePicker
  run, not a real defect. The failures are `locator.click` actionability timeouts, not assertions.
- **Ship decision (MK, 2026-08-28): release 0.5.0 with the deploy-required evidence and defer the full
  three-engine suite.** `deploy.yml`'s receipt-guard requires `contracts + unit + smoke`, all of which
  pass here (Chromium contracts/unit; smoke runs Chromium+Firefox with WebKit host-skipped). The
  `all-browsers` full three-engine suite is **not** in `ALL_GATES`, so it is invisible to the receipt
  and to the guard — its Firefox failures neither block nor appear in `.gates/receipt.json`.
  `GATES_SKIP` was used only to let `gates:ship` write the receipt past the (non-required)
  `all-browsers` failure; because that gate is untracked, the written receipt is clean.
- **This entry is the audit record the receipt cannot carry.** Since `all-browsers` is not a tracked
  gate, its deferral leaves no trace in the receipt; the deviation is recorded here instead. The cost
  accepted: 0.5.0 has genuine Chromium + smoke-level Firefox evidence but no full-suite WebKit/Firefox
  confidence.
- **Follow-up to restore coverage.** Fix the environment — run the browser lanes in a logged-in
  desktop session (the LaunchAgent path already noted for the minis), or on a machine in WebKit's
  macOS 26.2–26.5 window — then re-enable enforced WebKit (`WEBKIT_LANE=require`) and confirm
  `all-browsers` Firefox passes.

## 2026-09-07 — F2 judgment calls: the Button matrix, the disabled contract, and what was left raw

- **`tone` is CSS custom properties, not thirty class strings (P2 option a, as decided).** Each of
  the six `variant` recipes is written once and reads `--btn-fill` / `--btn-soft` / `--btn-tint` /
  `--btn-line` / `--btn-face` / `--btn-link`; each of the five `tone`s only sets them. Verified that
  Tailwind v4.3 compiles a var-valued colour with a var opacity modifier
  (`bg-(--btn-fill)/(--alpha-hover)` → `color-mix(in oklab, var(--btn-fill) var(--alpha-hover),
transparent)`) before committing to the shape. Two consequences worth knowing:
  - `--btn-ghost-ink` is the `inherit` keyword for the neutral tone, which is invalid-at-
    computed-value-time for a custom property and therefore reads back empty from
    `getComputedStyle`. That is the mechanism, not a bug: a neutral ghost keeps its host's ink (so a
    dismiss control inside muted chrome stays muted), and a status ghost takes its own. It has a
    dedicated compiled-CSS test rather than being lumped into the "every var resolves" loop.
  - A status tone's soft hover/pressed rungs are the PRECOMPOSED `<family>-subtle-hover` /
    `-subtle-active` tokens, never a live wash. A wash would replace the subtle fill instead of
    climbing off it.
- **The forbidden cell is a type, not a lint rule.** D4 says a destructive action is never a solid
  red button. `ButtonAppearance` is a three-member union, so `<Button tone="destructive">` without an
  explicit non-solid `variant` does not compile, and neither does `variant="cta"` with a `tone`.
  A lint rule was the other option; F2 does not own `tooling/design-lint.mjs` beyond the exemption
  counts (G1-a is in flight), and a compile error reaches consumers of the copied-in source too,
  which a repo-local lint rule never would.
- **`disabled` is now always the `aria-disabled` form, on every Button (D7).** Previously
  `focusableWhenDisabled` was set only while loading. A native `disabled` button receives no pointer
  events at all in any browser, so dropping `pointer-events-none` alone would NOT have delivered the
  tooltip D7 asks for — the attribute had to change too. Base UI suppresses activation either way.
  Cost accepted: tests that asserted `element.disabled` now assert `aria-disabled` (date-picker
  presets, filter-bar-managed caps, split-button), and a disabled control stays in the tab order,
  which is the APG-sanctioned pattern for an explained-unavailable action.
- **`:active` still paints on a disabled control.** With pointer events restored, pressing a
  disabled button briefly shows the pressed fill. Left as-is: batch 1 decided hover-on-disabled is
  allowed, and suppressing `:active` would mean a `not-aria-disabled:` guard on all six variant
  recipes. Flagged rather than silently accepted.
- **Left raw on purpose, against the issue's `<button>`-count acceptance.** Four files keep their
  `RAW_INTERACTIVE_EXEMPTIONS` entries, and the reasons differ:
  - `data-grid` (2) and `data-list` (2) — the sort headers and the row-action wrapper are TEXT
    controls that must inherit the cell's typography and add no box. Wrapping them in `Button` would
    add a height, a label voice and `whitespace-nowrap` to a table cell.
  - `onboarding-checklist` (3 → 2) — the icon-only collapse toggle became an `IconButton`; the
    collapsed progress pill and the step rows carry visible text and stay text controls.
  - `password-input` (1) and `tag-group` (2) — these are chip-internal micro-controls. The password
    toggle sits INSIDE the field box, where F1 deliberately gave it an ink-only hover and pressed
    step because a surface wash would touch the input border; making it an `IconButton` would undo
    that decision two batches later. Tag's remove and overflow controls belong to the Chip primitive
    (T2), explicitly out of F2's scope.
    The exemption map fails closed in both directions, so all four are counted, and the four files that
    DID lose their raw controls tripped the rule in the removing direction — which is the point of it.
- **`paginationLinkVariants` keeps a size key named `icon`.** It sizes an `<a>` page-number tile,
  not a control on the `--size-*` ladder, and renaming it is a PaginationLink API change with no
  audit finding behind it. Noted so the next sweep does not read it as missed work.
- **Doctrine amendment worth MK's eye:** F1's AGENTS.md rule says "no component writes its own
  `hover:bg-*`". Button now does — through the tone vars — because it IS the recipe for its own
  family, the way `surfaceInteractive` is the recipe for the ladder. `design.md` §Components states
  the mechanism explicitly; the AGENTS.md sentence was left as F1 wrote it rather than edited by a
  sibling batch.

## 2026-09-07 — F2's first clean push gate lost a run to the known Firefox actionability flake

- **What happened:** `pnpm gates:push` failed once on `smoke`, with
  `use-animation-replay.test.tsx > replaying while already playing restarts cleanly` timing out at
  `await button.click()` under **Firefox only** (29s for a 13-test file). Nothing in F2 touches
  `use-animation-replay`. The same file, run in isolation on the same tree with the same config,
  passed 26/26 across Chromium and Firefox in 12s.
- **Why it is not a new defect:** this is the failure mode already recorded on 2026-08-28 —
  "Firefox launches but its click/pointer actionability into popovers/portals times out" on this
  macOS build. WebKit is still host-skipped for the same environmental reason (`_WKBrowserContext`
  dropped in 26.6.2), which the lane prints on every run.
- **How it was handled:** re-ran the file in isolation to confirm, then re-ran the FULL `gates:push`
  rather than reaching for `GATES_SKIP`. The receipt on this branch is from a run in which every
  gate passed on its own merits. Recorded because a receipt shows the passing run and not the one
  before it, and a reviewer should know a re-run happened and why.
- **The second re-run lost a different lane to machine saturation, same handling.** `contracts`
  failed once with `Test timeout of 120000ms exceeded` on
  `/docs/components/otp-input … effective 24px pointer targets` in `chromium-dark` — 879/880 passed.
  The SAME assertion passed in `chromium`, `mobile-chromium` and `mobile-chromium-dark` in that very
  run, and had passed in all four projects in the two preceding full sweeps. `uptime` at the moment
  of failure read **load average 45.5**, with two sibling audit agents running their own
  `gates.mjs push` / `contracts-run.mjs` in parallel worktrees. Re-run in isolation on the same tree:
  8/8 passed, the dark case in 1.1m against a 120s budget.
- **The lesson, which is about the budget and not about otp-input.** OTP's target-floor test probes
  every slot, so it is the longest single contract in the suite and sits closest to the per-test
  timeout — it is the first thing to fall over when several agents share one machine. If concurrent
  audit work continues, either raise the per-test timeout for that route or serialise the gate runs;
  do not read this failure as an OTPInput defect.

## 2026-09-07 — M1 judgment calls: the volume panel, `bare`, and a stale audit claim

- **The volume rail is inline, not portaled.** Every other floating panel in the system portals to
  `<body>`. This one must not: the video frame is the element passed to `requestFullscreen`, and a
  portal to `<body>` puts the panel outside the fullscreen element, where it is not rendered at all.
  So the panel is positioned within the frame and the `overflow-hidden` clip is handled by the
  frame's own padding. Recorded because it reads like a portal that someone forgot to write.
- **`Slider` gained a fourth variant, `bare`, that the issue did not ask for.** The issue named
  `default | media | overlay`. The audio waveform draws its own bars and needs the Slider purely as
  an accessible, keyboard-driven hit layer over them — with a `media` rail underneath it, the
  waveform gets a second rail drawn through it. `bare` renders no track and no fill, and pairs with
  `thumb="none"`. The alternative was leaving the waveform on descendant overrides, which is the
  exact thing B4-05 asks to delete. Consistent with `design.md` §Components ("a variant is a recipe
  the component owns, not a caller's override"), so taken rather than escalated — flagged for MK.
- **B4-11's `code-block` and `tool-call-chip` claims were already stale when the audit was written.**
  The audit says `code-block` has "no headerless" fixture and `tool-call-chip` has "no interactive
  `render={<button/>}` fixture, no running state". All three already exist on `main` inside the
  single `codeBlock` / `toolCallChip` preview functions, so the contract lane does see them; the
  audit appears to have counted exported preview functions rather than specimens. Only the genuinely
  missing one — a long-line horizontal-overflow fixture for `code-block` — was added. Nothing was
  deleted or restated to "close" a finding that was already satisfied.
- **The count ledger in `tooling/verify-component-contracts.mjs` moved, and that is not a relaxed
  gate.** It holds the second half of a deliberate double-entry check against
  `component-contracts.json`, so a new registry item must be written into both or the gate fails.
  559 → 560 items, 112 → 113 components, Content/marketing 22 → 23. No assertion was loosened.

## 2026-09-07 — M1 adversarial review round: what was fixed, what was left

An independent read of the M1 diff against the B4 findings ran before the PR. Everything it found
that this batch owns was fixed at the root and is listed above in `bugs.md`
(the overlay rail's specificity tie; the playback-rate reset). Three more were fixed without a
`bugs.md` entry, being defects of documentation or direction rather than behaviour:

- **`audio-player.mdx` documented shortcuts the diff had deleted.** The keyboard table still listed
  Space-to-play and ←/→-to-seek "when the media controls group is focused". Those are `surface`
  scope in `useMediaShortcuts`, the controls group is deliberately no longer a tab stop, and
  `AudioPlayer` hosts no surface listener — so they no longer exist in the audio player. The rows
  were removed rather than the behaviour restored: Space and the arrows belong to whichever control
  has focus, which is exactly why the scope split was drawn there.
- **Tooltips and the settings menu were invisible in fullscreen.** The volume panel was built inline
  precisely because a portal to `<body>` is not painted inside a fullscreen element — but the same
  reasoning was never applied to the other two popups in the same control bar. `MediaPlayerControls`
  now takes `portalContainer`, `VideoPlayer` passes its frame, and a context carries it to every
  tooltip without threading a prop through every control.
- **`showValue` and the volume panel were mis-centred in RTL** — a logical `start-1/2` paired with a
  physical `-translate-x-1/2`. Fixed on the new surfaces only.

Left out, deliberately:

- **`MEDIA_SUBMENU_RADIO_ITEM_CLASS` still restyles `DropdownMenuSubContent` from outside.** It is
  the same class of leak as B4-05, relocated rather than removed. The honest fix is a
  `trailingIndicator` prop on `DropdownMenuRadioItem`, and `dropdown-menu` belongs to **O1**. Flagged
  for MK; M1 does not touch an overlay component to close it.
- **B4-11's `copy-button` sub-item** — the implicit `size="sm"` flip under `showLabel` — is
  untouched. `copy-button` is not an M1 component and the finding asks for a decision (document it
  or drop it) rather than a mechanical edit. Flagged for MK; the `text-edit.mdx` half of B4-11 is
  M2's by the do-not-touch list.

## 2026-09-08 — F2's gate moved to the Ryzen boxes, and the committed receipt was stale

- **The committed receipt did not describe this tree, and said so.** `.gates/receipt.json` on the
  branch recorded `head d14bd886` against base `6f11a4bc` — the main from BEFORE F1 merged. The
  branch had since been rebased onto `9c33dfaf`, so the receipt covered a tree that no longer
  existed. A finisher had noticed it "reports as covering this tree"; it did not, and the fix was
  never to reason about it but to re-run the ladder. **A receipt is only ever evidence about the
  tree hash it names** — read the `head`/`base` fields before trusting one, especially after a
  rebase.
- **Every browser lane now runs on the Ryzen boxes** through the session runner, which mirrors the
  commit plus the dirty tree to a box, runs under a per-box lane lock, and copies `.gates/` back.
  The pulled receipt's `host.platform` reads `linux`; CI does not check it.
- **The full sweep failed two lanes. One was a real test defect; one was environmental.**
  - `unit` — `button-matrix.browser.test.tsx > a neutral ghost inherits its host ink` asserted
    `rgb(1, 2, 3)` and got `oklch(0.145 0.003 75)`. This one was a REAL defect, in the test, and it
    is written up in `bugs.md`: the assertion measures a rest state, and the pointer was sitting on
    the button. It reproduced in every full sweep and passed in isolation, which is the signature of
    shared-page pointer state, not of a flake. Fixed by parking the pointer on a spacer first.
  - `contracts` — `/docs/components/relative-time contains its primary fixture at 320px` failed in
    `mobile-chromium` and `mobile-chromium-dark` with `locator.scrollIntoViewIfNeeded: Element is
not attached to the DOM`, 878/880 passing. That is a detach during an actionability wait, not a
    containment failure, and **F2 touches no file under `relative-time`** — the component re-renders
    on its own ticker, which is exactly the shape that detaches a node mid-action.
- **A third sweep lost the unit lane to a harness error** — `Failed to run the test … Cannot connect
to the iframe` for one file, with **1488 tests passed and zero assertion failures** in the same
  run. That one is genuinely environmental: it is the vitest browser orchestrator failing to attach
  an iframe under load, not a test outcome.
- **Handled by re-running the full ladder and by fixing the real defect, never by `GATES_SKIP` or
  `--no-verify`.** Recorded because the receipt on the branch shows only the passing run, and a
  reviewer should know what was re-run and on what evidence each failure was classified.

## 2026-09-08 — The remote gates boxes replay a pre-rebase CSS chunk from a cache nothing clears

- **What happened:** F2's finishing `pnpm gates:push` on a Ryzen box failed the contract lane
  because the docs build failed: `design-lint --docs-shell --emitted-css` reported **10 offenders**,
  every one a `@tailwindcss/typography` `.prose :where(…)` heavy weight (600/800/900). The same
  commit built clean on the Mac — "2 built stylesheet(s) on-system".
- **Root cause, and it is not the branch.** The rule that neutralises those weights,
  `.prose :is(h1, h2, h3, h4, h5, h6, dt, thead th) { font-weight: var(--font-weight-medium) }` in
  `apps/docs/app/global.css`, was introduced by **Do1-a (`d5c960a3`)**. The box's emitted chunk did
  not contain that rule at all (`grep -c 'prose :is('` → local 1, box 0) while the box's
  `global.css` was byte-identical and its tree clean at the pushed HEAD. The box had simply replayed
  a Turbopack cache written before this worktree was rebased onto Do1-a.
- **Why nothing cleaned it.** `remote-gates-v2.sh` rsyncs with `--exclude '.next' --exclude
'apps/docs/out'` (correctly — they are build artifacts), and its remote reset ends in
  `git clean -qfd`, which does **not** remove ignored files. So `apps/docs/.next` on the box is
  immune to both the sync and the reset, and outlives every rebase.
- **The class to recognise:** an emitted-CSS or built-artifact gate that fails ONLY on the remote box
  while the identical tree passes locally is a stale remote build cache until proven otherwise —
  diff the built artifact for the rule you expect, do not start editing source. The tell is that the
  offending rules all belong to a dependency's defaults and the _override_ is the thing missing.
- **Handling:** `rm -rf apps/docs/.next apps/docs/out` on the box, then re-ran the full ladder. Not
  masked and not skipped: the rebuild is the stricter option, since it removes the cache the failing
  run depended on.
- **This will hit every batch still in flight.** Any agent whose worktree was rebased across Do1-a
  and whose box worktree predates that rebase will see these exact 10 offenders. Clearing the two
  directories on the box is the fix; the durable fix is for the runner to clear them (or to pass
  `git clean -qfdx`) and belongs to whoever owns `remote-gates-v2.sh`, not to a component batch.

## O1 · Overlays (#40) — judgment calls

- **`floating-surface` ships as a registry `lib`-style item, not a `@vegastack/design` export.** The
  brief left the choice to whichever surface the dependency gates could actually enforce. A
  `@vegastack/design` export would have put component _markup_ into the npm layer, which that
  package does not otherwise ship, and consumers could not then own or patch it — the copy-in model's
  whole point. As a registry item it is declared in each overlay's `registryDependencies`, so
  `verify-registry-deps` proves every overlay that composes it also installs it, and
  `verify-shadcn-consume` installs it for real through the shadcn CLI.
- **`context-menu.tsx` is 291 lines against the brief's "< 150" acceptance bar.** The duplicated
  plumbing the bar was proxying for is gone: the file owns the root, the trigger and the popup, and
  every item part is a re-export of `createMenuParts`. Its **code** is 134 lines
  (`grep -vE '^\s*(//|/\*|\*|$)' | wc -l`); the remainder is the per-export `Props` type alias and
  JSDoc block that `verify-public-api-docs` requires on every exported symbol. Meeting 150 total
  would mean deleting documentation a gate mandates, so the line count was not chased. Flagged so the
  next sweep does not read it as missed work.
- **`AlertDialogContent intent` was deleted rather than wired to the confirm button's tone.** The
  brief allowed either. It wrote a `data-intent` attribute and nothing else, so the system carried
  two props named for one concept with one of them inert — the exact drift the audit exists to
  remove. `AlertDialogAction intent` is now the single owner, mapping onto F2's Button matrix.
- **`Combobox` stays non-modal while `Popover` and `Select` are modal (D12).** Not an inconsistency:
  `modal` renders the rest of the page inert behind a clipped layer, and a multi-select Combobox's
  own chips sit outside the popup, so modality makes chip removal unclickable while the popup is
  open (verified). The reason is written in the component source, not just here.
- **The Base UI version this was written against is 1.6.0, not 1.8.** D1 (#34) had not merged when
  this branch was cut. Drawer's swipe/snap-point/virtual-keyboard API is what 1.6.0 ships. If D1
  lands first, re-read Drawer's release notes before assuming the props still line up.

## 2026-09-08 — C1: reconciling the disclosure hover with the hover-geometry rule

- **The conflict.** Audit B7-08 says Accordion and Collapsible must stop hovering with
  `hover:underline` (that is the link affordance) and take the row wash. `design.md` § Hover geometry
  says a wash must be inset ≥4px from a container hairline and carry the container's inner radius —
  and it explicitly sanctioned ink-both-ways for "an accordion header", precisely because the header
  sits flush against the item rule. F1 had already given both triggers an ink pressed step under that
  clause. Taken literally, the two documents cannot both be satisfied by a class swap.
- **What was chosen.** The migration the same doctrine bullet already describes: _"when such a
  control is later given padding and an inner radius, it moves to the recipes — both steps
  together."_ Each trigger now carries `-mx-2 px-2 rounded-md`, and `AccordionItem` carries `py-1`,
  which buys the inner radius and the 4px inset while the label stays aligned with the panel content
  and the row keeps its original height (item `py-1` + trigger `py-2` = the old trigger `py-3`).
  `design.md` was amended in the same change: the ink clause no longer names the accordion header,
  and underline-on-hover is now stated as link-only.
- **Why not the alternative.** Keeping ink and merely deleting the underline would have left the
  hover with no rung to move to — the resting ink is already `foreground`, so "brighter ink" has
  nowhere to go, and the control would have had a pressed state with no hover state.

## 2026-09-08 — C1: `EmptyTitle` takes `as`, not Base UI `render`

- The issue text offers "`render`/`as`". `render` is not available here: `empty.tsx` is server-safe
  (no `'use client'`, enforced by `verify-rsc-safety.mjs`), and Base UI's `useRender` is a hook —
  adopting it would have made the whole file client-only to let a page choose a heading level.
- `as` is an existing house pattern for exactly this (`TruncatedText`), and the union
  (`h1`…`h6` | `p`) is narrower and better documented than an arbitrary render prop for a part whose
  only real question is "which heading level, or none".

## 2026-09-08 — C1: five unrelated registry sources were restamped

- `badge`, `copy-button`, `split-button`, `stat` and `switch` appear in the C1 diff with a
  prettier reflow plus a new `meta.integrity`. `shadcn build` formats file content on its way into
  `public/r/*.json` and `registry-header.mjs` stamps that content's hash back onto the source, so
  running `registry:build` on the branch normalised five files whose formatting predated it. The
  tree is idempotent after the change (two consecutive `registry:build` runs leave it clean); the
  five files carry no behavioural edit. Re-verified after the rebase onto merged F2.

## 2026-09-07 — D1 dependency batch: the fifteen Base UI deltas, and four judgment calls

Issue #34. Every version below was read from the npm registry that day; every behavioural claim was
observed in a browser, not inferred from a green suite.

### The fifteen Base UI 1.6.0 → 1.8.0 deltas — observed

Probed with a throwaway spec (`zz-baseui18-probe.test.tsx`, deleted after the run) rendering our own
components, because a passing suite proves only that nothing we already assert changed — it says
nothing about the deltas we do not assert.

1. **`render` callback typing tightened (1.7.0, #5104)** — `pnpm typecheck` clean workspace-wide, no
   source change.
2. **`Combobox.Input` no longer injects `type="text"` (1.7.0, rides on #5104)** — observed: our
   combobox input now carries **no `type` attribute** at all. Benign, and deliberately left alone: an
   `<input>` without `type` _is_ a text input, and nothing in this repo selects on `input[type=…]`
   (grepped across component source and every CSS file). Note this delta has no release-note line —
   it is only visible in the source diff between the tags.
3. **`Accordion.Root` no longer sets `dir` (1.7.0, #5117)** — observed: `dir` is **absent** from our
   accordion root. This is the RTL contract's preferred state — direction inherits from the document
   instead of being pinned per-component. All 110 RTL contract routes pass.
4. **Submenu `onOpenChange` no longer fires twice (1.7.0, #5178)** — observed: opening then closing a
   `DropdownMenuSub` produces exactly `[true, false]`; one `false`, not two.
5. **Select no longer force-mounts on programmatic value change (1.7.0, #5119)** — observed: setting
   a controlled Select's value from a button leaves **no `[role=listbox]` in the DOM**.
6. **`aria-orientation` moved to role owners (1.8.0, #5551)** — observed: an open Select has **no
   element carrying `aria-orientation`** anywhere. Our three components that assert the attribute
   (`radio-group`, `resizable`, `separator`) set it themselves and are unaffected; all pass.
7. **`readOnly` Select/Combobox now open and browse (1.8.0, #5531 Select / #5541 Combobox)** —
   observed: a `readOnly` Select **does** open on click. `editable-cell` passes `readOnly`, so this
   is a real user-visible change there: a read-only cell's select can now be opened and browsed
   (not changed). Kept as upstream shipped it — browsing a read-only value is better a11y than a
   dead control — and recorded here because nothing in our suite asserts it either way.
8. **NavigationMenu keeps focus on the trigger (1.8.0, #5479)** — observed: after focusing the
   trigger and pressing Enter, `document.activeElement` is still that `BUTTON`.
9. **Async Field validation publishes neutral validity (1.8.0, #5600)** — `auto-save-input` uses a
   synchronous `validate` predicate, so it never enters the in-flight state this changes; its suite
   passes unchanged.
10. **`--transform-origin` for start/end-aligned popups is now the aligned edge (1.8.0, #5015)** —
    the custom property resolves to an edge value on our positioners. This is a **pixel** change to
    pop-in origin, and no contract check can see it; it belongs to `vrt-review` at `/ship` and is
    flagged there rather than claimed as verified here.
11. **`Avatar.Image keepMounted` (1.8.0, #5536)** — new opt-in prop; not adopted.
12. **`Avatar.Image data-loading` / **13.** `data-error` (1.8.0, same PR, no release-note line)** —
    observed: on a loaded avatar the `<img>` carries `alt, data-slot, class, src` and **neither**
    attribute. They are meaningful only under `keepMounted`, where the element stays mounted and
    derives status from its own load/error events. Inert for us.
13. **`Combobox.createItems` (1.8.0, #5326)** — observed present (`typeof === "function"`); not
    adopted. `useFilteredItems`, which we do use, is unchanged.
14. **Neither 1.7.0 nor 1.8.0 labels any change breaking** — confirmed by reading both release
    bodies. That is a labelling fact, not a safety guarantee: #5104 and #5551 are behaviourally
    breaking in practice, which is why each was probed.

### Four judgment calls

- **TD-5 — the release-age floor is now explicit, and that is the whole point.** Measured on pnpm
  11.7.0 against the then-too-new `style-dictionary@5.5.3`: **inherited/loose**, pnpm appends a
  `minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml` and installs the too-new version anyway —
  the floor grants itself an exemption and the only trace is a line in a file nobody re-reads.
  **Explicit/strict**, the install fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` and nothing is
  written. The two `fumadocs-*@16.10.5` excludes that used to sit in that file were written by pnpm
  this way, not by a human, which is why they were stale and why deleting them was safe.
- **style-dictionary held at 5.5.2, not 5.5.3.** 5.5.3 was inside the 24h floor on the day, and it
  touches `color/css` alpha precision — token CSS output, which is F1's (#32) territory. 5.5.2
  already carries the security fix. Taking 5.5.3 here would have moved token values under another
  issue's feet for no security gain.
- **Next `agentRules: false`.** 16.3's `next dev` writes a managed block into an `AGENTS.md` /
  `CLAUDE.md` in the Next app directory when it detects a coding agent. Turned off deliberately:
  this repo's agent instructions are authored and reviewed, AGENTS.md is the canonical cross-tool
  file, and a tool-managed block inside a hand-authored one has no owner. It would also drop two
  untracked files into `apps/docs/` and trip the `git status --porcelain` idempotency gates. (The
  write is a plain join on the Next app dir, so it could never have reached the repo-root AGENTS.md.)
- **shadcn 4.21's `cn` package: not adopted.** 4.21.0 installs the `cn` package and generates
  `export { cn } from "cn"` for `lib/utils`, and upstream registry components now import from it.
  That is registry **content**, not CLI behaviour: `shadcn build` output is byte-identical and
  `verify-shadcn-consume` passes unchanged. `cn()` continues to come from `@vegastack/design` — a
  locked decision — and no `package.json` here carries a top-level `registries` key (4.16.0/4.18.0
  allow one; our config stays in `components.json`). The cost accepted is a churn line in future
  `shadcn add --diff` output where upstream now imports `cn` from the package.

### One registry floor moved, one deliberately did not

`verify-registry-deps` enforces that `packages/ui/package.json`'s installed range satisfies each
item's declared range. `@shadcn/react` **had** to move (`^0.2.1` cannot admit 0.3.1 under 0.x caret
rules) and `message-scroller` now declares `^0.3.1` — correct independently, since the viewport
styles an attribute that only exists from 0.3.1. `@base-ui/react` stays at `^1.6.0`: the pinned
1.8.0 satisfies it, no component source depends on 1.7+ behaviour, and raising a consumer floor
without a reason forces churn on every consumer for nothing.
