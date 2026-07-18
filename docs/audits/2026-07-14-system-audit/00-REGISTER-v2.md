# Findings Register v2 — verified against the current working tree

**Date:** 2026-07-15 · **Tree:** branch `feat/local-build`, post-`89b35c2` (uncommitted execution work in progress).
**Mandate:** plan v5 Phase −1 item 4 (adversarial finding CX-16: the audit corpus contained stale findings). Every one of the 94 findings in `00-SYNTHESIS.md` §3 was re-verified by reading the actual cited file at its current line — line numbers below are **current**, not the synthesis's originals. **This file is the ONLY register execution reads.** The synthesis's §3 tables and the adversarial review's per-finding claims are superseded where they disagree with this file.

**Status legend:**
- **OPEN** — still true today, at the cited current line.
- **FIXED** — no longer present; resolution noted.
- **STALE/WRONG** — the original claim was incorrect or exaggerated.
- **AMENDED** — partially true; the corrected claim is what execution should act on.

**Phase legend** (per `docs/plans/2026-07-execution-checklist.md`): `−1`=Rails · `P`=P0 fixes · `T1`=typography · `T2`=opacity · `T3`=z-index · `T4`=motion tokens · `T5`=sizes/radius/icons · `T6`=brand · `U`=upgrades · `C`=consistency & structure · `X1`=Combobox/Command · `X2`=new components · `R`=responsive · `M`=motion impl · `S`=app shell · `D`=docs infra · `A`=authoring infra · `B`=brand/marketing · `Z`=finalization · `BKLG`=unscheduled backlog.

**XCUT mapping** (cross-cutting entries are folded into their §3 IDs; none dropped): XCUT-01→P1-08 · XCUT-02→P1-15 · XCUT-03→P1-13 · XCUT-04→P1-14 · XCUT-05→P1-05 · XCUT-06→P1-11 · XCUT-07→P1-12 · XCUT-08→P1-09 · XCUT-09→P1-10 · XCUT-10→P1-04.

All paths are relative to repo root; component paths are canonical (`packages/ui/registry/ui/…`).

---

## P0

| ID | Sev | Status | Finding | Current file:line | Phase |
|---|---|---|---|---|---|
| P0-01 | P0 | **OPEN** | `marker.tsx`/`bubble.tsx` call `useRender` with no `'use client'` directive (line 1 of both is only the provenance header); all siblings (`badge.tsx:3`, `breadcrumb.tsx:3`, `pagination.tsx:3`, `sidebar.tsx:3`) carry it | `marker.tsx:4,84`; `bubble.tsx:4,148` | P |
| P0-02 | P0 | **OPEN** | Popover/Sheet popups carry unconditional `outline-none` with zero compensating focus style (no `focus-visible` hit in either file); dialog/alert-dialog share the bug class (`dialog.tsx:30,146`, `alert-dialog.tsx:127,135`), low-risk only because they always render a tabbable button | `popover.tsx:163`; `sheet.tsx:31,152` (orig. `:145` is now a backdrop class) | P |
| P0-03 | P0 | **OPEN** | Collapsed `SidebarMenuButton` hides its label span via `hidden` (display:none) — dropped from accessible name; no `sr-only` anywhere in file | `sidebar.tsx:301` (`group-data-[state=collapsed]/sidebar:[&>span:last-child]:hidden`) | P |
| P0-04 | P0 | **OPEN** | `TruncatedText` tooltip triggers have no `tabIndex` (zero hits in file); `relative-time.tsx:218` still demonstrates the correct pattern | `truncated-text.tsx:115,201` | P |
| P0-05 | P0 | **OPEN** | `Field` horizontal branch renders `{children}` + `{label}` only; `description` rendered solely in the vertical branch | `field.tsx:256-260` (horizontal) vs `:279` (vertical renders description) | P |
| P0-06 | P0 | **OPEN** | Select popup transition property list omits `scale` (`transition-[transform,opacity]`) while still applying `data-[starting/ending-style]:scale-95`; every sibling overlay explicitly lists `scale` (`popover.tsx:165`, `hover-card.tsx:218`, `dropdown-menu.tsx:92`, `context-menu.tsx:149` all read `transition-[transform,scale,opacity]`) — Tailwind v4 `scale-*` uses the CSS `scale` property, which is why siblings list it. One verifier suggested `transform` might cover it; the sibling-divergence is fact regardless — confirm visually during the fix | `select.tsx:227-229` | P |
| P0-07 | P0 | **OPEN** | `notification-bell` registry item declares `registryDependencies: ["@vegastack/separator", "@vegastack/button", "@vegastack/icon-button"]` but the component imports only `IconButton` (zero separator/button references in file) | `packages/ui/registry.json:1495-1499`; `notification-bell.tsx:5-8` | P |

