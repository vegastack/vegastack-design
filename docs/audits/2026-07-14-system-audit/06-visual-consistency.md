# 06 — Visual Consistency Audit

**Scope:** all 68 canonical components in `packages/ui/registry/ui/*.tsx` (source of truth per
`AGENTS.md` — never audit the generated `apps/docs/components/ui/*` copy-in).
**Spec baseline:** root `design.md` (v2.0, frontmatter + prose), cross-checked against the shipped
bridge (`packages/tokens/dist/theme.css`) and `packages/tokens/src/base.css`.
**Method:** static grep/read audit of every component file; no source was modified.
**Owner mandate carried through this audit:** no shadows outside the one `shadow-overlay` token, no
rings except where WCAG demands a visible focus indicator, one coherent visual language.

---

## 0. What the spec actually says (baseline, so violations below are legible)

- **Control heights:** ONE scale for buttons/inputs/selects — `sm 28 (h-7)` / `md 32 (h-8, default)` /
  `lg 40 (h-10)`. Padding-x: buttons `10/12/16`, inputs `12`.
- **Radius:** 4 steps only — `sm 6` / `md 8` / `lg 12` / `full 9999`. "`full` never for container
  highlights" (nav/menu hover, cards use `md`/`lg`).
- **Typography:** a named, role-scale — `text-display`(36/300, hero-only) `text-h1`(28/400)
  `text-h2`(22/400) `text-h3`(18/400) `text-h4`(16/500) `text-lg`(16/400) `text-base`(14/400,
  **default body**) `text-label`(14/500) `text-sm`(12/400, caption) `text-code`(mono 13/400)
  `text-label-sm`(12/500) `text-code-sm`(mono 12/400). **Never 600+, at most two weights per view.**
- **Focus:** ONE neutral 2px `:focus-visible` outline, `outline-ring` (= `primary` ink), offset 1,
  defined once in `base.css`, applied globally. **"Components carry NO focus ring of their own."**
  Explicit carve-outs: text-entry fields (Input/Textarea/Field control/OTP) use a **border-only**
  darken to `ring/70`, no outline; button-style triggers (Select, date-picker, country-select,
  color-picker) darken border to `ring/70` **and** keep the neutral outline.
- **Shadows:** flat by default (hairline border only) for card/input/panel/table/sidebar. Only
  overlays — dropdown/tooltip/popover/menu/select/dialog/sheet — get **one** `shadow-overlay` token.
  No multi-tier shadow system, no `shadow-card`.
- **Motion:** durations `150/200/300ms` (state/popover/overlay), easing `cubic-bezier(0.2,0,0,1)`
  (`ease-standard`), honour `prefers-reduced-motion`.
- **Menus:** item height 32px via `py-1.5` (6+20+6=32) + `px-2`, radius `sm`, hover = `accent`.
- **Cards:** prose says "20px padding (16px compact, 32px hero)"; component recipe table says
  `card: { padding: 16px }`. (These two parts of the same doc already disagree — flagged below.)

---

## (a) Control-height matrix

