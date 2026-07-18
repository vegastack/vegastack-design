# Motion/animation audit — `packages/ui/registry/ui/*.tsx`

Date: 2026-07-14
Scope: 68 canonical components in `packages/ui/registry/ui/*.tsx` (excludes `*.test.tsx`, `__screenshots__`, and the vendored `registry/ui/icons/**` mirror — 439 `lucide-animated` icon components, treated separately in §(a3) below). Method: read `packages/tokens/tokens/*.tokens.json` + compiled `packages/tokens/dist/theme.css` (the `@theme inline` bridge — authoritative list of which Tailwind motion utilities are token-backed), `packages/tokens/src/base.css` (reduced-motion reset), `packages/tokens/src/utilities.css` (`scroll-fade`/`shimmer` keyframes), `packages/tailwind-preset/preset.css`, `tooling/design-lint.mjs`, and `apps/docs/content/docs/foundations/motion.mdx` (the documented intent); then grepped every animation/transition-related class across all 68 files and read the 10 named overlay components plus accordion/collapsible/tabs/sidebar/checkbox/switch/notification-bell/copy-button/auto-save-input/progress-indicator/message-scroller line-by-line.

**Headline:** the token layer is real and correctly wired (`--duration-fast/base/slow` → `duration-fast/base/slow`, `--motion-ease-standard/emphasized/exit` → `ease-standard/emphasized/exit`, both bridged via `@theme inline`), and a genuinely strong, WCAG-correct global `prefers-reduced-motion` reset exists in `base.css`. But roughly **half of all `transition-*` declarations in the 68 components never attach a `duration-*`/`ease-*` token class**, silently falling back to Tailwind's untokenized built-in default (150ms, `cubic-bezier(0.4,0,0.2,1)` — a *different* curve than any of the three declared eases). The overlay family (dialog/alert-dialog/sheet/popover/hover-card/command vs. dropdown-menu/context-menu/tooltip/select) is split down the middle on whether it includes `ease-standard`. `motion` (the JS library) is used **only** inside the 439 mirrored `lucide-animated` icon files — **zero** usage in the 68 real components or in `apps/docs` itself. This is a `tw-animate-css` + Base UI `data-starting-style`/`data-ending-style` + hand-written token-duration transitions system, exactly as documented in `foundations/motion.mdx` — the gaps are drift from that documented intent, not architectural confusion.

---

## (a) Per-component motion inventory

Legend: **Tok** = duration/easing both route through a token utility (`duration-fast/base/slow`, `ease-standard/emphasized/exit`). **Partial** = duration tokenized but easing missing (or vice versa), or a hardcoded literal alongside a token. **Untok** = relies on Tailwind's bare `transition-*` default (no duration/ease class at all). **RM** = `prefers-reduced-motion` handling beyond the global CSS reset (explicit `motion-reduce:` variant). **—** = no animation present.

### (a1) Overlays (Portal + Backdrop + Popup, Base UI `data-starting-style`/`data-ending-style`)

| Component | What animates | Duration / Easing | Tokenized? | Reduced-motion |
|---|---|---|---|---|
| `dialog.tsx:32,139` | Backdrop opacity 0↔1; Popup scale-95→100 + opacity 0↔1 | `duration-fast` `ease-standard` (both layers) | Tok | Global reset only |
| `alert-dialog.tsx:120,138` | Backdrop opacity; Popup scale-95→100 + opacity | `duration-fast` `ease-standard` (both layers) | Tok | Global reset only |
| `sheet.tsx:33,146` | Backdrop opacity; Panel `translate-{x,y}-full` per `side` | `duration-fast` `ease-standard` (both layers) | Tok | Global reset only |
| `popover.tsx:165` | `transform,scale,opacity` (Popup) | `duration-fast` `ease-standard` | Tok | Global reset only |
| `hover-card.tsx:218` | `transform,scale,opacity` (Popup) | `duration-fast` `ease-standard` | Tok | Global reset only |
| `command.tsx:202` (list height, used inside Dialog/Popover) | `height` (list resize as filtered items change) | `duration-fast` `ease-standard` | Tok | Global reset only |
| `dropdown-menu.tsx:92` | `transform,scale,opacity` (Popup) | `duration-fast`, **no ease class** | **Partial** | Global reset only |
| `context-menu.tsx:149` | `transform,scale,opacity` (Popup) | `duration-fast`, **no ease class** | **Partial** | Global reset only |
| `tooltip.tsx:166,169` | `transform,scale,opacity`; `data-[instant]:duration-0` for skip-delay chains | `duration-fast`, **no ease class** | **Partial** | Global reset only |
| `select.tsx:227` | `transform,opacity` (Popup) — **`scale` omitted from the transition-property list even though `scale-95` is applied on start/end** | `duration-fast`, **no ease class** | **Partial** (+ likely-broken scale transition, see §b4) | Global reset only |
| `select.tsx:139` | Trigger chevron `rotate-180` on open | `duration-fast`, no ease | Partial | Global reset only |

