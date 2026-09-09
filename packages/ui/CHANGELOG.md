# @vegastack/ui

## 0.7.0

### Minor Changes

- [#57](https://github.com/vegastack/vegastack-design/pull/57) [`f1d7d2f`](https://github.com/vegastack/vegastack-design/commit/f1d7d2fbc5f9c52aa13ff9ddfc869cb71c6ae163) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **Animated icons are one factory plus 439 data modules.** Every mirrored `lucide-animated`
  icon used to carry its own copy of the controller — the animation controls, the reduced-motion gate,
  five pointer/focus handlers, the imperative handle and a block-level host — so a change to any of
  that meant regenerating 439 files and trusting that all 439 agreed. The controller now lives once in
  `createAnimatedIcon`, exported from the new `@vegastack/design/create-animated-icon` subpath, and
  each icon is a `createAnimatedIcon({ … })` call describing only its geometry, its Motion variants,
  and (for 49 icons) its non-default start/stop steps. `motion` becomes an OPTIONAL peer dependency —
  only an animated icon pulls it in, so `Icon`/`BrandIcon` consumers are unaffected. The corpus went
  from 79,078 lines to 12,951 (-84%) and from 2.06 MiB to 0.57 MiB of source; the served registry fell
  from 4.48 MiB to 2.92 MiB. `tooling/mirror-animated-icons.mjs` emits the data modules and fails
  closed on any upstream archetype it cannot model; `tooling/verify-animated-icons.mjs` asserts the
  controller contract once against the factory, holds every module to a schema whose central clause is
  that a data module contains no controller at all, pins each generated module by SHA-256 in
  `packages/ui/animated-icon-sources.json` so a hand-edited path or timing value is rejected outright,
  and carries a `--self-test` that proves fifteen distinct regressions are rejected.
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Seven animated icons drop a deprecated handle alias; an eighth renames its handle
  type.** `BotMessageSquareHandle`, `ConciergeBellHandle`, `KeyIconHandle` (on both `key-circle` and
  `key-square`), `RefreshCCWIconWIcon` (on `refresh-cw`), `ActivityIconHandle` (on `square-activity`)
  and `ZapHandle` were `@deprecated` aliases left behind by upstream naming quirks; each of those icons
  still exports its `<Name>IconHandle` and only the alias is gone. `chevron-first` is the different
  case and is a **rename, not an alias removal**: upstream had copy-pasted a `displayName` from another
  icon, so the primary interface was called `ChevronsDownUpIconHandle` and `ChevronFirstIconHandle` was
  the `@deprecated` alias of it. The exported component symbol is authoritative, so the name that
  survives is the one that matches it — **`ChevronsDownUpIconHandle` → `ChevronFirstIconHandle`**.
  Consumers of the old name must rename; no compatibility alias is kept.
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Animated icons** — the host element is now an `inline-flex` `<span>` rather than a
  block-level `<div>`, so an icon placed in a line of text no longer breaks the line box, and
  `AnimatedIconComponent` types its host as `HTMLSpanElement`. Reduced motion is now a live
  subscription to `(prefers-reduced-motion: reduce)`, so turning the preference on settles every
  mounted icon immediately instead of only affecting icons mounted afterwards. Motion's own hooks
  cannot do this: in 12.42.2 `useReducedMotion()` is `useState(prefersReducedMotion.current)` — a
  one-shot read of a module singleton captured at first import, with a standing `TODO` about not
  updating — and `useReducedMotionConfig()` layers `<MotionConfig>` on that same one-shot value. Worse,
  the OS preference was never consulted at all unless the application happened to mount a
  `<MotionConfig>`: `useReducedMotionConfig()` returns `false` outright when the context says
  `reducedMotion: "never"`, and `"never"` is precisely Motion's **default** context value. The factory
  now treats the preference as the base value and lets `<MotionConfig reducedMotion="always">` add
  reduction on top; the override is one-way, because an explicit `reducedMotion="never"` is
  byte-identical to no provider at all and honouring it would switch reduced motion off for everyone
  who configured nothing. Public icon names, the `size` prop and the `startAnimation`/`stopAnimation`
  handle are unchanged.
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Badge speaks the same variant vocabulary as Button.** `variant` is now
  `solid · soft · outline · minimal`: `subtle` is renamed **`soft`**, with no alias — a stale
  `variant="subtle"` is a type error. The three sizes become three REAL heights, `sm` **16px** · `md`
  **20px** · `lg` **24px**; `sm` used to be `md` with 2px less horizontal padding, which is a padding
  value, not a size. `minimal` becomes ink only — no fill, no border, no horizontal padding — so it
  sits flush in a table cell instead of faking a pill, and it now carries a **leading dot by
  default**, because a badge with no container has nothing but colour left to signal status with (WCAG
  1.4.1). Pass `dot={false}` to opt out, or the new `icon` prop to take the dot's place.
  [docs](https://design.vegastack.com/docs/components/badge)

- [#62](https://github.com/vegastack/vegastack-design/pull/62) [`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **One key chip, and the display leaves move onto role tokens.** `TooltipKbd` renders
  `Kbd size="xs"` instead of restyling a second `<kbd>`, so a shortcut hint reads identically wherever
  it appears — and inherits the OS rewrite. `Kbd`'s three sizes now use one type role
  (`text-code-sm`); `md` reached the same 12px through `text-sm`, the same pixel size named twice, and
  the meaningless `pointer-events-none` on a `<kbd>` is gone. `StatusIcon` sizes become the
  `--icon-inline` / `default` / `action` / `feature` role tokens (14 / 16 / 20 / 24px), the ladder
  Spinner already uses, instead of raw `size-N` steps spelling the same four values. A `Skeleton` line
  moves to the text radius (`rounded-sm`): 8px on a 16px bar reads as a pill, not as text.
  [docs](https://design.vegastack.com/docs/components/kbd)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Kbd` defaults to `os="other"`.** It reads no `navigator` — that is what keeps it
  server-safe — so the platform is the caller's to resolve: run `usePlatform()` and pass the answer
  down. The old default shipped mac glyphs to a Windows majority. `TooltipKbd` takes the same `os`
  prop.
  [docs](https://design.vegastack.com/docs/components/kbd)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Reduced motion is stated once, globally.** All seventeen `motion-reduce:` copies across
  eleven components were deleted — the registry now carries zero. The `base.css` reset owns the rule
  with the one sanctioned `!important`, so a per-component restatement adds nothing and is a second
  copy that can drift. One copy looked load-bearing and exposed a hole in the reset instead: it zeroed
  animation _duration_ but not _delay_, so `StaggeredTextReveal` still played its words out one by one
  over the full stagger window.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **An indeterminate `Progress` no longer reads as 100% complete.** Base UI writes no inline
  width when `value` is `null`, so an indicator styled only for the determinate case inherited the
  track's full width — an upload in progress looked finished. It is now a 35% segment sweeping the
  track on the one sanctioned looping utility, `motion-indeterminate`, whose keyframes rest on the same
  frame at both ends so reduced motion leaves a static segment rather than a full bar, and
  `aria-valuenow` is omitted.
  [docs](https://design.vegastack.com/docs/components/progress)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **`RelativeTime` no longer renders an empty first frame.** A relative label needs
  `Date.now()`, which the server cannot reproduce, so it used to render `""` until hydration — a
  visible pop and a layout shift on every row of a list. Server and hydration render now agree on the
  **absolute** date (`"Mar 15, 2025"`), derived from the target instant alone, and the swap to the
  relative label is a text change inside a box that is already the right size.
  [docs](https://design.vegastack.com/docs/components/relative-time)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Twelve components are server-safe again.** Avatar, Button, Collapsible, Field, Progress,
  Resizable, ScrollArea, Separator, Slider, Switch, Tabs and Toggle carried `"use client"` without
  touching a hook or a handler. A client module poisons every RSC importer downstream —
  `buttonVariants` could not be read from a server component. 84 client leaves in the registry became 72.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`text-xs` is mono-only.** Seven sites across Attachment, AudioPlayer, Chart and
  ProgressIndicator were reaching 11px in Geist Sans for density; sans copy now floors at `text-sm`
  (12px).
  [docs](https://design.vegastack.com/docs/foundations/typography)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`TruncatedText` gains `focusable`,** with a `TruncationFocusProvider` that sets it for a
  whole region. Clipped text becomes a Tooltip trigger and takes a tab stop — in a 50-row table that is
  50 extra tab stops layered on a grid's own roving focus, and CSS truncation never hides anything from
  a screen reader, so the tooltip only ever served sighted keyboard users. `IconText`, `TableCellText`
  and `RelativeTime` take the same prop.
  [docs](https://design.vegastack.com/docs/components/truncated-text)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Button**, **Select**, **Sidebar**, **Toggle**, **Tabs**, **Table**, **DataGrid**,
  **DataList**, **Board**, **Item**, **Pagination**, **NavigationMenu**, **Combobox**, **DatePicker**,
  **Dialog**, **Sheet**, **Popover**, **HoverCard**, **Segmented**, **TagGroup**, **Bubble**, **Card**,
  **AppShell**, **EmojiPicker**, **FieldInline**, **MessageScroller**, **NumberField**,
  **OnboardingChecklist**, **ShortcutOverlay**, **Sonner**, **Switch**, **ToolCallChip** and the
  **dashboard-01** block — every hover now climbs one rung and **every control has a pressed step**.
  Previously only the solid primary Button darkened on `:active`; a state probe found 268 elements
  where pressing changed nothing. Select's trigger hovered only in dark mode; it now hovers in both.
  The current sidebar row rests on `surface-3` so hovering it still moves. ComparisonMatrix and
  PricingSection stop using `info` (blue) for the promoted column and the highlighted plan — `info` is
  links and informational UI only; promotion is a neutral ladder rung.
  [docs](https://design.vegastack.com/docs/components/button) ·
  [`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Button` has no icon size tier.** `size="icon"` / `icon-xs` / `icon-sm` / `icon-lg`
  are gone; every icon-only action is `IconButton`, which makes the missing `aria-label` a type error
  and now owns `shape="square" | "round"`.
  [docs](https://design.vegastack.com/docs/components/icon-button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **A loading Button no longer changes width.** The spinner is taken out of flow and stacked
  over the label, which keeps its box behind `opacity-0` — not `visibility: hidden`, which would drop
  the label out of the accessibility tree and leave a pending button with no name; previously a "Save
  changes" button jumped about 20px the moment a request started.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Button `glass`, and the seven colour-in-the-name variants.** The frosted `glass` variant
  had no product consumer; media chrome uses the theme-invariant `--media-*` tokens instead. `success`,
  `warning`, `info`, `destructive-outline`, `success-outline`, `warning-outline` and `info-outline`
  baked a colour into a name and are replaced by the `tone` axis.
  [docs](https://design.vegastack.com/docs/components/button)

- [#60](https://github.com/vegastack/vegastack-design/pull/60) [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Button is two axes, not fifteen variants.** `variant` is now the SHAPE — `solid` ·
  `soft` · `outline` · `ghost` · `link` · `cta` — and the new `tone` prop is the HUE — `neutral`
  (default) · `destructive` · `success` · `warning` · `info`. Every recipe is written once as ten class
  strings and reads the hue from `--btn-*` custom properties, so all thirty cells share one
  hover/pressed grammar. Rename map: `default` → `solid`, `secondary` → `soft`, `destructive` → `soft`

  - `tone="destructive"`, `success`/`warning`/`info` → `soft` + the matching tone, `{family}-outline` →
    `outline` + the matching tone; `outline`, `ghost`, `link` and `cta` keep their names. A destructive
    action is **never** a solid red button — `tone="destructive"` with `variant="solid"` does not
    type-check.
    [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`disabled` is `aria-disabled`, not the native attribute.** Button, IconButton and
  SplitButton keep their pointer events and stay focusable when disabled, so a Tooltip can explain why
  the action is unavailable. Base UI still suppresses activation. Code asserting `element.disabled`
  should read `aria-disabled` instead.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **IconButton everywhere.** The dismiss, pager and toggle controls that were hand-rolled
  `<button>` elements in Alert, AnnouncementBanner, Dialog, Sheet, Pagination, OnboardingChecklist and
  FilterBar are now `IconButton`, and CopyButton, MessageScrollerButton, ColorPicker, EmojiPicker and
  SplitButton's chevron half compose it too — so they all inherit the matrix, the focus ring, the
  loading contract and the required accessible name. New `iconButtonGeometry(size, shape)` styles an
  icon-only **link**: navigation stays a real `<a>` (PageHeader's back affordance) instead of acquiring
  `role="button"`.
  [docs](https://design.vegastack.com/docs/components/icon-button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **One size vocabulary: `xs · sm · md · lg`.** The tier every component called `default`
  is now `md`, matching the `--size-*` tokens it was always built from. This is a rename across Button,
  IconButton, SplitButton, Badge, Input, Textarea, Select, Combobox, Avatar, Card, Item, Empty, Kbd,
  Dialog, Switch, Checkbox, RadioGroup, Toggle, ToggleGroup, Segmented, Stat, Spinner, StatusIcon,
  Progress, ProgressIndicator, OTPInput, NumberField, Attachment, ChipInput, Pagination and Sidebar.
  There is no alias — `size="default"` is a type error.
  [docs](https://design.vegastack.com/docs/components/button)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Helper text moved below the control, and `Field` owns validation feedback.** A field's
  description now renders **under** the control with the error under that — above the control it
  pushed the input away from its own label, and a wrapped description put two lines of prose between
  the two things the eye pairs. The invalid **shake** moved with it: `Input`, `Checkbox`,
  `RadioGroupItem`, `OTPInput`, `NumberField` and `ChipInput` no longer take `shakeSignal` and no
  longer shake on their own — `Field` does, for every control it wraps, so `Textarea` gains the
  behaviour it never had. A bare `<Input aria-invalid>` outside a `Field` still tints its border; wrap
  it in a `Field` for the motion, or move `shakeSignal` onto the `Field`.
  [docs](https://design.vegastack.com/docs/components/field)

  **Inline validation announces as `role="status"`, not `role="alert"`.** `FieldError` and
  `FieldInline`'s error are polite live regions: the person just typed or submitted and is looking at
  the field, and `alert` interrupts whatever the screen reader was saying. `alert` stays reserved for
  something that arrives without being asked for. Tests asserting `getByRole("alert")` on a field
  error should read `getByRole("status")`.
  [docs](https://design.vegastack.com/docs/components/field)

  **Form controls keep their pointer events when disabled.** `disabled:pointer-events-none` is gone
  from Input, Textarea, NumberField, OTPInput, Select, Combobox, ChipInput, Checkbox and RadioGroup,
  matching the Button contract — an unavailable control must stay hoverable so a Tooltip can say why.
  `cursor-not-allowed` and the dim stay; Base UI suppresses activation either way.
  [docs](https://design.vegastack.com/docs/components/input)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **One field chrome.** The border/hover/focus/invalid/disabled grammar was copy-pasted in Input,
  Textarea and NumberField, restated a fourth time as slot overrides in Field, and again in Combobox
  and ChipInput. It is now `fieldControl` / `fieldControlGroup` in `@vegastack/design`, which Input,
  Textarea, NumberField, OTPInput, the Select trigger, the Combobox input and its input-group, and
  ChipInput all spread — so retuning the field is one edit.
  [docs](https://design.vegastack.com/docs/components/input)

  **Checkbox, RadioGroup, Switch and the Select trigger hover in both themes, checked included.** A
  state probe found no hover treatment at all on 31 checkbox/radio/switch fixtures, and a ticked
  control read dead under the cursor while an unticked one moved. They now step through the same
  neutral border rung every field wears, and a filled control steps through the solid's own darker
  rungs.
  [docs](https://design.vegastack.com/docs/components/checkbox)

  **NumberField's ± steppers no longer run their hover fill into the field border.** The wash was
  full-bleed, so it met the field's hairline on three sides with a square inner corner against the
  rounded outer one. It is now an inset chip with its own radius; the button keeps the full pointer
  target.
  [docs](https://design.vegastack.com/docs/components/number-field)

  **`Label` is `inline-flex` by default**, so it composes into a sentence instead of breaking the line
  around itself; `layout="block"` is the explicit opt-in for the stacked form row.
  [docs](https://design.vegastack.com/docs/components/label)

  **PasswordInput's eye toggle is an `IconButton`** in the ghost recipe, and the eye swap has no
  motion. It replayed `motion-pop-in` behind a guard whose only job was to stop the animation firing
  on first paint — a tell that the animation did not belong there.
  [docs](https://design.vegastack.com/docs/components/password-input)

  **FieldInline and EditableCell run on `useInlineEdit`**, and FieldInline's rest hover is the shared
  interactive-surface recipe, so it is visible on a card rather than only on the page ground.
  [docs](https://design.vegastack.com/docs/components/field-inline)

  **AutoSaveInput** drops a `cn(className)` no-op, sizes its status slot with `--icon-default` instead
  of a raw `size-4`, and marks its spinner `decorative`.
  [docs](https://design.vegastack.com/docs/components/auto-save-input)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **CheckboxGroup** — shared state for a set of checkboxes, with first-class "select all". Base UI
  ships the parent/child arithmetic (`allValues` plus a `parent` child gives the mixed state and the
  whole-set toggle) and the system had no wrapper for it, so DataGrid, DataList and every permissions
  block computed it by hand. There is no `CheckboxGroupItem` — a child is a plain `Checkbox` with a
  `value`.
  [docs](https://design.vegastack.com/docs/components/checkbox-group)

  **`useInlineEdit`** — the click-to-edit machine: draft, commit, cancel, focus restoration and the
  double-commit guard (Enter closes the edit, which unmounts the input, which fires blur, which would
  commit a second time). `FieldInline` and `EditableCell` had each written it, and the copies had
  already drifted — only one re-armed the guard when a controlled host flipped `editing` on, and only
  one restored focus after a keyboard commit. It owns no DOM and no persistence, so it also serves a
  cell editor that is a `Select` popup with no text input at all.
  [docs](https://design.vegastack.com/docs/guides/components)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`selection:*` in form controls** — Input, Textarea, OTPInput, NumberField and the Combobox input
  repainted selected text near-black on near-white. Native selection is what users expect and it
  respects the OS and accessibility settings.
  [docs](https://design.vegastack.com/docs/components/input)

  **`shakeSignal` on Input, Checkbox, RadioGroupItem, OTPInput, NumberField and ChipInput** — the prop
  lives on `Field`, which owns the shake.
  [docs](https://design.vegastack.com/docs/components/field)

  **`Spinner label=""` as the way to say "decorative"** — `decorative` is now the sanctioned spelling.
  `label=""` still means the same thing; it just says it by passing a value that reads as a mistake at
  the call site.
  [docs](https://design.vegastack.com/docs/components/spinner)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`AttachmentTrigger` shows a real focus indicator.** It dropped `outline-none` and a border
  tint as its only keyboard cue; the standard outline is drawn inset so the card's radius does not
  clip it. A border tint is the text-entry treatment, not a button's.
  [docs](https://design.vegastack.com/docs/components/attachment)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **AudioPlayer gains mute and a volume rail in both layouts.** Audio previously had no
  visible volume control at all and mute was reachable only from the M key. The rail is a vertical
  `Slider` opened from the mute button, rendered inline rather than portaled — the video frame is the
  fullscreen element, so a portal to `<body>` would put the rail outside it. The seek thumb is now
  hidden at rest only where a pointer can hover; on touch it stays visible, because otherwise there is
  no scrub affordance at all.
  [docs](https://design.vegastack.com/docs/components/audio-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`MediaPlayerControls` moved out of `audio-player` into its own registry item.** It was
  exported from `audio-player` even though the video player was its main consumer. Run
  `shadcn add @vegastack/media-player-controls` and import from `@/components/ui/media-player-controls`;
  `video-player` declares it as a registry dependency, so a fresh `shadcn add @vegastack/video-player`
  pulls it in automatically.
  [docs](https://design.vegastack.com/docs/components/media-player-controls)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Slider's internals are no longer restyled from outside.** Anything reaching into
  `[&_[data-slot=slider-track]]` / `-indicator` / `-thumb` to build a media rail should pass
  `variant="media"` or `variant="overlay"` with `thumb="hover"` instead. The internal slots keep their
  `data-slot` names, but their rest appearance is now the `variant`'s to decide.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The video player's tooltips and settings menu are visible in fullscreen.** They portaled
  to `<body>`, which the browser does not paint inside a fullscreen element — the playback-speed and
  quality menus were unusable in fullscreen. `MediaPlayerControls` takes a `portalContainer` and
  `VideoPlayer` passes its frame; the volume panel already avoided this by rendering inline.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The video overlay's seek rail rests at its own thickness and thickens on engagement
  again.** Its `h-1` tied on specificity with the shared track's `h-1.5`, so Tailwind's sort order
  picked the default 6px rail and the hover/focus thickening had nothing to thicken from.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **A viewer's chosen playback speed no longer resets while the media plays.** The
  media-element effect listed the consumer's `onTimeChange` among its dependencies; `timeupdate` fires
  ~4×/s and re-renders the controls, so a player given an inline callback re-applied
  `defaultPlaybackRate` several times a second and 2× snapped back to 1×.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`Image` lazy-loads and decodes off-thread by default.** `loading="lazy" decoding="async"`
  are now the defaults, matching what MarkdownView already did for its images. Pass `loading="eager"`
  for an above-the-fold hero, where deferring the fetch delays LCP rather than saving it.
  [docs](https://design.vegastack.com/docs/components/image)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Media chrome is theme-invariant.** The video overlay was built on `primary`, which flips
  with the theme — in dark it rendered a near-white scrim behind near-black icons. Scrim, pills and
  ink now come from `--media-scrim`, `--media-scrim-strong` and `--media-foreground`, which are the
  same values in both themes, and a compiled-CSS test pins scrim lightness under 0.3 with overlay ink
  over 0.85. Overlay controls are `IconButton variant="ghost" shape="round"` on the scrim.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Media controls keep the system's focus outline.** The `ring-2 ring-ring/50` glow that
  media invented for itself, and the forced-colours carve-out beside it, are gone; the standard 2px
  `:focus-visible` outline applies, inset with `-outline-offset-2` so an `overflow-hidden` frame
  cannot clip it. `tabIndex={0}` now appears only on genuinely scrollable regions.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`media-player-controls`** — the shared media transport, lifted out of `audio-player` (which
  owned the video player's controls too). It carries the control surface and `useMediaShortcuts`: ONE
  keyboard map for both players (Space/K play, J/L and arrows skip, M mute, F fullscreen), scoped
  `surface` vs `controls` so a shortcut can never steal a key from the focused control. The
  `assignRef` / `getMediaDuration` / `clampTime` helpers live here as well, instead of in a copy per
  player. `audio-player` drops from 1,431 lines to 305.
  [docs](https://design.vegastack.com/docs/components/media-player-controls)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`Slider` grows the props the players were faking with descendant selectors.** `variant`
  (`default · media · overlay · bare`), `orientation` (vertical is now supported and is how the volume
  rail is built), `thumb` (`always · hover · none`), `marks` and `showValue`. Every
  `[&_[data-slot=slider-*]]` override in the players is deleted.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`VideoPlayer` gains `controlsVisible`.** `true` pins the overlay open and `false` keeps it
  closed, for kiosk players — and for static fixtures, since the auto-reveal never fires without a
  pointer and the docs page therefore never showed the video controls.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`AlertDialogContent intent`** — it wrote a `data-intent` hint and nothing else, leaving
  two props named for one concept with one of them inert. `AlertDialogAction intent` is the single
  owner of a confirmation's tone.
  [docs](https://design.vegastack.com/docs/components/alert-dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`floating-surface`** — the shared floating-overlay module every anchored overlay now
  composes: one `Portal → Positioner → Popup (→ Viewport)` composer, one theme-scope hand-off across
  the portal boundary, one arrow, and four painted surfaces (`panel` at the 16px tier, `menu` at list
  density, `tooltip` as the inverted ink chip, `navigation` for the morphing mega-menu). It also owns
  `menuItemVariants` — the one list-item recipe behind menu items, select options, combobox options and
  command rows — and `PanelSearchFrame`, the in-panel search row.
  [docs](https://design.vegastack.com/docs/components/floating-surface)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Menu items take `tone`, not `variant`.** `DropdownMenuItem`, `ContextMenuItem` and
  their checkbox/radio siblings use `tone="destructive"`, matching Button's tone axis. The state
  attribute moves with the prop: items expose `data-tone`, not `data-variant`.
  [docs](https://design.vegastack.com/docs/components/dropdown-menu)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Hand-written `100dvh` overlay height calcs** — replaced by
  `--layout-overlay-max-height` and Base UI's `--available-height`.
  [docs](https://design.vegastack.com/docs/components/dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Popover** and **Select** document their modality. Both are modal by default so the page
  cannot scroll out from under an open panel; pass `modal={false}` for a lightweight one. Combobox
  stays non-modal and says why in its source.
  [docs](https://design.vegastack.com/docs/components/select)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay motion follows one measured scale.** Every floating surface enters and leaves at
  `duration-fast` (150ms); NavigationMenu takes `duration-base` (200ms) because it resizes between
  items rather than simply appearing; the modal family — Dialog, AlertDialog, Sheet — is
  `duration-base`. Timings were measured against Vercel and Linear rather than chosen.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay padding has two tiers, not per-surface literals.** 24px (`p-6`) for Dialog,
  AlertDialog and Sheet; 16px (`p-4`) for Popover and HoverCard; menus keep list density. Panel widths
  come from `--panel-width-*`, and a viewport-capped popup uses Base UI's `--available-height` instead
  of a hand-written `100dvh` calc. `DialogContent` and Command size through `size`.
  [docs](https://design.vegastack.com/docs/components/dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Popover**, **HoverCard**, **Tooltip**, **DropdownMenu**, **ContextMenu**, **Select**,
  **Combobox**, **NavigationMenu** — eight lookalike overlays became one module. Each now composes
  `floating-surface` instead of restating its own portal, positioner, popup surface, arrow and
  theme-scope plumbing. `ContextMenu` is bound to the same item parts as `DropdownMenu` through
  `createMenuParts` (Base UI's `ContextMenu` namespace re-exports `Menu`'s parts verbatim), so the two
  menus can no longer drift.
  [docs](https://design.vegastack.com/docs/components/floating-surface)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **In-panel search fields are a `searchbox`.** Every panel-search row renders
  `type="search"`, so `ShortcutOverlay`'s filter (and any other field inside the shared row) exposes the
  `searchbox` role rather than a generic textbox. Selecting one by role in a test or script must change
  with it.
  [docs](https://design.vegastack.com/docs/components/shortcut-overlay)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Command**, **Combobox**, **EmojiPicker**, **ShortcutOverlay** — the in-panel search row
  is one recipe. A bordered `Input` inside a bordered popup drew two borders; `PanelSearchFrame` is a
  sticky, full-bleed header row with a leading glyph, no box of its own and a hairline below.
  [docs](https://design.vegastack.com/docs/components/command)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Sheet` runs on Base UI's `Drawer`.** It gains swipe-to-dismiss, snap points (`snapPoints` /
  `snapPoint` / `onSnapPointChange` pass straight through) and `SheetVirtualKeyboardProvider` for
  bottom sheets containing fields. `side` moves from `SheetContent` to the `Sheet` root, because it
  selects the dismiss gesture as well as the pinned edge, and a `side` on the content could disagree
  with the gesture. `SheetContent` now sizes through `size` — `sm · md · lg · full` from the shared
  `--panel-width-*` vocabulary replaces `className` width overrides, and one tier means a width on a
  `left`/`right` sheet and a height on a `top`/`bottom` one. Swipe is always an addition: `Esc`, the
  close button and a backdrop press still close the panel.
  [docs](https://design.vegastack.com/docs/components/sheet)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **EditableCell**, **ChipInput**, **DataGrid**, **CopyButton**, **SortableList**,
  **Board**, **Dropzone** — all announce through `use-announcer`, one live region each, replacing five
  identical hand-rolled `{ text, seq }` regions plus CopyButton's. EditableCell's visible status slot is
  no longer itself a live region, so it stops announcing its own icon swaps. `Pagination`'s
  `PaginationLink` takes its hover and pressed steps from `surfaceInteractive` instead of restated
  `hover:bg-surface-2` / `active:bg-surface-3` literals.
  [docs](https://design.vegastack.com/docs/components/editable-cell)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`useDragReorder` and `useFileDrop` return `Announcer`, not `getLiveRegionProps()`.** Render
  `<reorder.Announcer />` / `<drop.Announcer />` in place of
  `<span {...reorder.getLiveRegionProps()} />`. The props-getter shape could not keep the region
  mounted across an announcement, which is the property that makes it audible.
  [docs](https://design.vegastack.com/docs/components/sortable-list)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Tag**, **FilterChip**, **ComboboxChip**, **ChipInput**, **TagGroup** — all now compose
  the `chip` primitive. Three consequences are visible: a `Tag` is 28px rather than 20px and a
  `FilterChip` is a pill rather than a rounded rectangle (chips are `rounded-full` by doctrine); the
  neutral chip rests on `surface-1` and an applied filter sits on `surface-2` instead of the `accent`
  alias; and every remove control is the same 24×24 target. That last one fixes `ComboboxChipRemove`, a
  bare 16px box with no hit-area expansion at all (a WCAG 2.5.8 failure), and retires `Tag`'s
  `::before` hit area, which a nested native `<button>` clipped and so never actually expanded
  anything. TagGroup's `+N` overflow control is itself a chip, so the whole 28px pill is the pointer
  target and its hover/pressed steps come from the shared `surfaceInteractive` recipe rather than a
  hand-written descendant selector.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`chip`** — THE labelled pill, and the only one. `hue` (10 decorative tag hues, or neutral) ×
  `size` (`sm` 28px inline · `md` 32px control-scale) × `active` (the neutral chip's promotion to the
  `surface-2` selection rung), with `onRemove` mounting a round ghost `IconButton size="xs"` whose
  **real** border box is 24×24. `Tag`, `FilterChip`, `ComboboxChip` and ChipInput's chips are all this
  one primitive composed through Base UI `render`.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Pagination` no longer hard-codes its accessible name.** It renders a plain `<nav>`
  (no `role="navigation"`) and `aria-label` defaults to "Pagination". A page with more than one pager
  must name each one — two identically named landmarks are an axe `landmark-unique` failure.
  [docs](https://design.vegastack.com/docs/components/pagination)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`TagHue`** — the hue vocabulary moved to the Chip primitive and is exported as
  **`ChipHue`** from `@vegastack/chip`. `Tag`'s `hue` prop is unchanged; only the type's name and home
  moved.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`use-announcer`** — the one polite live region. Destructure `announce` and `Announcer`
  from `useAnnouncer()` and render the `Announcer` element once per component. It keeps the region
  mounted and observed from first paint, re-keys it per call so an identical consecutive announcement
  is still spoken, and holds its state outside the host so announcing no longer re-renders a whole
  DataGrid.
  [docs](https://design.vegastack.com/docs/guides/components)

### Patch Changes

- [#54](https://github.com/vegastack/vegastack-design/pull/54) [`d5c960a`](https://github.com/vegastack/vegastack-design/commit/d5c960a3e704f730893303fe0aef1d4b49812ce3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **`verify-component-contracts --write-data-attributes`** records each registry part's
  `data-*` attributes and CSS variables in `component-contracts.json`, extracted from the canonical
  source through the TypeScript AST, so the docs API tables and the agent markdown export list them.
  The default mode fails when the contract drifts from the source, and a `--self-test` drifts a
  `dataAttributes` record in memory and requires the reconciliation to reject it — so the gate cannot
  pass by never having run.
  [docs](https://design.vegastack.com/docs/components/dialog)
- Updated dependencies [[`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`f1d7d2f`](https://github.com/vegastack/vegastack-design/commit/f1d7d2fbc5f9c52aa13ff9ddfc869cb71c6ae163), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64)]:
  - @vegastack/design@0.4.0
  - @vegastack/design-tokens@0.4.0

## 0.6.0

### Minor Changes

- [#26](https://github.com/vegastack/vegastack-design/pull/26) [`43eb359`](https://github.com/vegastack/vegastack-design/commit/43eb359a9157bce16a361ba929a8bf68e05d44e7) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Rework AudioPlayer's transport. On a wide player it is a single line: play/pause, rewind/forward (±15s), the combined elapsed/duration readout, a flexible seek bar, and a tappable playback-speed control that cycles rates (1x → 1.25x → 1.5x → 2x → 0.5x), all in subdued secondary emphasis instead of the primary accent, with a smoothed waveform progress edge that fills continuously. Audio carries no volume control — mute stays on the M key. On a narrow, mobile-width player it reflows to two lines: the seek bar with elapsed/duration pinned to either edge in a smaller font on top, and a centred play/pause flanked by rewind/forward on the bottom, with an optional transcript control (new `onTranscriptClick`, lucide `audio-lines`) on the leading edge and the speed control on the trailing edge. VideoPlayer's overlay controls are unchanged.

### Patch Changes

- Updated dependencies [[`43eb359`](https://github.com/vegastack/vegastack-design/commit/43eb359a9157bce16a361ba929a8bf68e05d44e7)]:
  - @vegastack/design@0.3.2

## 0.5.0

### Minor Changes

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Fix component behavior and responsive presentation found during manual QA, including range selection, compact navigation, overflow handling, and responsive pricing and comparison layouts. Improve the published examples for dropzones, menus, charts, mobile shells, and the dashboard starter.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add AudioPlayer and VideoPlayer registry components with shared custom transport controls, including
  a smoothly expanding video progress rail, contained volume rocker, larger overlay actions, and
  state-aware fullscreen controls. The AudioPlayer mirrors the video control surface statically — a
  full-width solid scrubber, a background-free primary play control with a combined `elapsed / duration`
  readout, and matching settings submenus — and gains a `variant="waveform"` that renders the decoded
  audio as an interactive, seekable waveform.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add ProgressIndicator value display variants for inline and contained percentage labels.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Keep the desktop Sidebar and its footer pinned to the viewport while page or navigation content scrolls.

### Patch Changes

- Updated dependencies [[`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c)]:
  - @vegastack/design@0.3.1

## 0.4.1

### Patch Changes

- [#19](https://github.com/vegastack/vegastack-design/pull/19) [`a3de5ed`](https://github.com/vegastack/vegastack-design/commit/a3de5eded041ad1fdbba537eda9d8510e8fc50ab) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Prevent horizontal Stepper labels from overlapping at narrow container widths.

## 0.4.0

### Minor Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`5f17c36`](https://github.com/vegastack/vegastack-design/commit/5f17c36f042ff39c5e4d1b61f9b593e90ca5e57b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `action-bar` component — a floating contextual bar with a status region and action children.
  Bulk selection ("5 selected · Tag · Archive") is its most common recipe, never its identity: the
  same object serves unsaved-changes and batch-progress bars. It never owns selection (the host's
  list keeps `selectedIds`), announces status changes politely, inerts its actions while `pending`,
  sits flat in the raised band (covered by any dialog), and enters/exits with the CSS-only
  translate/scale/opacity recipe MessageScrollerButton established. `containerRef` switches from
  viewport centring (auto margins — never `left: 50%`) to ResizeObserver-measured centring over a
  content area beside a sidebar.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cb15077`](https://github.com/vegastack/vegastack-design/commit/cb15077278e9e327b453a185f4e063af2388c9c3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `board` component — kanban columns over the `use-drag-reorder` seam with the reference
  implementation's content/chrome split: the host renders card content only and owns the move command
  (`onMove`, promise-refusable with pending shimmer and announced snap-back); the board owns column
  shells, counts, `Empty bordered` drop targets, collapsed read-only lanes, drag + keyboard models,
  and the lossless per-card "Move to…" menu with visible lock reasons. Below 768px pointer drag
  disables outright — the keyboard move mode and the menu are the only, lossless paths. Cards form
  one roving tab stop (↑/↓ within a column, RTL-aware ←/→ across at a clamped index, M opens the
  menu, Enter activates, Space lifts). A dragged card gains no shadow — flat by doctrine. Selected
  for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Remove the `active:translate-y-px` press nudge from `buttonVariants`. Pressed feedback across
  Button and every component composing it (IconButton, SplitButton, toolbars, pickers) is now
  colour-only via the existing `active:bg-*` states — no press motion anywhere in the system. The
  motion foundations doctrine is updated to match.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cf154ee`](https://github.com/vegastack/vegastack-design/commit/cf154ee2533d36830335a435372d9bb894464cbe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `chip-input` component — free-token entry for tags, recipients, domains, and webhook events.
  Enter/comma/paste-split commit chips; Backspace in the empty input removes the last one. The field
  chrome is the Combobox input group's (borrowed literally, retargeted at the inner real `Input` — no
  raw `<input>`, no lint exemption), the chips are real `Tag`s with named 24px remove targets.
  Validation is per-chip and non-destructive: invalid entries are added and flagged (`data-invalid` +
  destructive outline-border pair + text description) rather than silently dropped, duplicates are
  rejected and announced, and all outcomes flow through a polite live region.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`019b921`](https://github.com/vegastack/vegastack-design/commit/019b921d0768693736dc877719fafa972556e2f2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New component: `DataGrid` — the full-parity grid DataList's docs always pointed to. TanStack Table computes the sorted row model (multi-key sort with visible ordinals, shift-click additive); TanStack Virtual windows rows behind the `virtualize` flag; the APG grid keyboard layer — roving cell focus with RTL-aware arrows, Enter/F2 into `EditableCell` managed editing, Escape restore — is the component's own. Also: column picker + responsive column revelation (visible/hidden/merge), collapsible per-value grouping as real `tbody` sections, keyboard-continuous load-more, and row selection. Install with `shadcn add @vegastack/data-grid`.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`dc088f5`](https://github.com/vegastack/vegastack-design/commit/dc088f56d3ec83c58089230935fc3337c20567d6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `editable-cell` component — an inline-editable value with an async commit lifecycle. Composes
  `FieldInline` as the text leaf and reuses `AutoSaveInput`'s `AutoSaveStatus` vocabulary
  (`idle | saving | saved | error`) for its status indicator. A promise-returning `onCommit` shows the
  committed value optimistically, then flips to saved — or reverts to `value` and politely announces
  the revert on rejection (the version-conflict path). Editors are typed and open:
  `text` (FieldInline), `select` (a Select whose popover is the editor), and `custom` for app editors.
  `focusMode: "standalone" | "managed"` decides whether the cell owns its tab stop or defers to a
  grid's roving focus model.

  `FieldInline` gains three additive props to support this without being forked: controlled
  `editing` / `onEditingChange`, and a `tabIndex` override for the display element. No behaviour
  change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`42427ad`](https://github.com/vegastack/vegastack-design/commit/42427ad24313e6cc83842bae741829dce6cb6f3f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `filter-bar-managed` component (`FilterBuilder`) — the stateful nested and/or filter builder
  the `filter-bar` docs recorded as deferred. The grammar is host-injected: the component owns the
  tree shape (`FilterNode` groups and conditions) and its editing surface, while the app supplies the
  field `vocabulary` (operators per field, `requiresValue`, formatting) and a per-type `editors`
  registry (text is built in). Nested groups render as fieldset/legend — deliberately not
  `role="tree"` — with depth and condition caps whose disabled add affordances carry readable
  reasons, a missing-value check with visible text, focus-managed removal (next sibling, else the
  group's add button), and a `readOnly` summary of removable `FilterChip`s. It never validates field
  semantics, never serialises, and never executes the filter — that would adopt one app's AST.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`49a0519`](https://github.com/vegastack/vegastack-design/commit/49a0519db34238685c163374de8a3309dd54ffd5) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `number-field` component — the roster's first numeric input. Wraps Base UI's NumberField
  (locale-aware Intl parsing/formatting, `min`/`max`/`step` with `snapOnStep`, keyboard stepping,
  wheel scrub) in `Input`'s exact addon-group chrome, with full-height − / + steppers whose pointer
  targets meet the 24px floor without hit-area expansion. Money is a `format` prop
  (`{ style: "currency", currency }`) plus a documented minor-units recipe — deliberately not a
  separate money-input. Like `Input`, the `size` prop replaces the native numeric `size` attribute.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`488cc09`](https://github.com/vegastack/vegastack-design/commit/488cc091ae5304d1377271bfd03ecbe57f158da1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `shortcut-overlay` component — the `?`-triggered dialog listing keyboard shortcuts, rendered
  from a declaration registry (keys, label, category, optional `when`) instead of hand-listed markup,
  so the surface cannot go stale. Shortcuts group by category in declaration order, render as
  description-list pairs with real `Kbd` keys whose modifier glyphs follow the user's platform via
  `use-platform`, and large sets get an automatic filter. The global binding never fires from a text
  field and defers to a `shouldHandle` predicate while another overlay owns the keyboard.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`c183905`](https://github.com/vegastack/vegastack-design/commit/c18390507ac7e5970be148264d613576d757022a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `sortable-list` component — reorderable rows on `ItemGroup`/`Item`, driven by
  `use-drag-reorder`: pointer drag with 2px closest-edge drop indicators, the keyboard move mode,
  per-step polite announcements, and the required lossless Move menu (up / down / to top / to
  bottom). Controlled — the host owns the order and can refuse a move by rejecting the `onReorder`
  promise (pending shimmer, announced snap-back). Deliberately owns no selection: reordering and
  multi-select on one surface make drag intent ambiguous. The `data-list` scope table's
  "drag-and-drop reordering" row is reconciled: the persisted order stays app-coupled, the mechanism
  now lives in the system. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`accf555`](https://github.com/vegastack/vegastack-design/commit/accf555aef523991f582b52f15f10891f180df28) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `stepper` component — a bounded linear process as an ordered list with
  `aria-current="step"`, deliberately not `Tabs` (tab semantics promise free navigation a wizard
  doesn't offer). Per-step complete/current/upcoming/**error** states map 1:1 onto `StatusIcon`'s
  vocabulary and always carry icon shape plus visually hidden text; a `blockedReason` renders against
  the current step, announces politely, and wires to the host's Next button via `aria-describedby`;
  focus moves to the new current step's label on change (never on mount); horizontal and vertical
  orientations share one DOM order; `navigable` mode turns completed steps into real buttons.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6ce022d`](https://github.com/vegastack/vegastack-design/commit/6ce022d7ee12d72abbdd80c48404fa12f29239ae) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Table` a styling hook for its scroll container, and let `DataList` pass the whole Table
  surface through.

  - `Table` gains `containerClassName` and `containerProps` (including `ref`), both forwarded to the
    existing `data-slot="table-container"` element that owns `overflow-x-auto`. Sticky headers,
    fixed-height viewports, and virtualizers finally have somewhere to attach — the `<table>` itself
    cannot own a scroll viewport.
  - `DataListProps` now extends `Omit<TableProps, "children">` instead of the raw `<table>` props, so
    `grid`, `headerTone`, `density`, and the new container hooks type-check on `DataList` (they always
    reached `Table` at runtime; TypeScript rejected them).
  - `DataListColumn` gains `cellClassName?: (row, index) => string | undefined` — a per-cell class
    hook merged after the per-column `className`.
  - A column `render` now receives an optional third argument, `DataListCellContext`
    (`{ rowId, columnKey, selected }`). Existing two-argument render functions are unaffected.

  All additive; no behaviour or visual change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`2d1707f`](https://github.com/vegastack/vegastack-design/commit/2d1707ffb624196cd912513fa15258ef1efc68e8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `timeline` component — rail geometry only, deliberately: a continuous vertical connector with a
  node per entry (`Timeline`/`TimelineItem`/`TimelineSeparator`), while rows compose the existing
  `Item` parts, timestamps are `RelativeTime`, and group headers render through `Marker`'s separator
  variant. No `TimelineTitle`/`TimelineDescription` — that would fork `Item`'s vocabulary. Entries
  carry the `content-visibility` render-skipping recipe for long feeds with zero dependencies, the
  rail is `aria-hidden` decorative geometry, and the whole family is server-safe (no `'use client'`).

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`37d31dd`](https://github.com/vegastack/vegastack-design/commit/37d31ddb57c179d5afdc0cc07aa176a265585335) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-drag-reorder` registry hook — the system's one drag-engine seam, wrapping the newly
  sanctioned `@atlaskit/pragmatic-drag-and-drop` (D3). Pragmatic owns pointer/touch mechanics and
  closest-edge hit-testing; the hook owns what must match this system's voice: a keyboard move mode
  (Space/Enter lifts, arrows commit one announced step at a time, Escape ends — Atlassian's own
  user-tested commit-per-step pattern), an overridable live-region vocabulary
  (lifted/moved/ended/rejected), a `requestMove` entry point for the mandatory menu equivalents, and
  the async drop contract no drag library models: a promise-returning `onReorder` is `pending` until
  it settles and a rejection announces + clears, so server-refused moves snap back. One API covers a
  single list and cross-container boards. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`abe32d8`](https://github.com/vegastack/vegastack-design/commit/abe32d8187b4783da987e7e2070f602e9281a9e7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-file-drop` hook and `dropzone` component (D4). The hook is the one file importing the
  sanctioned `react-dropzone` engine — drag-depth handling, directory traversal, accept matching,
  keyboard activation of the drop surface — and adds the system's vocabulary on top: the paste
  path (`clipboardData.files`, the composer case) under the same accept/size/count constraints as
  drop, typed `FileDropRejection` reasons aligned with `AttachmentState`, a polite announcement
  payload that states WHY a file was refused, and a ref-counted document-level missed-drop guard
  scoped to file-bearing drags (`preventWindowDrop`). `Dropzone` is a deliberately thin shell over it: the surface is the named
  focusable control (`role="button"`), the real `<input type="file">` behind it is the picker
  bridge (the one reviewed raw-interactive exemption),
  `data-dragging`/`data-drag-invalid` styling flags, and children compose `Empty bordered` for the
  classic drop-zone look. No `attachments` prop by design — acquisition ends at a plain `File[]`
  callback where `Attachment`'s state machine takes over. Dropzone is selected for cross-engine
  smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`296b3fe`](https://github.com/vegastack/vegastack-design/commit/296b3fedf005cbc13c19211279e3d1f23d16f906) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-list-nav` registry hook — roving-tabindex keyboard navigation for a list or grid of
  focusable items. One Tab stop per collection, RTL-aware ArrowLeft/Right (direction read live from
  the container), ArrowUp/Down by row via `columns`, and Home/End jumps scoped by
  `homeEndScope: "collection" | "row"` (default `"collection"`, matching the shipped pickers). A
  `shouldHandle` predicate suppresses navigation while an overlay above the list owns the arrow keys.
  Extracts the block color-picker and emoji-picker each hand-rolled; they adopt it in a follow-up.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`eb857f3`](https://github.com/vegastack/vegastack-design/commit/eb857f31a08dcbe976c8c302f91655f1b440c091) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-platform` registry hook — SSR-safe platform detection returning `{ os, isTouch }`
  (`os: "mac" | "windows" | "linux" | "other"`, touch from the `(pointer: coarse)` media query). The
  server render and hydration render report caller-supplied fallbacks so markup agrees on first
  paint; the real value lands in a client-only effect. Fills the hole behind `Kbd`'s manual `os`
  prop: callers run the hook and pass `os === "mac" ? "mac" : "other"` down — `Kbd` itself stays
  server-safe and unchanged.

### Patch Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`76acdca`](https://github.com/vegastack/vegastack-design/commit/76acdcaa2f67d26c989ced01058f3e9bb074a4cc) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `Kbd` mac modifier glyphs now pair the visual glyph with visually hidden spoken names ("Command",
  "Shift", "Option", "Control", "Return", "Delete") while the glyph itself goes `aria-hidden` — screen
  readers no longer hear "place of interest sign" (or nothing) for `⌘`. Non-mac word rewriting is
  unchanged. Surfaced by shortcut-overlay, the one surface built on the real `Kbd`; fixed at the root.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`ff66002`](https://github.com/vegastack/vegastack-design/commit/ff660024e11358b44698b954cf59d08230c2755a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `color-picker` and `emoji-picker` adopt the shared `use-list-nav` hook for their roving-tabindex
  grids — internal refactor, no visual or API change. Both items gain `@vegastack/use-list-nav` in
  `registryDependencies`, so `check-updates` will report an update for each; it is safe to take or
  skip. Home/End behaviour is unchanged (whole-grid, the hook's default). One correction rides along:
  emoji-picker's ArrowLeft/ArrowRight are now RTL-aware, matching color-picker — previously they were
  LTR-only in RTL contexts.
- Updated dependencies [[`9d0a2ef`](https://github.com/vegastack/vegastack-design/commit/9d0a2efae46de237bf1a9f54a99bdebc4badc840), [`630ca84`](https://github.com/vegastack/vegastack-design/commit/630ca84084199e75c5a0a80184aa726552070994), [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e)]:
  - @vegastack/design@0.3.0

## 0.3.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Add AnnouncementBanner, CodeBlock, ComparisonMatrix, NavigationMenu, OnboardingChecklist,
  PricingSection, PropertyList, RuledBand, Segmented, Stat, TagGroup, and ToolCallChip, and reconcile all
  96 registry components, 439 animated icons, two hooks, and the dashboard block across styling, portal
  theming, accessibility, responsive behavior, documentation, tests, and generated registry integrity.

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - **Breaking (both packages — `minor` is the breaking position pre-1.0).** Two changes here alter
  existing behaviour and were previously filed as `patch`, which would have broken consumers on an
  upgrade they had no reason to review:

  - `vegastack-design verify --post-write` now **requires** `--expected-integrity <sha256-base64>`,
    a flag that did not exist before. Any existing consumer CI step invoking `--post-write` with just
    `--item`/`--target-dir` now exits 2. Take the value from the pre-write run, which prints the exact
    integrity-pinned command to use.
  - `MarkdownView` images are **same-origin by default**. Remote `<img>` sources previously rendered
    unconditionally and are now dropped unless their origin is listed in the new `allowedImageOrigins`
    prop. Consumers rendering markdown that references remote images must opt those origins in.

  Constrain registry credentials and copied-file verification to trusted origins and contained paths,
  pin post-write checks to a digest retained before copy-in, match shadcn's inherited TypeScript alias
  resolution, and make Markdown images same-origin by default with an explicit remote-origin allowlist.

  Refuse to place credential material in a registry URL, and redact it from CLI output. The
  trusted-origin check only inspected request HEADERS, so a `components.json` registry entry such as
  `"@vegastack": "http://host/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"` declared no headers, skipped
  the check entirely, and sent the Cloudflare Access service token to an arbitrary origin over plain
  http — while `check-updates` exited 0. The token was also echoed verbatim into stderr, and therefore
  into CI logs. Credentials now must travel as headers: a URL is recorded in server access, proxy and
  CDN logs even when the origin is fully trusted, so the refusal is unconditional rather than
  origin-scoped. Applied identically in `check-updates`, `verify`, and the shared internal helper so
  the three do not diverge on this boundary. Uncredentialed registries (including plain-http localhost
  mirrors) are unaffected.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`09fa52c`](https://github.com/vegastack/vegastack-design/commit/09fa52ce0838cd8b3a48e6dd1abc29b6e47c2d0c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Fix `Terminal`'s scrollable command pane having no visible focus indicator under
  `forced-colors: active`.

  The pane is keyboard-focusable and signalled focus with a border tint plus `outline-none`. Forced
  colors replaces `border-color` outright, so the tint vanished, and Tailwind v4's `outline-none`
  suppresses the shared `:focus-visible` outline with no forced-colors carve-out — leaving no
  indicator at all in the forced palette. The affordance is now that shared outline, inset with a
  negative offset so neither the terminal's `overflow-hidden` root nor `scroll-fade-x`'s mask can clip
  it. The layout-reserving transparent border is removed with the tint it existed for, so the pane
  renders 2px shorter.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`7595cfd`](https://github.com/vegastack/vegastack-design/commit/7595cfd7c7eeaaafa95c7bd8d621cd4e5cb5087f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Terminal`'s scrollable command pane an accessible name, and accept `aria-label` /
  `aria-labelledby` to override it.

  The pane is keyboard-focusable — a scrollable region has to be reachable without a pointer — but it
  was a bare `<div tabIndex={0}>` with no role and no name, so a screen reader announced it as an
  unnamed stop in the tab order (WCAG 4.1.2). It is now a `group` labelled by the visible `title`, so
  `title="Install"` reads as "Install, group" with no caller changes. `group` rather than `region`
  because `region` is a landmark and a page with several install snippets should not gain several
  landmarks.

  `aria-label` and `aria-labelledby` passed to `Terminal` now apply to that pane instead of the outer
  block, matching `ScrollArea`. On the outer block they had no effect — it carries no role — so nothing
  that previously worked stops working.

### Patch Changes

- Updated dependencies [[`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f)]:
  - @vegastack/design@0.2.0
  - @vegastack/design-tokens@0.2.0

## 0.2.0

### Minor Changes

- [`c7de692`](https://github.com/vegastack/vegastack-design/commit/c7de6929416086bd0d4c6ca0b1957247c6b202a7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `provider` registry item — `VegaStackProvider` + `useVegaStackTheme` ship as a copy-in
  (`shadcn add @vegastack/provider`, composing the `sonner` Toaster item), closing the gap where
  downstream projects had no sanctioned install path for the app-root wiring (theme, toasts,
  tooltip coordination, direction). The private package's provider is now a documented mirror of
  the canonical registry source.

### Patch Changes

- Updated dependencies [[`9532d42`](https://github.com/vegastack/vegastack-design/commit/9532d4295807dd4f37ddefb514641249e1002911)]:
  - @vegastack/design@0.1.1

## 0.1.0 — first release (2026-07-18)

Private package — components are distributed via the **signed shadcn registry**
(`design.vegastack.com/r`), never npm. This changelog is the consumer-facing record per version;
per-component change signals are the `// @vegastack <name>@<version> sha256-…` provenance headers.

83 components on Base UI 1.6 + Tailwind v4, 525 registry items (incl. 440 animated-icon mirrors,
2 hooks, the `dashboard-01` block):

- Actions/forms: 15-variant Button family (icon-proportional ladder, in-ink loading spinner),
  full form suite with border-tint focus (no rings) and auto shake-on-invalid.
- Combobox + Command rebuilt data-driven on Base UI (cmdk removed); Select-style popup search
  (`ComboboxPopupInput`); pickers (date/color/emoji/country/region).
- Display/data: badges, cards, tables, DataList, charts (mono numerals), Empty, Item, Attachment,
  AnimatedNumber, Resizable.
- Shell: AppShell + Sidebar (Sheet mode, rail, cookie persistence), PageHeader, breadcrumbs.
- Chat: Marker, Message, Bubble, MessageScroller. Marketing: 8 `.vs-marketing` primitives.
- Every component: token-only styling, WCAG 2.1 AA, both themes, ref-as-prop, flat exports —
  audit-swept with per-variant screenshot evidence before this release.