| Component                              | sm                               | md/default                                            | lg          | Notes                                                                                                                                                                                                                                                                      |
| -------------------------------------- | -------------------------------- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                             | `h-7` (28)                       | `h-8` (32)                                            | `h-10` (40) | Also ships an undocumented `xs` = `h-6` (24) and `icon-xs/-sm/-lg` mirrors — not in `design.md`'s scale at all.                                                                                                                                                            |
| **IconButton**                         | `size-7`                         | `size-8`                                              | `size-10`   | Mirrors Button 1:1 via `sizeMap`. Consistent.                                                                                                                                                                                                                              |
| **Select (trigger)**                   | `h-7` (28)                       | `h-8` (32)                                            | `h-10` (40) | `select.tsx:30-32`. **Matches Button exactly** — the "Button sm=h-8 but Select sm=h-9" mismatch hypothesized in some briefs does **not** exist in current code.                                                                                                            |
| **Input**                              | —                                | `h-8` (32) only                                       | —           | `input.tsx:39,54`. **No `sm`/`lg` size variant at all** — the only member of the "one scale" trio without size props. Anyone needing a compact/large input has no token-driven way to get one.                                                                             |
| **Textarea**                           | —                                | `min-h-16` (64, ~2 rows)                              | —           | No size scale; row count via native `rows` prop only.                                                                                                                                                                                                                      |
| **Pagination link**                    | `h-7` (28)                       | `h-8` (32, default→`icon`)                            | `h-10` (40) | `pagination.tsx:93-96`. Matches the scale.                                                                                                                                                                                                                                 |
| **Tabs trigger** (line/pill)           | —                                | `h-8` (32)                                            | —           | `tabs.tsx:159,163`. Single size, matches `md`.                                                                                                                                                                                                                             |
| **Toggle**                             | `h-7`                            | `h-8`                                                 | `h-10`      | `toggle.tsx:25-29`. Matches.                                                                                                                                                                                                                                               |
| **FilterChip**                         | —                                | `h-8` (32)                                            | —           | `filter-bar.tsx:193`. Height matches `md`, but **type size is `text-xs` (12px)** while every other 32px control (Button/Select/Pagination/Tabs) uses `text-sm` (14px) at the same height — see §Typography.                                                                |
| **Checkbox**                           | `size-3.5` (14)                  | `size-4` (16)                                         | —           | Independent micro-scale (correct — not a text control).                                                                                                                                                                                                                    |
| **Radio**                              | (inherits Checkbox-style sizing) | `size-4`                                              | —           | Same family as checkbox.                                                                                                                                                                                                                                                   |
| **Switch**                             | `h-4/w-7`                        | `h-5/w-9`                                             | `h-6/w-11`  | `switch.tsx:29`. Own scale (16/20/24 track height) — appropriate for a track, but note the `sm/default/lg` _names_ map to different literal pixels than Button/Select's `sm/default/lg`. Purely a naming-collision risk for anyone assuming one universal size vocabulary. |
| **Command input**                      | —                                | `h-10` (40)                                           | —           | `command.tsx:171,178`. 40px — same as `lg`, larger than a typical popover-hosted search field; not in conflict with any explicit spec line but worth a design check (feels like a `lg` when the palette itself uses `md`-scale items).                                     |
| **Table `<th>`**                       | —                                | `h-9` (36)                                            | —           | `table.tsx:140,153`. **36px is off the 28/32/40 scale entirely** — a 4th, unlisted height. Likely intentional (table density ≠ control density) but not documented anywhere as a 5th allowed height.                                                                       |
| **Dropdown/Context/Command menu item** | —                                | computed 32 (`py-1.5`+`text-sm` line-height 20 + 2×6) | —           | Matches `components.dropdown.itemHeight: 32px` by arithmetic, not by an explicit `h-8`.                                                                                                                                                                                    |
| **Select item**                        | —                                | computed 32 (`py-1.5`)                                | —           | Same arithmetic match; padding differs (`pr-8 pl-2` vs menu's `px-2`) because of the checkmark — justified, not a defect.                                                                                                                                                  |

**Finding:** the "ONE scale" claim (`design.md` §Components) is **true for Button/Select/Pagination/
Toggle/Tabs** (all literally `h-7/h-8/h-10`) but **false for Input** (no scale) and **contradicted by
Table** (`h-9`, a 4th height with no token). FilterChip matches height but not type size.

---

## (b) Focus-indicator table

| Component                             | Treatment found                                                                                                                                                                                                                               | Matches spec rule?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Global default** (`base.css:16-18`) | `outline-2 outline-offset-1 outline-ring` on `:focus-visible`, applied to `*`                                                                                                                                                                 | This IS the canonical rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Button** `outline` variant          | `focus-visible:border-ring/70` (`button.tsx:23`) — border darken, **no outline redeclared**, relies on the global rule for the ring                                                                                                           | Matches spec's "button-style trigger = border darken **and** keep outline" — outline comes free from the global `:focus-visible` selector. Correct, but easy to misread as "focus ring missing" since it's not visible in this file.                                                                                                                                                                                                                                                                                                                    |
| **Input / addon group**               | `focus:border-ring/70` (note: `focus:`, **not** `focus-visible:** — `input.tsx:40,56) — no outline (global rule is suppressed nowhere, so it still applies)                                                                                   | Border-only darken matches the text-entry carve-out. **But it's bound to `focus:` not `focus-visible:`** — a mouse click into a text input will show the border darken (acceptable, inputs are exempt from click/keyboard distinction per spec's own text) but this is the ONE place the modifier differs from every other component (all others use `focus-visible:`). Confirm intentional.                                                                                                                                                            |
| **Textarea**                          | `focus:border-ring/70` (`textarea.tsx:25`) — confirmed present, byte-for-byte the same border-only pattern as Input (component's own doc comment: "the darkened `ring/70` border is the sole focus cue (no ring)... mirrors `Input` exactly") | **Matches the text-entry carve-out correctly.** Initial grep pass missed it because the class string spans a concatenation the pattern didn't catch — direct read confirms no gap. Also uses `focus:`, not `focus-visible:`, same as Input — consistent with each other.                                                                                                                                                                                                                                                                                |
| **Checkbox / Radio / Switch**         | No component-local `focus-visible:` classes found — rely entirely on the global `outline-ring` rule                                                                                                                                           | Matches "components carry no ring of their own."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Tabs trigger**                      | Redeclares `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring` locally (`tabs.tsx:204`)                                                                                                                       | **Redundant** — byte-identical to the global rule already applied via `*`. Not a visual bug, but it's dead weight and a drift risk (if the global token ever changes, this hardcoded copy won't unless someone remembers to update both places).                                                                                                                                                                                                                                                                                                        |
| **Alert** dismiss button              | Same local redeclaration (`alert.tsx:152`)                                                                                                                                                                                                    | Same redundancy finding as Tabs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Toggle-group item**                 | `focus-visible:z-10` only (no outline class) — relies on global rule for the visual, adds `z-10` so the ring isn't clipped by sibling borders                                                                                                 | Correct, purposeful use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Bubble** (chat message link/button) | `[button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/30` (`bubble.tsx:155`)                                                                                                               | **Off-system.** This is a `ring-3 ring-ring/30` (translucent ring-shadow) plus a border color change — a THIRD focus treatment, distinct from both the global outline and the input border-darken pattern, and it is exactly the "colour/glow ring" the spec explicitly forbids ("never a colour or a glow"). Directly reproduces the owner's #1 dislike (rings) inside one component.                                                                                                                                                                  |
| **Command palette input**             | `focus-within:border-ring/70` (`command.tsx:171`)                                                                                                                                                                                             | Border-only, consistent with the text-entry carve-out. Good.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **date-picker "today" cell**          | `data-[today]:ring-2 data-[today]:ring-ring/50` (`date-picker.tsx:295`)                                                                                                                                                                       | **Not a focus state** — this is a permanent visual marker for "today," not `:focus-visible`. But it's a literal `ring-2` utility living in a codebase whose written rule is "no rings" for indicators — even though it isn't the _focus_ ring, it's still a ring-shaped visual the owner's stated aesthetic wants eliminated. Worth a design call: could be a `border` + dot instead.                                                                                                                                                                   |
| **avatar / bubble overlap gaps**      | `ring-2 ring-background`, `ring-3 ring-card` (`avatar.tsx:146`, `bubble.tsx:168`)                                                                                                                                                             | **Not focus, not accessibility** — these use `ring-*` purely as a cheap "cutout" separator between overlapping circular avatars/badges (a common Tailwind trick: a ring in the surface color fakes a gap). Functionally fine, but it means `ring-*` utility classes appear in the codebase for 3 unrelated purposes (focus-adjacent glow in Bubble, decorative gap-cutout in Avatar/Bubble, "today" marker in date-picker) — none of which is the sanctioned focus treatment, which muddies any future "grep for ring- and kill them all" cleanup pass. |