## P1

| ID | Sev | Status | Finding | Current file:line | Phase |
|---|---|---|---|---|---|
| P1-01 | P1 | **AMENDED** | 24 components still use `forwardRef` — count accurate but roster corrected: all 23 originally-named components remain, **plus `field.tsx`** (6 forwardRef exports: FieldRoot/Label/Control/Description/Error/Success) which the synthesis omitted. Adversarial note on urgency (React only *plans* forwardRef removal) stands as a severity caveat, not a factual rebuttal | 24 files: accordion, auto-save-input, avatar, card, checkbox, collapsible, **field**, image, input, label, otp-input, password-input, progress-indicator, progress, radio-group, settings-row, slider, spinner, status-icon, switch, table, tabs, textarea, toggle-group | C |
| P1-02 | P1 | **AMENDED** | Missing consumer refs: **all originally-cited exports are still unfixed** — `Bubble` (:111), `BubbleGroup` (:18), `BubbleReactions` (:214), `MarkerIcon` (:104), `MarkerContent` (:125), all 6 `message.tsx` exports (:20,53,73,92,111,130). The adversarial review's "now forward refs" claim pointed at `Marker` and `BubbleContent` — components the original finding never cited. Violation substantively unchanged | `bubble.tsx:18,111,214`; `marker.tsx:104,125`; `message.tsx:20-130` | C |
| P1-03 | P1 | **OPEN** | variant/color/intent all coexist for the semantic-family concept; Badge additionally layers its own `variant` (fill style) atop `color` | `button.tsx:19`, `alert.tsx:27`, `badge.tsx:24,29`, `alert-dialog.tsx:98,258`, `empty-state.tsx:42` | C |
| P1-04 | P1 | **OPEN** | Input/Textarea/RadioGroupItem/OTPInput expose no `size` prop (Textarea/OTPInput have no cva at all; radio item fixed `size-4`) | `input.tsx:39,54`; `radio-group.tsx:18-27,165`; `textarea.tsx`; `otp-input.tsx` | C |
| P1-05 | P1 | **OPEN** | Typography tokens essentially unused: 121 raw `text-xs/sm/base/lg/xl/2xl` vs 19 named-token uses across the registry (synthesis said 140+/122+ — same substance, updated count) | `markdown-view.tsx:23-68`; `text-edit.tsx:37-39`; ~30 files | T1 |
| P1-06 | P1 | **OPEN** | design.md self-contradiction on card padding: `:199` recipe = 16px, `:300` prose = "20px (16px compact, 32px hero)"; shipped = 16px default / 12px sm | `design.md:199,300`; `card.tsx:47,49` | C |
| P1-07 | P1 | **OPEN** | No solid destructive-fill button variant exists; `destructive` = `bg-destructive-subtle text-destructive-text`, plus `destructive-outline` — design.md recipe still specifies solid fill | `button.tsx:26-27,35-36` | C |
| P1-08 | P1 | **OPEN** | Bubble ring-glow focus — sole ring-based focus in system, verbatim `[button,a]:focus-visible:ring-3 …ring-ring/30` | `bubble.tsx:155` | C |
| P1-09 | P1 | **OPEN** | `--radius-xl` still shipped (`calc(var(--radius-lg) + 0.25rem)`) and used (`rounded-xl`) despite spec dropping the 5th step | `packages/tokens/dist/theme.css:208`; `bubble.tsx:155` | T5 |
| P1-10 | P1 | **OPEN** | `rounded-xs` used in 3 caret triangles; `radius-xs` undefined in the bridge (grep of theme.css: zero) — silent Tailwind 2px fallback | `popover.tsx:221`; `hover-card.tsx:260`; `tooltip.tsx:210` | T5 |
| P1-11 | P1 | **AMENDED** | No opacity token scale anywhere in `packages/tokens`; button.tsx's single cva now has **28** opacity-suffix literals (was 24 — grew) | `button.tsx:15-56`; 8+ form-control files | T2 |
| P1-12 | P1 | **OPEN** | No z-index token scale; 32 raw `z-N` occurrences across 18 files | `popover.tsx:156,163`; `sheet.tsx:31,145,152`; `select.tsx:220,226,236,243`; +14 files | T3 |
| P1-13 | P1 | **OPEN** | message-scroller `duration-200` + `data-[active=false]:duration-400`; token scale is 150/200/300 (`theme.css:81-83`) — 400 has no token | `message-scroller.tsx:164` | T4 |
| P1-14 | P1 | **OPEN** | Sole `ease-linear` in the registry, on sidebar collapse transitions | `sidebar.tsx:157,247` | T4 |
| P1-15 | P1 | **OPEN** | Sole non-token `shadow-sm` in registry (10 other files use `shadow-overlay`) | `color-picker.tsx:212` | C |
| P1-16 | P1 | **OPEN** | Overlay ease split unchanged: dropdown-menu/context-menu/tooltip/select lack `ease-standard`; dialog/popover/hover-card/command have it | missing: `dropdown-menu.tsx:92`, `context-menu.tsx:149`, `tooltip.tsx:166`, `select.tsx:227`; have: `dialog.tsx:32,139`, `popover.tsx:165`, `hover-card.tsx:218`, `command.tsx:202` | T4 |
| P1-17 | P1 | **AMENDED** | Bare `transition-*` without duration/ease: now **33 sites across 20 files** (was ~37/28); `checkbox.tsx` no longer qualifies (uses a bracketed property list) — drop it from the inventory; all other cited files stand | `accordion.tsx:92`, `alert.tsx:152`, `badge.tsx:21`, `breadcrumb.tsx:102`, `button.tsx:16`, `input.tsx:39,54`, `select.tsx:19`, `switch.tsx:17,41`, `tabs.tsx:153,175`, +remaining files per fresh grep | T4 |
| P1-18 | P1 | **AMENDED** | Axe-happy-path gap substantively true — ~28 test files have exactly one `expectNoA11yViolations` call on a default render — but not monolithic: `select.test.tsx` audits the popup-open state, `data-list`/`state-select` have 2 calls, `truncated-text` has 3 | test files under `packages/ui/registry/ui/*.test.tsx` (inventory: audit 05 §c, minus the 4 partial exceptions) | C |
| P1-19 | P1 | **AMENDED** | VRT: the self-skip logic is unchanged (`components.spec.ts:20-23`), but **74/74 PNG baselines now exist locally — untracked** (`git ls-files` = 0 snapshot files). CI-side no-op persists until they're committed. Also corrects the checklist's own "60/74" note → actual local state is 74/74 generated | `apps/docs/vrt/components.spec.ts:20-23`; `apps/docs/vrt/components.spec.ts-snapshots/` (untracked) | −1 |
| P1-20 | P1 | **OPEN** | `react-day-picker` still `^9.14.0` in both consumers; no removed-prop usage found in date-picker.tsx, but the major bump + grid-markup audit remains fully open | `packages/ui/package.json:44`; `apps/docs/package.json:39` | U |
| P1-21 | P1 | **AMENDED** | Structural observation true (icon-button.tsx = 62 lines, zero cva, pure size remap over Button) but the proposed fix is **REVERSED**: IconButton is RETAINED as the compile-time `aria-label`-enforcing wrapper (icon-button.tsx:38 requires it; ButtonProps does not) per adversarial review + checklist Phase C. Execution action = re-document, not delete | `icon-button.tsx` (whole file, `:38` for the aria-label requirement) | C |
| P1-22 | P1 | **OPEN** | `EmojiPicker.onSelect` vs `ColorPicker.onValueChange` naming split, verbatim at cited lines | `emoji-picker.tsx:427`; `color-picker.tsx:88` | C |
| P1-23 | P1 | **OPEN** | Chevron affordance split: Select = `ChevronDown`/`ChevronUp`; Country/StateSelect = `ChevronsUpDown` | `select.tsx:141,238,245`; `country-select.tsx:322`; `state-select.tsx:1556` | C |
| P1-24 | P1 | **OPEN** | `dark:bg-input/30` on all six form controls; zero `dark:bg-*` in card/popover/dialog/sheet | `input.tsx:41,55`; `textarea.tsx:27`; `select.tsx:21`; `checkbox.tsx:20`; `radio-group.tsx:166`; `otp-input.tsx:91` | C |
| P1-25 | P1 | **OPEN** | Smooth-scroll default with no reduced-motion check — the default lives in the vendored `@shadcn/react` primitive (`behavior:"smooth"` → `scrollTo`), and the VegaStack wrapper doesn't override it; fix must wrap/override `behavior` in the wrapper (or upstream) | `message-scroller.tsx:147-180` (wrapper); primitive in `@shadcn/react/dist/message-scroller` | C |
| P1-26 | P1 | **OPEN** | No icon-size token scale; button cva still hardcodes `[&_svg…]:size-3/3.5` + bare `size-6/7/8/10` | `button.tsx:40,45-50`; `packages/tokens` (zero icon tokens) | T5 |