### (a2) Disclosure / height animation

| Component | What animates | Duration / Easing | Tokenized? | Notes |
|---|---|---|---|---|
| `accordion.tsx:104,136` | Chevron `rotate-180`; Panel `h-[var(--accordion-panel-height)]` 0↔auto | `duration-fast` `ease-standard` (both) | Tok | Identical pattern to `collapsible.tsx` |
| `collapsible.tsx:72,107` | Chevron `rotate-180`; Panel `h-[var(--collapsible-panel-height)]` 0↔auto | `duration-fast` `ease-standard` (both) | Tok | Byte-identical approach to `accordion.tsx` — good consistency |
| `tabs.tsx:114` | Indicator `left/width` (horizontal) or `top/height` (vertical) via `transition-all` + Base UI `--active-tab-*` vars | `duration-fast` `ease-standard` | Tok | `transition-all` is broader than needed (Geist guidance: list only animated props) but harmless here since only position/size change |

### (a3) State-feedback / indeterminate animations

| Component | What animates | Duration / Easing | Tokenized? | Reduced-motion |
|---|---|---|---|---|
| `spinner.tsx:16` | `animate-spin` (indeterminate loading) | `animate-spin` (Tailwind built-in keyframe, ~1s linear) | N/A (spin speed not on our token scale) | **RM** — `motion-reduce:animate-none` |
| `button.tsx:118` | Loader `animate-spin` when `loading` | same | N/A | **RM** |
| `badge.tsx:211` | Loader `animate-spin` when `loading` | same | N/A | **RM** |
| `auto-save-input.tsx:223` | Loader `animate-spin` while `saving` | same | N/A | **RM** (spinner only — see §d for the missing icon-swap transition) |
| `status-icon.tsx:105` | Loader `animate-spin` for `status="progress"` | same | N/A | **RM** |
| `image.tsx:151,163` | Image `opacity` 0→1 on decode; skeleton `animate-pulse` underneath | `duration-fast` (image fade); `animate-pulse` (Tailwind built-in, ~2s) | Partial (fade tokenized, pulse isn't token-scale) | **RM** on the pulse only |
| `skeleton.tsx:14` | `animate-pulse` | Tailwind built-in (~2s) | N/A | **RM** |
| `progress.tsx:129` | Linear fill `width` | `duration-base` `ease-standard` | Tok | **RM** — `motion-reduce:transition-none` |
| `progress-indicator.tsx` | **None** — circular/radial fill (`strokeDasharray`) has no `transition` at all; value changes jump discretely | — | — | — |
| `slider.tsx:211` | Thumb `scale-110` while dragging | `transition-transform`, **no duration/ease class** | **Untok** | **RM** — `motion-reduce:transition-none` (present despite being untokenized) |
| `scroll-area.tsx:38,40` | Scrollbar `opacity` 0↔1 on hover/scroll | `duration-fast` `ease-standard` | Tok | Global reset only |
| `message-scroller.tsx:164` | Scroll-to-end/start button `translate,scale,opacity` | **`duration-200`** (base transition) + **`duration-400`** (hide state) — literal numeric Tailwind classes, not `duration-*` tokens; `ease-exit`/`ease-emphasized` ARE token classes | **Partial / mixed** — eases are tokenized, durations are not (see §c) | Global reset only |
| `sidebar.tsx:157,247` | Rail `width`; label `margin,opacity` on collapse | `duration-base` **`ease-linear`** (not one of the 3 declared eases) | **Partial** — duration tokenized, easing is a raw Tailwind default | Global reset only |
| `sidebar.tsx:298` | Active-item rail indicator `scale-y-0→1` | `transition-transform`, **no duration/ease** | **Untok** | Global reset only |

### (a4) Bare/untokenized hover-transition group (no `duration-*`/`ease-*` at all)

All of these use `transition-colors` / `transition-all` / `transition-transform` / `transition-opacity` / `transition-[...]` with **no** duration or easing class, so they silently inherit Tailwind's built-in default (`150ms`, `cubic-bezier(0.4,0,0.2,1)`):

`accordion.tsx:92`, `alert.tsx:152`, `badge.tsx:21`, `breadcrumb.tsx:102`, `bubble.tsx:155`, `button.tsx:16`, `checkbox.tsx:19`, `collapsible.tsx:68`, `data-list.tsx:441,449`, `date-picker.tsx:137,141`, `dialog.tsx:162`, `emoji-picker.tsx:614`, `field-inline.tsx:203`, `input.tsx:39,54`, `otp-input.tsx:90`, `pagination.tsx:85`, `password-input.tsx:37,105`, `radio-group.tsx:165,178`, `select.tsx:19`, `sheet.tsx:167`, `sidebar.tsx:293,298,423`, `slider.tsx:211`, `switch.tsx:17,41`, `table.tsx:128`, `tabs.tsx:153,175`, `text-edit.tsx:497`, `textarea.tsx:25`, `toggle.tsx:22`.

That's **~37 declarations across ~28 files** — the single largest category in this audit. See §(c) for the tokenization gap and §(b1) for why this contradicts the component-build-rules intent.

### (a5) No animation present at all

`avatar.tsx`, `card.tsx`, `copy-button.tsx` (icon swap — see §d), `country-select.tsx`, `empty-state.tsx`, `field.tsx`, `filter-bar.tsx`, `icon-button.tsx` (inherits `Button`'s transitions via composition), `kbd.tsx`, `label.tsx`, `markdown-view.tsx`, `marker.tsx`, `message.tsx` (new-message entry — see §d), `notification-bell.tsx` (badge appear — see §d), `page-header.tsx`, `progress-indicator.tsx` (see §a3), `relative-time.tsx`, `separator.tsx`, `settings-row.tsx`, `split-button.tsx` (inherits `Button`), `state-select.tsx`, `toggle-group.tsx`, `truncated-text.tsx`.

### (a6) JS-driven motion (`motion`/`motion/react`)

**Zero** usage of the `motion` npm package anywhere in the 68 canonical components, and zero usage anywhere in `apps/docs` source (the only "motion" hits in `apps/docs` are the `foundations/motion.mdx` doc-route filenames, a string coincidence, not the library). The **only** place `motion`/`motion/react` is imported is inside `packages/ui/registry/ui/icons/*.tsx` — 439 files, 100% of that directory — each a `lucide-animated` mirror (e.g. `minimize.tsx`) generated by `tooling/mirror-animated-icons.mjs` (header: *"do NOT hand-edit"*). Every one of those files hardcodes its own spring transition inline:

```ts
const DEFAULT_TRANSITION: Transition = { type: "spring", stiffness: 250, damping: 25 };
```

— a **hardcoded, per-file, non-token spring** (stiffness/damping numbers repeated 439 times), triggered on hover/imperative `startAnimation()`. This is upstream `lucide-animated` content, vendored verbatim, and is out of scope for hand-editing per its own header — but it means: (1) the animated-icon layer's motion values are **completely outside** the `--duration-*`/`--motion-ease-*` token system, and (2) `motion` is a real runtime dependency of `@vegastack/ui` today, contradicting the `foundations/motion.mdx` framing of it as "an optional peer, used only where genuinely needed" — it's not optional if any consumer imports one animated icon.

### (a7) Third-party-owned motion (not token-driven, not hand-authored)

`sonner.tsx` — the `Toaster` wraps the `sonner` npm package directly. Toast enter/exit/swipe-to-dismiss/stack-reflow animation is entirely internal to `sonner`'s own CSS (its own duration/easing, shipped in the library's stylesheet) and is not represented anywhere in our token system or overridable via `duration-*`/`ease-*` classes. `toastOptions`/`classNames` only reach color/spacing, not motion.

---

## (b) Inconsistencies (file:line)

**(b1) Documented intent vs. actual usage — bare transitions.** `apps/docs/content/docs/foundations/motion.mdx:33-35` gives the canonical example `className="transition-colors ease-standard duration-fast"` — i.e. the documented pattern is to *always* pair a `transition-*` with an explicit token duration+easing. §(a4) shows ~37 call sites across ~28 files that don't do this. This isn't a hypothetical drift risk — Tailwind's untokenized default duration (150ms) happens to numerically match `duration-fast`, which is presumably why nobody noticed, but the **easing** curve is different (`cubic-bezier(0.4,0,0.2,1)` vs. our `ease-standard` = `cubic-bezier(0.2,0,0,1)`), so these ~28 components' hover/focus transitions render on a visibly different curve than the ones that do specify `ease-standard`.

**(b2) Overlay family split on easing.** Two identical-shaped groups of overlay components diverge on whether the transition includes an ease token, despite using the exact same `transition-[transform,scale,opacity]` shorthand and the same `data-[starting-style]`/`data-[ending-style]` scale-95/opacity-0 pattern:
- **Has `ease-standard`:** `dialog.tsx:32,139`, `alert-dialog.tsx:120,138`, `sheet.tsx:33,146`, `popover.tsx:165`, `hover-card.tsx:218`, `command.tsx:202`.
- **Missing the ease class:** `dropdown-menu.tsx:92`, `context-menu.tsx:149`, `tooltip.tsx:166`, `select.tsx:227,139`.

Since `dropdown-menu`/`context-menu`/`popover`/`hover-card` are visually the same "small popup" category (same width scale, same `origin-[var(--transform-origin)]`, same border/shadow treatment), a user opening a `Popover` vs. a `DropdownMenu` in the same screen sees two different easing curves on an otherwise identical scale+fade. This reads as unintentional (no comment anywhere explains why menus/tooltip/select were left out), not a deliberate category distinction.

**(b3) `sidebar.tsx` is the only component using `ease-linear`.** Lines 157 and 247 use `duration-base ease-linear` — `ease-linear` is a raw Tailwind built-in, not one of the three declared tokens (`ease-standard`/`ease-emphasized`/`ease-exit`). Every other width/size transition in the system uses `ease-standard`. No comment justifies linear easing for the sidebar collapse specifically (linear can be a deliberate choice for a *continuous drag-following* animation, but the sidebar collapse is a discrete open/close toggle, not a drag — so `ease-standard` or `ease-emphasized` would match the rest of the system better). Also flagged independently in `docs/audits/2026-07-14-system-audit/01-token-purity.md` (finding #4).

**(b4) `select.tsx:227` — `scale` missing from the `transition-[...]` property list.** Every sibling overlay (`popover.tsx:165`, `hover-card.tsx:218`, `dropdown-menu.tsx:92`, `context-menu.tsx:149`) transitions `transform,scale,opacity` (three properties — Tailwind v4's `scale-*` utility sets the standalone CSS `scale` property, distinct from `transform`). `select.tsx:227` only lists `transform,opacity`, yet still applies `data-[starting-style]:scale-95`/`data-[ending-style]:scale-95` (line 228-229). Net effect: the `scale` property change is **not covered by the transition list**, so the select popup's scale-in likely snaps instantly while opacity fades — a visible micro-bug, not just a style inconsistency.

**(b5) `message-scroller.tsx:164` mixes tokenized eases with hardcoded durations, contradicting its own doc comment.** The component's file-header comment (line ~20) states *"Every class is a semantic token / our motion-ease tokens"*, but the actual class string uses literal `duration-200` and `duration-400` (Tailwind's built-in numeric duration scale) alongside genuinely tokenized `ease-exit`/`ease-emphasized`. `duration-200` happens to equal `duration-base` (200ms) — should just be `duration-base`. `duration-400` has **no equivalent token** in the 3-step scale (`fast`=150/`base`=200/`slow`=300) — this is either a bug (should be `duration-slow` at 300ms) or evidence the 3-step scale is too coarse for this component's slower "hide" transition. Also flagged in `01-token-purity.md`.

**(b6) `progress.tsx` (linear) animates, `progress-indicator.tsx` (circular) doesn't.** Both are progress primitives in the same system; `progress.tsx:129` transitions `width` with `duration-base ease-standard` + `motion-reduce:transition-none`, but `progress-indicator.tsx`'s `strokeDasharray` on the pie-fill `<circle>` (lines ~186-197) has zero `transition` — every `value` change is a hard jump. A user swapping between the two progress components in the same UI gets inconsistent behavior on the exact same semantic action (progress updating).

**(b7) Accordion/Collapsible height pattern vs. everything else.** `accordion.tsx` and `collapsible.tsx` are the two components that correctly use the CSS-var-driven `transition-[height]` + `data-[starting-style]:h-0`/`data-[ending-style]:h-0` pattern and are byte-identical in approach — this is the one part of the system with zero inconsistency. Worth calling out as the reference pattern other height/size-animated components (`sidebar.tsx`'s width collapse, `command.tsx`'s list height) should be checked against; `command.tsx:202` already matches it (`transition-[height] duration-fast ease-standard`), `sidebar.tsx` does not (uses `ease-linear`, see b3).

---

## (c) Hardcoded motion values (not routed through `duration-fast/base/slow` or `ease-standard/emphasized/exit`)

| File:Line | Value | Should be |
|---|---|---|
| `message-scroller.tsx:164` | `duration-200` | `duration-base` (identical 200ms value — pure drift) |
| `message-scroller.tsx:164` | `duration-400` | No token matches; either `duration-slow` (300ms, changes the feel) or a new 4th duration step is needed |
| `sidebar.tsx:157` | `ease-linear` | `ease-standard` (or a deliberate, commented exception if linear really is intended for the drag-following case) |
| `sidebar.tsx:247` | `ease-linear` | same |
| `animate-spin` (7 files: `spinner.tsx`, `button.tsx`, `badge.tsx`, `auto-save-input.tsx`, `status-icon.tsx`) | Tailwind's built-in ~1s linear spin keyframe | Not on our duration scale at all — acceptable as a platform default (spin speed isn't really a "duration token" concept), but worth an explicit acknowledgment in `foundations/motion.mdx` that indeterminate spinners are intentionally exempt |
| `animate-pulse` (`skeleton.tsx`, `image.tsx`) | Tailwind's built-in ~2s pulse keyframe | Same as above — exempt-by-convention, undocumented |
| `icons/*.tsx` (439 files) | `{ type: "spring", stiffness: 250, damping: 25 }` hardcoded per file | Vendored/generated, out of scope for hand-editing, but should be flagged as "not on our token system" in any consumer-facing motion doc |
| ~37 bare `transition-colors`/`transition-all`/`transition-transform`/`transition-opacity` sites (§a4) | Tailwind's untokenized default (150ms `cubic-bezier(0.4,0,0.2,1)`) | Should each gain explicit `duration-fast ease-standard` per the pattern `foundations/motion.mdx` itself documents |

`design-lint.mjs`'s arbitrary-value rule only catches **bracketed** literals (`duration-[220ms]`); it does not catch bare numeric Tailwind utilities like `duration-200`/`duration-400`, nor does it catch the *absence* of a duration/ease class. Both `message-scroller.tsx`'s hardcoded durations and the entire §(a4) bare-transition group are currently invisible to tooling — this needs either a new lint rule or the docs/comment claims should be softened to match reality.

---

## (d) Missing-motion opportunities (ranked, subtle-only — per owner's "no flashy effects, state animations OK" brief)

1. **`AutoSaveInput` status icon swap** (`auto-save-input.tsx:218-230`) — `Loader` (spinning) → `Check` (success) → `X` (error) currently swap via plain React conditional render, no cross-fade/scale. This is exactly the "success bounce / error shake" case the owner explicitly called out as acceptable state animation, and the component's own doc comment already narrates a saving→saved→error lifecycle. Recommend: a brief `scale-90→100 + opacity` pop-in on the icon change (`duration-fast ease-emphasized`), respecting the global reduced-motion reset.
2. **`CopyButton` icon swap** (`copy-button.tsx`) — `Copy`→`Check` on success, `Check`→`Copy` after `copiedLabel` reverts, again an instant swap. Same subtle pop-in recommendation; this is the highest-frequency "did my click register" moment in a dev-tool UI and currently gives zero feedback beyond the icon literally changing.
3. **`ProgressIndicator` (circular) value transition** (`progress-indicator.tsx`) — bring it in line with the linear `Progress` component: add `transition-[stroke-dasharray] duration-base ease-standard motion-reduce:transition-none` to the pie-fill `<circle>` so `value` changes sweep instead of jump. Directly fixes inconsistency (b6).
4. **`Checkbox`/`RadioGroup` indicator appear** (`checkbox.tsx:118-129`, and the radio dot at `radio-group.tsx:178`) — `Checkbox`'s `BaseCheckbox.Indicator` has no transition; the check/minus icon just appears. `RadioGroup`'s dot has `transition-transform data-unchecked:scale-0` (untokenized, §a4) — at least it scales, but Checkbox has nothing. A small `scale-50→100 + opacity` on `BaseCheckbox.Indicator` mount (checked/indeterminate) would match Radio's existing (if untokenized) scale-in and read as a coherent "form control family" language.
5. **`NotificationBell` badge appear/update** (`notification-bell.tsx`) — the unread badge (dot or count) mounts/unmounts with zero transition, and the count text changes with zero transition. A subtle scale-in on badge mount (`duration-fast ease-emphasized`) would read as "new activity" without being flashy; this is a genuinely common 2026 pattern (see §e, "state feedback" category).
6. **`Message`/`Bubble` entry animation** (`message.tsx`, `bubble.tsx`) — new chat messages append with no transition (relevant given `MessageScroller` already exists and auto-scrolls to new messages). A very subtle `opacity 0→1 + translate-y-1→0` on mount (`duration-fast ease-standard`) is the 2026-standard "message arrived" cue in chat UIs (see Vercel AI SDK / shadcn chat blocks) and would compose naturally with the scroller's own `data-[active]` transition.
7. **`Switch` thumb / `Slider` thumb tokenization** (not "missing" motion, but currently untokenized — see §c) — both already animate (`transition-transform`), just without `duration-*`/`ease-*` classes. Low-risk, high-consistency win: add `duration-fast ease-standard` (Switch) and keep `data-dragging:scale-110` on Slider but tokenize its base transition too.
8. **`Sonner` / `Toast`** — currently 100% third-party motion (§a7). Not urgent to change (Sonner's built-in animation is well-regarded, see Emil Kowalski research in §e), but worth an explicit doc note in `foundations/motion.mdx` that toast motion is an intentional token-system exception, so it doesn't read as an oversight in a future audit.
9. **`Sidebar` collapse easing** — already animates; just needs the `ease-linear`→`ease-standard` fix (§b3) rather than new motion.

Explicitly **not** recommending: hover animations on `Button`/`Toggle`/`Badge` (owner said no button hover animations — current system correctly has none, only `active:translate-y-px` press feedback on `Button`, which is a state animation, not a hover animation, and should stay), decorative background animations, or any looping/attention-grabbing motion.

---

## (e) 2026 best-practice research

**Vercel Geist (`vercel.com/design.md`, [Web Interface Guidelines](https://vercel.com/design/guidelines), [Motion Guidelines](https://motionguide.vercel.app/))** — "Use motion only when it clarifies a change, never for decoration." Duration bands: state changes ~150ms, popovers/tooltips ~200ms, overlays/modals ~300ms, with `0ms` often correct for instant interactions. Single easing curve `cubic-bezier(0.175, 0.885, 0.32, 1.1)` (a slight overshoot/"physical" curve) for anything that reveals or moves an element. Prioritize compositor-safe properties (`transform`, `opacity`); explicitly avoid `transition: all` and layout-triggering properties (`width`/`height`/`top`/`left`) where `transform`/`opacity` can substitute. Notably, Geist's band scheme *differentiates duration by overlay weight* (tooltip/popover faster than modal) — this system currently uses a flat `duration-fast` (150ms) for every overlay category, from tooltip up to full-screen dialog, which is defensible for a "compact, dense dev-tool" aesthetic but is a deliberate simplification worth naming explicitly rather than leaving implicit.

**shadcn/ui + tw-animate-css (2026 conventions)** — `tw-animate-css` (already a dependency here, `packages/tailwind-preset/package.json`) is the successor to `tailwindcss-animate`, ships the `animate-in`/`animate-out` + `fade-in`/`zoom-in`/`slide-in-from-*` vocabulary plus `data-[state=open]`/`data-[state=closed]` variant helpers. This system deliberately does **not** use that vocabulary — it hand-writes `transition-*` + Base UI's `data-starting-style`/`data-ending-style` instead, which is the more modern (2024+) idiom for Base UI specifically (Radix-era shadcn used `data-state` + `animate-in`/`animate-out` keyframes because Radix had no native transition hooks; Base UI's starting/ending-style attributes make plain CSS transitions sufficient without keyframes at all). This is the right call for a Base UI codebase and matches Base UI's own docs.

**Base UI transition patterns ([base-ui.com/react/handbook/animation](https://base-ui.com/react/handbook/animation))** — confirms `[data-starting-style]`/`[data-ending-style]` is the sanctioned pattern for CSS-transition-based enter/exit on Base UI primitives, which is exactly what every overlay component here does. The native CSS `@starting-style` at-rule (Baseline "Newly available" as of 2024, Chrome 117+/Safari 17.5+/Firefox 129+) is the platform-level equivalent Base UI's data-attributes are polyfilling in JS — not yet worth migrating to raw `@starting-style` since Base UI's data-attribute approach already works cross-browser today and ties state to the component's actual open/close lifecycle rather than DOM presence.

**Emil Kowalski (Sonner/Vaul author, Linear design engineering, [emilkowal.ski](https://emilkowal.ski/), [animations.dev](https://emilkowal.ski/ui))** — core discipline is "know when NOT to animate" and a 4-step decision framework (should it animate? what's the purpose? what easing fits the change? what duration?). Recommends CSS transitions over keyframe `@keyframes` specifically for **interruptibility** (a transition can reverse mid-flight if state flips back; a keyframe animation restarts) — this system already does this correctly (every overlay is a plain `transition-*`, not `@keyframes`). Sonner's own toast motion is deliberately *slightly slower* than typical UI chrome and uses `ease` rather than `ease-out`, because a toast is an interruption that should feel considered, not snappy — reinforces that leaving `Toaster` on its own third-party motion (§a7) is a reasonable, not lazy, choice.

**CSS-native capabilities now standard in 2026** ([Chrome DevRel](https://developer.chrome.com/docs/css-ui/css-linear-easing-function), [Josh Comeau](https://www.joshwcomeau.com/animation/linear-timing-function/)) — the `linear()` easing function (Chrome/Edge 113+, Firefox 112+, ~87% global support by 2026, still gapped on older Safari) lets you author real spring/bounce curves in pure CSS `transition-timing-function`, no JS needed. This is directly relevant to items #1/#2/#5 above ("success bounce") — a `cubic-bezier` can't overshoot, but a short `linear()` spring can, and would let the "success bounce" the owner explicitly asked for be implemented as a 4th token-scale easing (`--motion-ease-spring` or similar) rather than requiring the `motion` JS library. Scroll-driven animations (`animation-timeline: scroll()`) are already in use in this codebase for `scroll-fade` (`packages/tokens/src/utilities.css`) — good, no gap there. The View Transitions API is oriented at page/route-level transitions (Next.js App Router `<ViewTransition>`), out of scope for component-level micro-interactions.

**`motion` (JS library) vs. CSS — 2026 consensus** ([motion.dev magazine](https://motion.dev/magazine/do-you-still-need-framer-motion), [Josh Comeau](https://www.joshwcomeau.com/animation/css-vs-javascript/)) — use CSS transitions for anything expressible as "one element, one or two properties, no coordination with siblings" (covers ~100% of this component library's needs: hover/focus color, overlay enter/exit, height disclosure, icon rotate). Reach for `motion`/WAAPI only for: layout animations where siblings must reflow together (`layout` prop / FLIP), gesture-driven drag (already covered by the sanctioned `@shadcn/react/message-scroller` exception + Base UI's own internals for `Slider`), or genuinely complex orchestrated sequences. Nothing in the 68 components needs JS-driven motion by this test — the current "CSS-first, `motion` only for animated icons" framing in `foundations/motion.mdx` is correctly scoped; the only correction needed is dropping the word "optional" for `motion` as a dependency (§a6).

Sources:
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
- [Vercel Motion Guidelines](https://motionguide.vercel.app/)
- [vercel.com/design.md](https://vercel.com/design.md)
- [Base UI — Animation handbook](https://base-ui.com/react/handbook/animation)
- [Base UI — Styling handbook](https://base-ui.com/react/handbook/styling)
- [MDN — @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
- [Josh W. Comeau — The Big Gotcha With @starting-style](https://www.joshwcomeau.com/css/starting-style/)
- [Josh W. Comeau — Springs and Bounces in Native CSS](https://www.joshwcomeau.com/animation/linear-timing-function/)
- [Josh W. Comeau — CSS vs. JavaScript](https://www.joshwcomeau.com/animation/css-vs-javascript/)
- [Josh W. Comeau — Scroll-Driven Animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/)
- [Chrome for Developers — linear() easing function](https://developer.chrome.com/docs/css-ui/css-linear-easing-function)
- [Emil Kowalski](https://emilkowal.ski/)
- [Motion (motion.dev) — Do you still need Framer Motion?](https://motion.dev/magazine/do-you-still-need-framer-motion)

---

## (f) Proposed canonical motion vocabulary

The existing 3 durations + 3 easings are close to right and shouldn't be thrown out — the fix is mostly *applying them consistently* (§b, §c), not redesigning the scale. One addition is worth considering for the "state feedback" category the owner explicitly asked for.

### Durations (keep the existing 3; no change)

| Token | Value | Use for |
|---|---|---|
| `--duration-fast` / `duration-fast` | 150ms | Micro-interactions: hover/focus color, icon rotate, small popups (tooltip, popover, dropdown, context-menu, hover-card, select) |
| `--duration-base` / `duration-base` | 200ms | Medium moves: linear progress fill, sidebar width collapse, height disclosure where content is substantial |
| `--duration-slow` / `duration-slow` | 300ms | Reserved for heavier surfaces — currently unused by any overlay (dialog/alert-dialog/sheet all use `duration-fast`); consider promoting full-screen `Dialog`/`Sheet` to `duration-slow` per the Geist "overlays/modals ~300ms" band, since a full modal is a heavier visual event than a 4-item dropdown and the current flat 150ms-everywhere doesn't distinguish them. This is a judgment call for the owner, not a defect — flagging as an option, not a mandate, since "compact & sleek, avoid long pages" could just as easily argue for keeping everything fast. |

### Easings (keep the existing 3; consider one addition)

| Token | Curve | Use for |
|---|---|---|
| `--motion-ease-standard` / `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default for all enter + most position/size transitions (overlays, disclosure height, tabs indicator, hover chrome) |
| `--motion-ease-emphasized` / `ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | Currently only used in `message-scroller.tsx` for the "become active" direction. Good candidate for the new success/appear micro-interactions in §d (icon pop-ins, badge appear) since it already reads as "arrival." |
| `--motion-ease-exit` / `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exit/dismiss transitions — currently only `message-scroller.tsx`. Should be the default for anything actively leaving (not just fading via `data-ending-style`, which most overlays already handle via the same duration+ease as enter — worth deciding if exit should be visually distinct via `ease-exit`, matching how `message-scroller` already treats it). |
| *(optional new)* `--motion-ease-spring` | A short `linear()` spring, e.g. `linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1)` (tune by eye) | Purpose-built for the "success bounce" the owner explicitly asked for (§d items 1, 2, 5) — lets a subtle overshoot happen in pure CSS, no `motion` dependency. Keep it to a *very* small overshoot (dense dev-tool aesthetic, not playful) and gate it behind the global reduced-motion reset like everything else. |

### Per-category animation spec

| Category | Properties | Duration | Easing | Pattern |
|---|---|---|---|---|
| **Overlays** (dialog, alert-dialog, sheet, popover, hover-card) | `opacity` (backdrop); `transform,scale,opacity` (panel/content) | `duration-fast` (menus/popovers/tooltip/select) or `duration-slow` if promoting modals per §f note | `ease-standard` on **every** overlay — close the b2 gap by adding it to `dropdown-menu`, `context-menu`, `tooltip`, `select` | `data-[starting-style]`/`data-[ending-style]` scale-95→100 + opacity 0→1, origin from Base UI's `--transform-origin` |
| **Menus** (dropdown-menu, context-menu, select, command) | Same as overlays, plus `height` for `command`'s list resize | `duration-fast` | `ease-standard` | Same starting/ending-style pattern; `select.tsx` needs `scale` added to its transition-property list (b4) |
| **Toasts** (sonner) | Owned by the `sonner` library | N/A | N/A | Intentional exception — document it, don't fight it (§e, Kowalski) |
| **Accordions/disclosure** (accordion, collapsible) | `height` via CSS var | `duration-fast` | `ease-standard` | Already the reference pattern (b7) — no change needed |
| **State feedback** (success/error/warning icon swaps, badge appear) | `opacity`, `scale` | `duration-fast` | `ease-emphasized` (appear) / proposed `ease-spring` (success bounce specifically) | New pattern to add per §d — small `scale-90→100 + opacity 0→1` on mount, respecting the global RM reset |
| **Indeterminate loaders** (spinner, skeleton pulse) | `transform: rotate` / `opacity` | Platform default (`animate-spin`/`animate-pulse`, not on the token scale) | N/A | Keep as-is; explicitly document as a token-scale exception in `foundations/motion.mdx` |
| **Hover/focus micro-interactions** (buttons, inputs, table rows, tabs, badges — the §a4 group) | `color`, `background-color`, `border-color` | `duration-fast` | `ease-standard` | Currently the biggest gap: ~37 sites need the explicit `duration-fast ease-standard` pair added per the pattern `foundations/motion.mdx` already documents |

All of the above already inherits the global `prefers-reduced-motion: reduce` collapse in `packages/tokens/src/base.css` (`animation-duration`/`transition-duration` → `0.01ms !important`), so no per-component `motion-reduce:` variant is strictly required for correctness — the handful that do add `motion-reduce:animate-none`/`motion-reduce:transition-none` (spinner-family, `image.tsx`, `progress.tsx`, `slider.tsx`) are defensive belt-and-suspenders, not filling a real gap. New motion added per §d should follow that same optional-defensive pattern for consistency, not because the global reset is insufficient.