**Overall focus-system verdict:** the _global_ mechanism (one outline token, offset 1, border-darken
carve-out for text fields) is sound and matches the owner's anti-ring preference well — it is
genuinely ring-free for keyboard focus everywhere except **Bubble**, which is the one real regression
(`ring-3 ring-ring/30` glow). The two local outline redeclarations (Tabs, Alert) are inert duplication,
not bugs. Textarea's focus-visible border needs a direct re-check (see follow-up below).

---

## (c) Shadow inventory table

| Component                                      | `shadow-*` usage                                                                                                                                                     | Elevation tier               | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dialog**                                     | `shadow-overlay` (`dialog.tsx:30`)                                                                                                                                   | Overlay                      | Matches spec exactly (border + one shadow + scrim).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **AlertDialog**                                | `shadow-overlay` (`alert-dialog.tsx:135`)                                                                                                                            | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Sheet**                                      | `shadow-overlay` (`sheet.tsx:31`)                                                                                                                                    | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Popover**                                    | `shadow-overlay` (`popover.tsx:163`)                                                                                                                                 | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **HoverCard**                                  | `shadow-overlay` (`hover-card.tsx:216`)                                                                                                                              | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **DropdownMenu**                               | `shadow-overlay` (`dropdown-menu.tsx:91`)                                                                                                                            | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **ContextMenu**                                | `shadow-overlay` (`context-menu.tsx:148`)                                                                                                                            | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Select (listbox)**                           | `shadow-overlay` (`select.tsx:226`)                                                                                                                                  | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Tooltip**                                    | `shadow-overlay` (`tooltip.tsx:164`)                                                                                                                                 | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Sonner (toast)**                             | `shadow-overlay` (`sonner.tsx:108`)                                                                                                                                  | Overlay                      | Matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Command** (palette)                          | _(no direct `shadow-*` in `command.tsx`; it is always composed inside a `Dialog`/`Popover` wrapper in this registry, so it inherits `shadow-overlay` from the host)_ | Overlay (inherited)          | Consistent — but only by composition, not an intrinsic property; a bare `<Command>` used outside Dialog/Popover would render with **no shadow at all**, worth a doc note.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Card**                                       | none                                                                                                                                                                 | Flat                         | Correct per spec — hairline border only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Input / Textarea / Select trigger / Button** | none                                                                                                                                                                 | Flat                         | Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Table / Sidebar**                            | none                                                                                                                                                                 | Flat                         | Correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **ColorPicker swatch check**                   | `shadow-sm` (`color-picker.tsx:212`, on the small `size-4` selected-color check circle)                                                                              | Micro-element, not a surface | **The one hardcoded, non-`shadow-overlay` shadow in the whole registry.** `shadow-sm` is a raw Tailwind utility, not the design system's single elevation token — it's on a tiny checkmark badge sitting on top of a color swatch, arguably justified (needs to read against any swatch color, light or dark, so a hairline border alone might vanish on a same-color swatch) but it is a literal violation of "no multi-tier shadow system; no `shadow-card`" and of the owner's "shadows avoided" mandate. **Border-based alternative:** replace with a 1.5px `border-border` ring plus increasing the icon's own contrast (it already sits on `bg-background`), or keep the shadow but formalize it as a tokenized `shadow-pop` reserved for exactly this "chip floating over arbitrary color" case, with an explicit design-system exception documented. |
| **Field.tsx `shadow-none` resets**             | `field.tsx:200-203` forces `shadow-none` on nested control slots when in inline-edit mode                                                                            | Defensive reset              | Not a violation — this is explicitly stripping any shadow a composed Input/Select/Textarea might carry when embedded inline, reinforcing the flat rule. Good practice, though it also proves those inner components don't carry shadows themselves (nothing to strip), so the reset may be legacy/defensive-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Shadow verdict:** the system is **97% compliant** with "one `shadow-overlay` token, flat elsewhere."
The single outlier is `color-picker.tsx:212`'s `shadow-sm` on the selected-swatch checkmark — small
blast radius, but it is the one spot that needs either a border-only fix or an explicit, named
exception in `design.md` (currently the doc claims zero exceptions).