## P2

| ID | Sev | Status | Finding | Current file:line | Phase |
|---|---|---|---|---|---|
| P2-01 | P2 | **OPEN** | Dual dotted+flat exports on exactly 5 components; rest flat-only. (Adversarial review argues for retaining dual exports — that's a disposition question for Phase C, not a factual rebuttal) | `card.tsx:183`, `alert.tsx:204`, `breadcrumb.tsx:184`, `empty-state.tsx:185`, `pagination.tsx:229` | C |
| P2-02 | P2 | **OPEN** | `ComponentPropsWithRef` vs bare `ComponentProps` mixed — marker.tsx mixes both forms in one file | `marker.tsx:41` (WithRef) vs `:97,118` (bare); dialog/popover/tooltip/hover-card/sheet/dropdown-menu/context-menu all bare | C |
| P2-03 | P2 | **OPEN** | component-matrix.md §7.6 stale: useRender list omits Marker (`marker.tsx:4,55,84`) and Bubble (`bubble.tsx:4,133,148`); only SplitButton listed as render-exemption. Nuance: the picker family has no render-prop machinery at all (simpler than SplitButton), so document them as a distinct exemption class | `docs/ledger/component-matrix.md:126,131` | C |
| P2-04 | P2 | **OPEN** | `data-status` (auto-save-input) vs `data-state` (image) for the same async-lifecycle concept | `auto-save-input.tsx:203`; `image.tsx:139` | C |
| P2-05 | P2 | **AMENDED** | Button variant enum now **14** flat values (was 13; grew) vs Badge's clean `variant`×`color` factoring | `button.tsx:19-42`; `badge.tsx:24-35` | C |
| P2-06 | P2 | **OPEN** | NotificationBell hand-rolls its badge span (no Badge import; raw `rounded-full bg-destructive…` span) | `notification-bell.tsx:72-90` | C |
| P2-07 | P2 | **OPEN** | `Loader`+`animate-spin` re-inlined in 4 files instead of composing `<Spinner>` | `button.tsx:118`; `badge.tsx:211`; `status-icon.tsx:105`; `auto-save-input.tsx:223` | C |
| P2-08 | P2 | **OPEN** | state-select.tsx = exactly 1597 lines; `STATES_BY_COUNTRY` literal spans `:47-1419` (1373 lines, 86%); no sibling data file exists | `state-select.tsx:47-1419` | C |
| P2-09 | P2 | **OPEN** | Three label-text implementations; settings-row hardcodes `text-sm font-medium leading-snug` with no Label import | `label.tsx:47`; `field.tsx:67`; `settings-row.tsx:46,149` | C |
| P2-10 | P2 | **OPEN** | No renames landed: still `EmptyState` (empty-state.tsx), `DataList` (data-list.tsx:271), `StateSelect` (state-select.tsx:1481) | `empty-state.tsx`; `data-list.tsx:271`; `state-select.tsx:1481` | C |
| P2-11 | P2 | **OPEN** | TooltipKbd `<kbd>` uses bare `rounded`; standalone Kbd uses `rounded-sm` (self-documented at kbd.tsx:10) | `tooltip.tsx:236` vs `kbd.tsx:10,15` | T5 |
| P2-12 | P2 | **OPEN** | `ring-2`/`ring-3`/`border-2` literals, no token scale, undocumented as exceptions | `date-picker.tsx:295`; `avatar.tsx:146`; `bubble.tsx:155,168`; `slider.tsx:210` | T5 |
| P2-13 | P2 | **OPEN** | `SIDEBAR_WIDTH='15rem'`/`SIDEBAR_WIDTH_ICON='3rem'` literal JS constants, invisible to design-lint | `sidebar.tsx:13,15` (used `:118-119`) | T5 |
| P2-14 | P2 | **OPEN** | JS magic numbers + inconsistent sideOffset/collisionPadding (4/6/8 & 8/16); no shared timing module in `packages/utils` (only `index.ts`) | `copy-button.tsx:61`; `auto-save-input.tsx:103`; `hover-card.tsx:83-84,189`; `popover.tsx:134,136`; `select.tsx:206`; `dropdown-menu.tsx:140-141`; `context-menu.tsx:195-196`; `tooltip.tsx:136`; `emoji-picker.tsx:565` | T5 |
| P2-15 | P2 | **AMENDED** | The lint-gap is real (zero rules for opacity/typography/z-index/shadow/ring/duration/easing/JS values — confirmed by grep), but the "false header claim" half is stale: design-lint.mjs's header (`:6-23`) now honestly documents its scope as color/`!important`/icon-source/render-contract/inline-style only | `tooling/design-lint.mjs:1-40` | A |
| P2-16 | P2 | **OPEN** | TableHead `h-9` (36px) off the 28/32/40 scale; JSDoc says "compact" but never reconciles against design.md | `table.tsx:140,153` | C |
| P2-17 | P2 | **AMENDED** | Adversarial review is right that `xs` IS documented at component level (`button.mdx:33,46-47`); still absent from design.md's canonical control-height table (`design.md:188`: "sm 28 · md 32 · lg 40"). Corrected claim: system-level scale doc omits xs, component doc covers it | `button.tsx:44-51`; `design.md:188`; `apps/docs/content/docs/components/button.mdx:33` | C |
| P2-18 | P2 | **OPEN** | Switch `sm/default/lg` = h-4/5/6 track (16/20/24px) — same tier names, different physical scale vs Button's 28/32/40 | `switch.tsx:24-26` | C |
| P2-19 | P2 | **OPEN** | FilterChip `h-8` + `text-xs` (every other 32px control uses text-sm) | `filter-bar.tsx:193` | T1 |
| P2-20 | P2 | **OPEN** | Command search input `h-10` (lg tier) among md-scale items | `command.tsx:171,178` | C |
| P2-21 | P2 | **OPEN** | Zero `$description` fields across all three token files | `packages/tokens/tokens/*.tokens.json` | T6 |
| P2-22 | P2 | **FIXED** | Radius-independence divergence is now surfaced in public docs: radius.mdx documents "Four real radii ship in `:root`, plus one alias and one calc-derived step"; theming.mdx:64 spells out sm/md/lg are independent | `apps/docs/content/docs/foundations/radius.mdx:14-48`; `theming.mdx:64` | — (done) |
| P2-23 | P2 | **OPEN** | 8 hover/active OKLCH pairs hand-authored as literals; no SD preprocessor derives them (checked `sd-hooks.mjs`/`build-tokens.mjs`) | `packages/tokens/tokens/semantic.tokens.json:27-49` | T6 |
| P2-24 | P2 | **OPEN** | `purple`/`purple-foreground` still in PAIRS (`:21`) and SUBTLE_FAMILIES (`:57`) with zero purple tokens in the token files; `continue`-guard fails open silently | `tooling/contrast-check.mjs:21,57` | U |
| P2-25 | P2 | **AMENDED** | Still missing: muted-foreground on background/card, `muted-foreground-faint` (a real token, `theme.css:23`), and all non-text contrast. But partially fixed: a new loop (`:55-57,93-104`) now checks chromatic `-text` on background/card/`-subtle` for 5 families — the opacity-composited criticism is partially addressed | `tooling/contrast-check.mjs:16-32,57,93-104` | U |
| P2-26 | P2 | **OPEN** | Copy confirmation is aria-label swap only; zero `aria-live`/`role="status"` in file | `copy-button.tsx:102` | C |
| P2-27 | P2 | **AMENDED** | Component still ships no built-in guard (`aria-disabled:pointer-events-none` only, keyboard Enter navigates); new nuance: the docs preview now demonstrates the `tabIndex={-1}` workaround (`apps/docs/components/preview/pagination.tsx:112`) — opt-in per consumer, not enforced | `pagination.tsx:85` | C |
| P2-28 | P2 | **OPEN** | Image error fallback span has no `aria-label={alt}`/`role="img"` | `image.tsx:168-175` | C |
| P2-29 | P2 | **OPEN** | TextEditProps: `aria-label`/`aria-invalid`/`aria-describedby` only — no `id`/`aria-labelledby` | `text-edit.tsx:258-273` | C |
| P2-30 | P2 | **OPEN** | emoji-picker/color-picker grids Tab-only; zero roving-tabindex/arrow handlers in either file | `emoji-picker.tsx:605-620`; `color-picker.tsx:183-220` | C |
| P2-31 | P2 | **OPEN** | slider.test.tsx (10 tests): zero Arrow/Home/End keyboard coverage | `slider.test.tsx` | C |
| P2-32 | P2 | **OPEN** | AlertDialogActionProps has only `intent` — no loading/pending wiring | `alert-dialog.tsx:252-259` | C |
| P2-33 | P2 | **OPEN** | FieldInlineProps has no disabled/readOnly/error | `field-inline.tsx:9-50` | C |
| P2-34 | P2 | **OPEN** | Four docblocks still claim a `:focus-visible` ring that no className delivers (global outline is the real behavior) | `radio-group.tsx:150`; `slider.tsx:118`; `select.tsx:121`; `checkbox.tsx:86` | C |
| P2-35 | P2 | **OPEN** | tabs/alert redeclare the global focus-visible outline trio byte-identically (`packages/tokens/src/base.css:16` is the global rule) | `tabs.tsx:204`; `alert.tsx:152` | C |
| P2-36 | P2 | **AMENDED** | TableHead still has no `scope="col"` default (main claim OPEN); but the "component's own tests omit it too" half is stale — `table.test.tsx:115-117` now passes `scope="col"` explicitly | `table.tsx:144-159`; `table.test.tsx:115-117` | C |
| P2-37 | P2 | **OPEN** | External links get `target="_blank" rel="noreferrer noopener"` (`:86`) but no SR "opens in new window" hint; raw h1-h6 mapping unchanged | `markdown-view.tsx:20-73,86` | C |
| P2-38 | P2 | **OPEN** | Ellipsis carries both `role="presentation"` and `aria-hidden="true"` | `pagination.tsx:209-210` | C |
| P2-39 | P2 | **OPEN** | SplitButton primary half gets `loading`; chevron half gets only `disabled`, no loading cue | `split-button.tsx:152,166-175` | C |
| P2-40 | P2 | **OPEN** | relative-time silent periodic updates; no aria-live and no JSDoc note documenting the decision | `relative-time.tsx:178-195,210-224` | C |
| P2-41 | P2 | **OPEN** | eslint pinned `^9.39.4` everywhere (config pkg `^9.0.0`) — unchanged; upstream "10.7.0" figure not re-verified against the live registry | `apps/docs/package.json:58`; `config/eslint-config/package.json:18`; +3 pkgs | U |
| P2-42 | P2 | **OPEN** | typescript `^6.0.3` catalog pin unchanged — correctly gated; no action until TS 7.1 ecosystem readiness | `pnpm-workspace.yaml:11` | U (deferred) |
| P2-43 | P2 | **OPEN** | shadcn CLI `4.7.0` both places, unchanged | `package.json:26`; `apps/docs/package.json:61` | U |
| P2-44 | P2 | **OPEN** | `@shadcn/react` `^0.1.0` both places; AGENTS.md:9 still says "the ONLY non-Base-UI primitive" — wording not yet broadened (checklist X2 item unchecked) | `packages/ui/package.json:33`; `apps/docs/package.json:18`; `AGENTS.md:9` | U (+X2 for wording) |
| P2-45 | P2 | **OPEN** | lucide-react mismatch unchanged: `^1.21.0` (docs) vs `^1.20.0` (ui, icons) | `apps/docs/package.json:34`; `packages/ui/package.json:42`; `packages/icons/package.json:28` | U |
| P2-46 | P2 | **OPEN** | style-dictionary `5.4.4` unchanged | `packages/tokens/package.json:35` | U |
| P2-47 | P2 | **OPEN** | Linear progress fill fully tokenized (`progress.tsx:129`); circular fill `<circle strokeDasharray…>` has zero transition — value changes snap | `progress.tsx:129`; `progress-indicator.tsx:187-197` | M |
| P2-48 | P2 | **OPEN** | motion.mdx:7 still frames `motion` as "an optional peer"; it's a real `dependencies` entry (`apps/docs/package.json:35`) and 439 vendored icon files import `motion/react` with hardcoded springs (e.g. `settings.tsx:74` `stiffness: 50, damping: 10`; `minimize.tsx:26` `stiffness: 250`). Doc fix is cheap/standalone; the token-system-exception decision is Phase M scope | `apps/docs/content/docs/foundations/motion.mdx:7`; `packages/ui/registry/ui/icons/` (439 files) | M (doc half can land earlier) |

## P3

| ID | Sev | Status | Finding | Current file:line | Phase |
|---|---|---|---|---|---|
| P3-01 | P3 | **OPEN** | None of the shadcn-parity components exist yet (Attachment/Item/Combobox/Resizable/Chart/Input Group/Button Group/Drawer/Calendar/Navigation Menu/Aspect Ratio/Carousel/Menubar/Native Select/Direction); X1/X2 checklist items all unchecked | `packages/ui/registry/ui/` (dir listing) | X1 (Combobox) + X2 (Attachment/Item/Resizable/Chart); rest BKLG |
| P3-02 | P3 | **OPEN** | field.tsx anatomy pre-dates shadcn's FieldGroup/FieldSet/FieldLegend/FieldContent + `orientation="responsive"` (only vertical\|horizontal at `:19-24`) | `field.tsx:17-24` | C |
| P3-03 | P3 | **OPEN** | `React.ReactElement` vs `React.JSX.Element` split unchanged at all cited lines | `icon-button.tsx:56`; `page-header.tsx:103,169`; `notification-bell.tsx:65`; `split-button.tsx:124`; `state-select.tsx:1492` | C |
| P3-04 | P3 | **OPEN** | DataList `align?: "start" \| "end"` vs overlay family's three-value align | `data-list.tsx:57` | C |
| P3-05 | P3 | **OPEN** | State-feedback swaps have no transition (spot-verified: auto-save-input icon swap, copy-button swap, checkbox indicator, notification-bell badge; progress-indicator covered by P2-47) | `auto-save-input.tsx:213-241`; `copy-button.tsx`; `checkbox.tsx:118-130`; `notification-bell.tsx`; `message.tsx`/`bubble.tsx` | M |
| P3-06 | P3 | **OPEN** | Switch/Slider thumb `transition-transform` with no duration/ease token (these two sites are part of P1-17's 33-site inventory) | `switch.tsx:41`; `slider.tsx:211` | T4 |
| P3-07 | P3 | **OPEN** | Sonner motion exception undocumented — zero sonner/toast mention in motion.mdx | `sonner.tsx`; `foundations/motion.mdx` | M (doc note) |
| P3-08 | P3 | **OPEN** | Dialog/Sheet still `duration-fast ease-standard`; no `duration-slow` anywhere in either file — owner-judgment option, not a defect | `dialog.tsx:32,139`; `sheet.tsx:33,146` | M (decision) |
| P3-09 | P3 | **OPEN** | Zero APCA/perceptual code in contrast-check.mjs | `tooling/contrast-check.mjs` | A |
| P3-10 | P3 | **OPEN** | next.config.mjs has no `reactCompiler`/adapters config (only `output:'export'`, `reactStrictMode`, `serverExternalPackages`) | `apps/docs/next.config.mjs:1-13` | BKLG |
| P3-11 | P3 | **OPEN** | Routine bump sweep untouched — all pins match the synthesis "before" side: pnpm 11.7.0, turbo ^2.9.18, wrangler ^4.103.0, next 16.2.9, tailwindcss ^4.3.1, motion ^12.40.0, fumadocs 16.10.5 (still deliberately in `minimumReleaseAgeExclude`) | root `package.json:5,28`; `pnpm-workspace.yaml`; `apps/docs/package.json` | U |
| P3-12 | P3 | **OPEN** | Verbatim unchanged: "DTCG 2025.10 is a *draft* CG report" — spec is stable since Oct 2025 | `docs/plans/detail/02-tokens-and-theming.md:255` | Z |
| P3-13 | P3 | **OPEN** | AGENTS.md has zero sonner/toast mention; only the message-scroller exception is documented (`AGENTS.md:9`); toast.mdx:18-19 still self-documents the split | `AGENTS.md`; `apps/docs/content/docs/components/toast.mdx:18-19` | Z |

---

## Recomputed counts

**By status:**

| Status | Count |
|---|---:|
| OPEN | 80 |
| AMENDED | 13 |
| FIXED | 1 |
| STALE/WRONG | 0 |
| **Total** | **94** |

**By severity × status:**

| Severity | OPEN | AMENDED | FIXED | STALE/WRONG | Total |
|---|---:|---:|---:|---:|---:|
| P0 | 7 | 0 | 0 | 0 | 7 |
| P1 | 19 | 7 | 0 | 0 | 26 |
| P2 | 41 | 6 | 1 | 0 | 48 |
| P3 | 13 | 0 | 0 | 0 | 13 |
| **Total** | **80** | **13** | **1** | **0** | **94** |

**By phase (primary assignment):** P 7 · T1 2 (P1-05, P2-19) · T2 1 (P1-11) · T3 1 (P1-12) · T4 6 (P1-13/14/16/17, P3-06, +P0-06 fix executes in P) · T5 7 (P1-09/10/26, P2-11/12/13/14) · T6 2 (P2-21/23) · U 11 (P1-20, P2-24/25/41/42/43/44/45/46, P3-11) · C 43 · X1/X2 1 (P3-01) · M 5 (P2-47/48, P3-05/07/08) · A 2 (P2-15, P3-09) · Z 2 (P3-12/13) · −1 1 (P1-19) · BKLG 1 (P3-10) · done 1 (P2-22).

## Status changes vs. the original register (all 94 were implicitly OPEN)

1. **P2-22 → FIXED** — the radius-independence divergence is now documented in `radius.mdx` + `theming.mdx:64` (resolved since the synthesis was written).
2. **P1-01 → AMENDED** — 24-count holds only because `field.tsx` (6 forwardRef exports) was missing from the synthesis's 23-name roster.
3. **P1-02 → AMENDED** — all originally-cited exports still lack refs; the adversarial review's "fixed" claim pointed at Marker/BubbleContent, which were never the cited components.
4. **P1-11 → AMENDED** — opacity-literal count in button.tsx grew 24 → 28.
5. **P1-17 → AMENDED** — bare-transition inventory now 33 sites / 20 files (was ~37/28); `checkbox.tsx` no longer qualifies.
6. **P1-18 → AMENDED** — happy-path-only axe gap is real for the overwhelming majority, but select/data-list/state-select/truncated-text already have partial extra-state coverage.
7. **P1-19 → AMENDED** — 74/74 VRT baselines now exist **locally, untracked**; CI no-op persists until committed. (Also corrects the checklist's stale "60/74".)
8. **P1-21 → AMENDED** — structural finding true; the deletion proposal is formally REVERSED (IconButton retained as the aria-label-enforcing wrapper).
9. **P2-05 → AMENDED** — Button variant enum is now 14 values, not 13.
10. **P2-15 → AMENDED** — design-lint's header no longer over-claims (now honestly scoped); the rule gaps themselves remain fully real.
11. **P2-17 → AMENDED** — `xs` IS documented in `button.mdx` (adversarial review correct); still absent from design.md's canonical control-height table.
12. **P2-25 → AMENDED** — contrast-check gained a chromatic-text-on-surface loop since the audit; muted-foreground/faint/non-text gaps remain.
13. **P2-27 → AMENDED** — docs preview now demonstrates the `tabIndex={-1}` mitigation; the component-level gap is unchanged.
14. **P2-36 → AMENDED** — `table.test.tsx` now uses `scope="col"`; the component still ships no default.

**Adversarial-review claims adjudicated:** marker/bubble `'use client'` — **still missing** (P0-01 OPEN; the review's ref-forwarding point was a different issue and targeted uncited components) · field.tsx horizontal description — confirmed OPEN · select.tsx scale transition — confirmed OPEN (sibling divergence is fact) · popover/sheet outline-none — confirmed OPEN · Button xs — review partially right (P2-17 AMENDED) · VRT no-op — review partially right (P1-19 AMENDED: local yes, CI no) · forwardRef urgency — noted as severity caveat on P1-01, count itself re-verified.