---

## (d) Per-dimension findings

### 1. Control heights

- Button/Select/Pagination/Toggle agree on `28/32/40`. **Input has no size scale** (`input.tsx:39`)
  — the "one scale for buttons + inputs + selects" claim in `design.md` §Components is not true for
  Input today.
- Button ships an unlisted `xs` (`h-6`/`size-6`) tier (`button.tsx:45,49`) that IconButton mirrors —
  either promote `xs` into the documented scale or remove it; right now it's a real, shipped size with
  zero spec coverage.
- `TableHead` is `h-9` (36px) (`table.tsx:140`), off the 28/32/40 family and undocumented as a 4th
  height.
- Switch's `sm/default/lg` (`16/20/24`) and Button/Select's `sm/default/lg` (`28/32/40`) are two
  unrelated pixel scales sharing the same size-tier _names_ — no bug today, but a naming trap for
  future contributors who might assume `size="sm"` means the same physical height everywhere.

### 2. Radius

- Core usage is disciplined: `rounded-md`(38×) for interactive defaults, `rounded-full`(29×) for
  round/tag objects, `rounded-lg`(23×) for containers, `rounded-sm`(21×) for menu items/nested chips —
  this hierarchy (containers > controls > nested items) is principled and matches
  `design.md`'s nesting intent.
- **`rounded-xl` in `bubble.tsx:155`** — the chat-bubble surface. `--radius-xl` is only defined in the
  shipped theme as `calc(var(--radius-lg) + 0.25rem)` = 16px (`packages/tokens/dist/theme.css:208`),
  a 5th radius step that `design.md` explicitly says was dropped ("Drop the rarely-used
  `xl/2xl/3xl`... Four tokens cover a component library" — `docs/plans/design-token-overhaul.md:288`).
  Bubble is the only component using it. Either fold Bubble onto `rounded-lg` (12px, matching every
  other container) or formally re-admit `xl` as a 5th token for large conversational surfaces.
- **`rounded-xs`** used for the popover/hover-card/tooltip caret triangles (`popover.tsx:221`,
  `hover-card.tsx:260`, `tooltip.tsx:210`). `--radius-xs` is **not defined by the token bridge at
  all** (only `sm/md/lg` are redefined; `xs` falls through to Tailwind's untouched default `0.125rem`
  = 2px) — a fifth, silently-inherited radius value outside the 4-step system. Low visual risk (a
  2px corner on a 10px caret), but it means "only 4 radius tokens exist" is not literally true in the
  shipped CSS.
- `date-picker.tsx:190,301` and `field-inline.tsx:180` and `toggle-group.tsx:165` use `rounded-none`
  deliberately (range-middle cells, borderless inline edit, squared inner joins in a segmented group)
  — all justified, not drift.
- `split-button.tsx:156,172` uses `rounded-r-none`/`rounded-l-none` to fuse two buttons — correct
  compositional use, not a violation.

### 3. Typography

- **No `font-bold` anywhere** in the registry — confirmed via full-text grep. The heaviest weight in
  use is `font-medium` (500); `font-semibold`(600)/`font-bold`(700) do not appear. This actually
  _exceeds_ the written rule ("never 600+") — the codebase never even reaches for 600, only 400/500.
  Good news, and worth calling the "600 heading" language in `docs/plans/design-token-overhaul.md`
  officially superseded (design.md's final 400/500-only rule already reflects this; the plan doc's
  "cap at 500, allow 600 for top-level headings" line is stale).
- **The named type-scale tokens are essentially unused.** Grep counts across all 68 components:
  `text-sm` 76×, `text-xs` 31×, `text-base` 7×, `text-lg` 4×, `text-xl` 2×, `text-2xl` 2×, vs.
  `text-label-sm` 13×, `text-code-sm` 3×, `text-label` 1×, `text-h2` 1×, and **zero** uses of
  `text-display`, `text-h1`, `text-h3`, `text-h4`, `text-code`. The type system that `design.md`
  frames as a first-class deliverable ("Apply the type tokens — never hand-set font-size, line-height,
  or weight") is used by only `page-header.tsx:205` (`text-h2`) in the entire registry; every other
  component reaches for raw Tailwind size utilities instead.
- This isn't cosmetic-only: raw Tailwind sizes are **not** remapped to the design-system scale
  (`packages/tokens/dist/theme.css` only defines `--text-display/h1-h4/label/label-sm/code/code-sm`;
  it does **not** touch `--text-sm/base/lg/xl/2xl`, which keep Tailwind's stock values). So
  `text-base` (7 uses, e.g. `command.tsx:178`, `text-edit.tsx:35`) actually renders **16px**, not the
  spec's 14px "default body" — it silently collides with the _`text-lg`_ token's pixel size instead.
  Meanwhile the dominant `text-sm` (76×) renders 14px/20px-line-height, which is close to but not
  identical to the `text-base` token's 14px/**21px**-line-height (design.md's real default body). Net
  effect: most "body" text in the system is one Tailwind step off from what `design.md` defines as the
  body token, and nobody would catch it by reading class names.
- **Every overlay title hand-rolls the same anti-pattern identically**, rather than using `text-h3`/
  `text-h4`: `dialog.tsx:222`, `alert-dialog.tsx:209`, `sheet.tsx:227` all use
  `"text-base leading-none font-medium tracking-tight text-foreground"` (16px raw, not 14px token);
  `popover.tsx:237` uses the same pattern at `text-sm` (14px) instead of `text-base` — so Dialog/
  AlertDialog/Sheet titles are one size larger than Popover's title despite `design.md` giving no
  different sizing rule for popovers vs dialogs. `card.tsx:94`
  (`'leading-snug font-medium text-base group-data-[size=sm]/card:text-sm'`) repeats the same raw
  16px/14px split for its title. This is a **very consistent inconsistency** — the same 4-part recipe
  (`size + leading-none/snug + font-medium + tracking-tight`) reimplemented by hand five separate
  times instead of once as `text-h4`/`text-label` tokens, with a silent 16-vs-14px split baked in.
- `FilterChip` at the 32px control height uses `text-xs` (12px, `filter-bar.tsx:193`) while every
  other 32px control (Button default, Select default, Pagination default, Tabs trigger) uses `text-sm`
  (14px) — same physical height, different type scale.
- `kbd.tsx:15` and `tooltip.tsx:236` (kbd inside tooltip) both use `font-mono font-medium text-xs` —
  internally consistent mono/label treatment for keyboard shortcuts. Good.
- `markdown-view.tsx` and `text-edit.tsx` mirror each other's heading treatment 1:1 (both cap at
  `font-medium`, both use raw `text-2xl/text-xl/text-lg/text-base/text-sm` rather than
  `text-h1..h4`) — consistent with _each other_ (by design, per their own doc comments), but both are
  equally off the named token scale.

### 4. Spacing

- 4px-scale adherence is good throughout — no arbitrary pixel paddings found outside documented
  `calc()` expressions for portal-safe viewport insets (`max-h-[calc(100dvh-var(--spacing)*8)]` etc.,
  which are intentionally computed off `--spacing`, not hardcoded).
- **Card padding does not match its own spec.** `design.md` prose (§Layout) states "Cards use 20px
  padding (16px compact, 32px hero)," but the component recipe table states
  `card: { padding: 16px }`, and the actual code (`card.tsx:47,49`) ships `py-4`/`px-4` = **16px** as
  the _default_ (not "compact") with a `sm` variant at `py-3`/`px-3` = 12px, and **no 20px or 32px
  variant exists at all**. The doc's own two sections disagree with each other, and the shipped
  component agrees with neither (it has no 20px tier, and its smallest tier is 12px, not the 16px
  "compact" the prose describes).
- Dialog/AlertDialog use `p-5` (20px, `dialog.tsx:30`) matching the _recipe table's_ dialog spec
  (`padding: 20px`) — correct.
- Popover/HoverCard use `p-4` (16px) — smaller than Dialog's 20px, which is a reasonable and probably
  intentional hierarchy (transient overlay < committed modal) but is not written down anywhere as a
  rule, so a future contributor has no way to know popover-padding-must-be-16-while-dialog-is-20 is
  intentional vs. an oversight.
- Menu item padding (`px-2 py-1.5`, i.e. 8px/6px) is **byte-identical** across DropdownMenu
  (`dropdown-menu.tsx:192`), ContextMenu (`context-menu.tsx:234`), and Command
  (`command.tsx:319`) — excellent cross-component consistency, exactly what the mandate asked to
  verify. Select's item (`select.tsx:270`) matches the vertical padding (`py-1.5`) and left inset
  (`pl-2`) but widens the right side to `pr-8` to make room for the checkmark — a justified, not
  arbitrary, deviation.
- Dialog/AlertDialog/Sheet header `gap-1.5` (title-to-description) is consistent across all three
  (`dialog.tsx:186`, `alert-dialog.tsx:164`, `sheet.tsx:191`).

### 5. Focus indicator

See §(b) table above. Summary: one sound global system, one real regression (Bubble's `ring-3`
glow), one thing to double-check (Textarea's `focus:` vs `focus-visible:`/possible missing border
rule), two harmless redundant local redeclarations (Tabs, Alert), and three unrelated non-focus uses
of the `ring-*` utility (Avatar/Bubble gap-cutouts, date-picker "today" marker) that don't violate the
spec but complicate any blanket "remove all rings" sweep.

### 6. Shadows

See §(c) table above. Summary: 10/10 true overlay components correctly use exactly one
`shadow-overlay`; the sole outlier is `color-picker.tsx:212`'s `shadow-sm` on a micro swatch-check
badge.

### 7. Motion

- Durations and easing are highly consistent: `transition-colors`(24×), `duration-fast`(21×),
  `ease-standard`(16×) dominate; `duration-base`(3×) and `duration-relative`(2×) cover the slower
  tiers. No component invents its own duration/easing value outside the token set — this dimension is
  clean.
- `command.tsx:202` uses `transition-[height] duration-fast ease-standard` for the palette-list resize
  — a deliberate, well-scoped custom transition property, not a violation.
- No `animate-bounce`/`animate-pulse`-style ad-hoc Tailwind animation utilities found outside the
  documented shimmer/skeleton/spinner primitives, which is consistent with "most interactions feel
  instant."

### 8. State colors

- Menu highlight state (`data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground`) is
  identical across DropdownMenu, ContextMenu, and Select (`dropdown-menu.tsx:197`,
  `context-menu.tsx:239`, `select.tsx:271`) — excellent consistency.
- Destructive menu-item variant is identical between DropdownMenu and ContextMenu:
  `text-destructive-text ... data-[highlighted]:bg-destructive-subtle data-[highlighted]:text-destructive-text`
  (`dropdown-menu.tsx:199`, `context-menu.tsx:241`) — good, matched 1:1.
- **Button's `destructive` variant does not implement `design.md`'s `button-destructive` recipe.**
  The spec's component table defines `button-destructive: { background: destructive.fill, color:
destructive.foreground }` — i.e. a **solid** red fill with white text, for real danger actions. The
  shipped `Button` component has no such variant: its `destructive` variant is actually the _soft_
  treatment (`bg-destructive-subtle text-destructive-text hover:bg-destructive/20` —
  `button.tsx:26-27`, matching the spec's separate `button-soft` recipe instead), and there is a
  second `destructive-outline` variant (border only, `button.tsx:35-36`). **No variant anywhere in the
  registry produces a solid destructive-fill button.** AlertDialog's own `destructive` intent maps to
  `"destructive-outline"` (`alert-dialog.tsx:247`) — so the system's actual, shipped destructive-action
  language is uniformly "soft/outline," never "solid fill," in every place `destructive` shows up
  (Button, AlertDialogAction, DropdownMenuItem, ContextMenuItem). This is **internally self-consistent**
  (every destructive surface agrees with every other destructive surface) but it is a clean,
  unambiguous **spec violation** against `design.md`'s own written `button-destructive` recipe — either
  the recipe row should be deleted/updated to describe the soft/outline reality, or a genuine solid
  variant needs to be added for the "irreversible, needs to read as dangerous" case the spec
  originally called out.
- Tabs `data-active`, Sidebar `data-active`, DataList `data-selected` all key off `bg-accent`
  (`tabs.tsx:128`, `sidebar.tsx:353` via `data-sidebar-accent`, `data-list.tsx:543`) — same neutral
  hover/select language, consistent with "primary/accent carries selection," though Sidebar routes
  through its own `sidebar-accent` alias rather than the bare `accent` token (intentional per
  `design.md`'s "sidebar is self-contained... reuses main primary/accent/ring" — fine).
- Error/invalid state (`aria-invalid:border-destructive/70` / `data-invalid:border-destructive/70`) is
  applied identically across Button, Input, Textarea, Select, Checkbox, Radio, Switch, Toggle, OTP —
  a genuinely clean, fully-consistent implementation of one rule across 9 components.

### 9. Icon sizing

- `size-4` (16px) is the dominant in-control icon size (65 uses) matching `design.md`'s "default 16"
  icon size; `size-3.5` (14px, 19 uses) matches "inline 14" for compact/`sm`-sized controls; `size-3`
  (9 uses) is smaller than any documented icon-size token (`design.md` icons scale is
  `14/16/20/24` — 12px isn't one of them) and shows up specifically in `xs`-sized Button/IconButton
  variants (`button.tsx:45,49`) — consistent _within_ that undocumented `xs` tier, but the tier itself
  isn't in the spec (see §1).
- **Combobox-trigger chevrons are inconsistent between near-identical components.** `Select` uses a
  single-direction `ChevronDown` (`select.tsx:141,245`); `CountrySelect` and `StateSelect` — which are
  the same "searchable trigger that opens a listbox" pattern — use bidirectional `ChevronsUpDown`
  (`country-select.tsx:322`, `state-select.tsx:1556`). Same UI role, two different icon glyphs; a user
  moving between a plain Select and a Country/State Select sees a different affordance icon for
  identical behavior.
- Chevron sizing itself is not asserted via an explicit `size-*` class in `Select`
  (`<ChevronDown className="size-4" .../>` — explicit) vs. `Breadcrumb`/`Pagination`
  (`<ChevronRight />` with no size class, relying on the button/link's `[&_svg:not([class*='size-'])]:size-4`
  parent selector) — functionally converges on the same 16px, but the _mechanism_ differs
  (explicit vs. inherited), which is fragile if either component's icon is ever moved outside its
  current wrapper.
- Icon `currentColor` discipline holds — no hardcoded icon fill/stroke colors found in the grep pass.

### 10. Dark mode

- No component uses a raw hex/oklch value under a `dark:` variant — every `dark:` override found
  targets a **semantic token** (`dark:bg-input/30`, `dark:hover:bg-muted/50`,
  `dark:hover:bg-destructive/30`, etc.), which is the correct pattern (opacity-modulating a token, not
  inventing a new color).
- **But the pattern itself is inconsistently scoped.** `dark:bg-input/30` (a translucent dark-mode
  tint layered _on top of_ the already-dark-aware `input`/`secondary` token) is applied to Input,
  Textarea, Select, Checkbox, Radio, OTP — i.e. every form control — but **not** to Card, Popover,
  Dialog, or Sheet, which share the same bordered-surface visual language but get no such tint. Since
  `background`/`card`/`secondary`/`input` already have distinct, authored dark values (per
  `design.md`'s "dark is co-primary, not derived" ramp), this extra per-component `dark:bg-x/30` layer
  is an ad-hoc visual adjustment on top of tokens that should already be dark-correct on their own —
  worth a design decision on whether form controls genuinely need an _additional_ dark treatment other
  surfaces don't, or whether this is leftover from an earlier (pre-"dark is co-primary") token
  generation.
- Button's status-color variants (`destructive`/`success`/`warning`/`info`) each carry their own
  `dark:hover:bg-{family}/30` (`button.tsx:27,29,31,32`) alongside a light-mode `hover:bg-{family}/20`
  — this pair is at least internally consistent (every status family gets the same `/20` light,
  `/30` dark treatment), so it's a deliberate, uniform pattern rather than random drift.
- Bubble's additional `dark:` hits (`bubble.tsx:57,60,63`) confirmed token-only on direct read:
  `dark:[&>...]:bg-input/30`, `dark:[&>...]:bg-muted/50`, `dark:*:bg-destructive/20`,
  `dark:[&>...]:bg-destructive/30` — all opacity-modulated semantic tokens, no raw colors. Clean.

---

## (e) Spec violations (design.md says X, component does Y)

1. **Card padding.** Spec (prose, §Layout): "Cards use 20px padding (16px compact, 32px hero)." Spec
   (recipe table, §Components): `card: { padding: 16px }`. Component (`card.tsx:47,49`): default
   `16px`, `sm` variant `12px`, no `20px`/`32px` tier exists. Three-way disagreement — the doc
   disagrees with itself, and the code matches neither reading.
2. **Button destructive.** Spec (recipe table): `button-destructive: { background: destructive.fill,
color: destructive.foreground }` (solid). Component (`button.tsx:26-27`): `destructive` variant is
   the soft/subtle treatment; no solid-fill destructive variant exists anywhere in the registry.
3. **Radius scale.** Spec: "Four tokens... `sm/md/lg/full`" (design.md §Shapes, and explicitly "the
   rarely-used xl/2xl/3xl" were dropped per `docs/plans/design-token-overhaul.md:288`). Shipped theme
   (`packages/tokens/dist/theme.css:208`) still defines `--radius-xl`, and `bubble.tsx:155` uses it.
   `--radius-xs` (2px, undeclared/inherited from Tailwind defaults) is used by three overlay carets.
4. **Typography tokens.** Spec: "Apply the type tokens — never hand-set font-size, line-height, or
   weight." Reality: 67 of 68 components hand-set raw Tailwind size utilities; only `page-header.tsx`
   uses a named token (`text-h2`). `text-base` (raw, 16px) is used where the spec's own `text-base`
   token means 14px, producing a silent size mismatch wherever it's used (`command.tsx:178`,
   `text-edit.tsx:35`).
5. **Focus — Bubble.** Spec: "Never a colour or a glow" for focus. `bubble.tsx:155`:
   `focus-visible:ring-3 focus-visible:ring-ring/30` is exactly that — a translucent colored glow ring.
6. **Chevron icon identity.** Not a written rule violation per se, but breaks "same UI role, same
   treatment" — `Select` (`ChevronDown`) vs. `CountrySelect`/`StateSelect` (`ChevronsUpDown`) for
   functionally identical trigger affordances.
7. **Shadow purity.** Spec: "one shadow token; no multi-tier shadow system." `color-picker.tsx:212`
   ships a second, raw `shadow-sm`.

---

## (f) Proposed canonical scales where drift exists

- **Input needs a real `size` prop** mirroring Button/Select (`sm 28 / default 32 / lg 40`,
  padding-x 12 at every tier per the spec) so the "one scale" claim becomes true for all three form
  primitives, not two of three.
- **Formally adopt or kill the `xs` control tier.** Either add `xs`/`icon-xs` to `design.md`'s control-
  height table (documenting `h-6`/24px, `size-3` icons, `text-xs` label) since it's already shipped
  and used, or fold Button/IconButton's `xs` variant into `sm` and delete it.
- **Give Table a documented height token** — either accept `h-9`/36px as a deliberate 5th, table-only
  height and write it into `design.md`, or move `TableHead` onto the `sm` (28) or `md` (32) tier for
  literal consistency with every other control.
- **Typography: pick one direction and enforce it.** Either (a) remap Tailwind's raw
  `text-xs/sm/base/lg/xl/2xl` in the theme bridge to the design-system's actual pixel/line-height/
  weight values (so the 76+31+7+4+2+2 = 122 raw-class call sites become correct "for free" without
  touching component source), or (b) run the Phase-2 sweep that `docs/plans/design-token-overhaul.md`
  §4 already scoped (mechanical `text-sm→text-base`, `text-xs→text-small`/`text-label-sm`, heading
  sizes → `text-h1..h4`) but which was apparently never executed against the current component set.
  Given 122 call sites across nearly every component, (a) is far cheaper and lower-risk; (b) is more
  correct long-term (self-documenting class names) but is the true "Phase 2" scope that this audit's
  grep shows has not shipped.
- **Radius: retire `--radius-xl` from the shipped theme** (or explicitly re-admit a 5th "xl / 16px"
  token for large conversational surfaces like Bubble, if that's the real intent) — right now the
  theme ships a token the design doc says was deleted. Define `--radius-xs` explicitly (2px) if the
  overlay-caret pattern is to remain, rather than silently inheriting Tailwind's stock value.
- **Destructive button: add the missing solid-fill variant** (`bg-destructive text-destructive-
foreground hover:bg-destructive-hover active:bg-destructive-active`, per the spec's own recipe) for
  genuinely irreversible actions, and either rename the current `destructive` variant to make its
  softness explicit (e.g. keep `destructive-outline` + add `destructive-soft` as the current
  behavior's real name) or update `design.md` to describe soft/outline as the intended destructive
  language and delete the unused solid recipe row.
- **Focus: fix Bubble** to use the same border-darken (no ring/glow) pattern every other interactive
  element uses; audit Textarea's `focus:`/`focus-visible:` binding directly (flagged, not yet
  confirmed) to make sure it isn't silently missing the border-darken visible-focus cue text inputs
  are supposed to have.
- **Chevron icon unification:** standardize all "opens a listbox/combobox" triggers (Select,
  CountrySelect, StateSelect) on one icon — either all `ChevronDown` (matches plain Select, matches
  most single-select mental models) or all `ChevronsUpDown` (matches the searchable-combobox pattern);
  don't split by component.
