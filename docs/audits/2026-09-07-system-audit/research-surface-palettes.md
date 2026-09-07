# Research: neutral surface + interaction-state palettes in four reference systems

**Date:** 2026-09-07 · **Scope:** facts only, no recommendation. Collected for the surface-token
decision in the 2026-09-07 system audit (today `secondary`, `muted`, and `accent` all resolve to
light `oklch(0.97 0.003 75)` / dark `oklch(0.269 0.003 75)`; `background` 0.994 / 0.175; `card`
0.985 / 0.205; `popover` 0.994 / 0.205; `border` 0.922 / 0.269; `primary` 0.353 / 0.922).

**Method.** Every value below was read from a public document or a public stylesheet on
2026-09-07. Where a system publishes a documented colours page, that is cited; where the only
public source is the compiled CSS of the marketing site, the stylesheet URL is cited and the
selector quoted. The "L" column is OKLCH lightness computed from the published hex (sRGB → OKLab,
rounded to 3 dp) so the four systems and VegaStack's tokens can be read on one axis — it is a
derived number, not a published one. "not public" means it could not be found on a public page.

---

## 1. Vercel Geist

**Sources.**

- G1 — https://vercel.com/geist/colors (documented step semantics; the page renders values from
  CSS, so the numbers below come from G2).
- G2 — the page's stylesheet, `https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/0ggp-66pwlt2m.css`
  (hashed chunk referenced by G1 on 2026-09-07; selectors quoted so it can be re-located after the
  hash rotates).
- G3 — https://vercel.com/geist/materials (surface/elevation levels).
- G4 — https://vercel.com/design.md (brand guidance; principle only).

### 1.1 Roles and values

Geist has a **10-step neutral scale with fixed semantic slots** plus two dedicated
background tokens that sit _outside_ the scale. G1's step descriptions, verbatim:

| Step                  | G1 description                              | Light (G2 `:root,.light-theme`) | L     | Dark (G2 `.dark,.dark-theme,.invert-theme`) | L     |
| --------------------- | ------------------------------------------- | ------------------------------- | ----- | ------------------------------------------- | ----- |
| `--ds-background-100` | "Default element background" (Background 1) | `#fff`                          | 1.000 | `#000`                                      | 0.000 |
| `--ds-background-200` | "Secondary background" (Background 2)       | `#fafafa`                       | 0.985 | `#000`                                      | 0.000 |
| `--ds-gray-100`       | "Default background"                        | `#f2f2f2`                       | 0.961 | `#1a1a1a`                                   | 0.218 |
| `--ds-gray-200`       | "Hover background"                          | `#ebebeb`                       | 0.940 | `#1f1f1f`                                   | 0.239 |
| `--ds-gray-300`       | "Active background"                         | `#e6e6e6`                       | 0.925 | `#292929`                                   | 0.281 |
| `--ds-gray-400`       | "Default border"                            | `#eaeaea`                       | 0.937 | `#2e2e2e`                                   | 0.301 |
| `--ds-gray-500`       | "Hover border"                              | `#c9c9c9`                       | 0.836 | `#454545`                                   | 0.390 |
| `--ds-gray-600`       | "Active border"                             | `#a8a8a8`                       | 0.732 | `#878787`                                   | 0.623 |
| `--ds-gray-700`       | "High contrast background"                  | `#8f8f8f`                       | —     | `#8f8f8f`                                   | —     |
| `--ds-gray-800`       | "Hover high contrast background"            | `#7d7d7d`                       | —     | `#7d7d7d`                                   | —     |
| `--ds-gray-900`       | "Secondary text and icons"                  | `#4d4d4d`                       | —     | `#a0a0a0`                                   | —     |
| `--ds-gray-1000`      | "Primary text and icons"                    | `#171717`                       | 0.205 | `#ededed`                                   | 0.946 |

Alpha companions (G2), used for hover fills and borders over arbitrary backgrounds:

| Token                 | Light             | Dark              |
| --------------------- | ----------------- | ----------------- |
| `--ds-gray-alpha-100` | `#0000000d` (5%)  | `#ffffff12` (7%)  |
| `--ds-gray-alpha-200` | `#00000015` (8%)  | `#ffffff17` (9%)  |
| `--ds-gray-alpha-300` | `#0000001a` (10%) | `#ffffff21` (13%) |
| `--ds-gray-alpha-400` | `#00000014` (8%)  | `#ffffff24` (14%) |
| `--ds-gray-alpha-500` | `#00000036` (21%) | `#ffffff3d` (24%) |
| `--ds-gray-alpha-600` | `#0000003d` (24%) | `#ffffff82` (51%) |

Note the light scale is **not monotonic**: gray-400 (`#eaeaea`, the default border) is _lighter_
than gray-300 (`#e6e6e6`, the active background). Background and border are two families that
happen to share one numbering.

### 1.2 Rules (as documented or as compiled)

- **Page vs. secondary background.** G1: Background 1 is the default; Background 2 is "used
  sparingly for differentiation". In dark mode **both are `#000`** — the light-mode 1.000 / 0.985
  distinction collapses to zero in dark (G2).
- **Cards, menus, modals, tooltips are all Background 1 + a 1px shadow-border; no lifted step.**
  G2, every material class: `.material-base{background-color:var(--ds-background-100);box-shadow:var(--ds-shadow-border)}`,
  `.material-menu{…var(--ds-background-100);box-shadow:var(--ds-shadow-menu)}`, `.material-modal`,
  `.material-tooltip`, `.material-small/medium/large/fullscreen` — all `--ds-background-100`.
  Elevation is carried by `--ds-shadow-*` only; the border layer is
  `--ds-shadow-border-base: 0 0 0 1px #00000014` (light) / `0 0 0 1px #ffffff25` (dark), and every
  material stacks `--ds-shadow-background-border: 0 0 0 1px var(--ds-background-200)` outside it.
  G3 names the levels (`base`, `small`, `medium`, `large`, `tooltip`, `menu`, `modal`,
  `fullscreen`) as "Everyday use / Slightly raised / Further raised / Lift from page / Further
  lift / Biggest lift".
- **Hover is a fill, one step up on the _same_ family:** G1 slots gray-200 as "Hover background"
  and gray-300 as "Active background"; G2 confirms the compiled utilities `.hover\:bg-gray-200`,
  `.active\:bg-gray-300`, and also `.hover\:bg-gray-alpha-100` / `.hover\:bg-gray-alpha-200`
  (alpha hover over non-page surfaces).
- **Borders hover by border, not fill:** G1 gray-400 → gray-500 → gray-600 for default / hover /
  active border; G2 `.hover\:border-\[var\(--ds-gray-alpha-500\)\]`,
  `.hover\:border-gray-alpha-600`.
- **Selected / highlighted:** G2 `[aria-selected=true]{background-color:var(--ds-gray-300)}`
  (solid, = "Active background") and `[data-selected]`, `[data-highlighted]` →
  `var(--ds-gray-alpha-100)` (menus and comboboxes use the _alpha-100_ highlight, one step
  lighter than hover-200).
- **Inputs:** compiled input wrappers use `0 0 0 1px var(--ds-gray-alpha-400)` as the border
  (`--themed-border, var(--ds-gray-alpha-400)`), hover swaps to `--ds-gray-alpha-200`
  (`[data-hover]{--themed-border:var(--ds-gray-alpha-200)}`), and the global reset sets
  `input{background-color:#0000}` — i.e. inputs are **transparent on Background 1**. Disabled input
  regions fill `var(--ds-gray-100)` (`:has(input:disabled)>… {background-color:var(--ds-gray-100)}`).
  The Input docs page itself publishes no token names (https://vercel.com/geist/input).
- **Dark mode layering:** page `#000`, secondary background `#000`, gray-100 `#1a1a1a` is the first
  visible fill. Dark surfaces therefore do _not_ get lighter with elevation — elevation is shadow +
  a 25%-white hairline (`#ffffff25`) on the same black.
- **Secondary vs. muted vs. hover:** three distinct families — `background-200` (secondary page
  region), `gray-100` (component fill at rest), `gray-200/300` (hover / active). Geist does not
  collapse them; the _dark_ theme does collapse background-100 and background-200.
- G4 principle: "Design in monochrome. Use color only when it adds significant meaning to state,
  action, or data, and pair it with a non-color cue." No values on that page.

---

## 2. Radix Colors (12-step scale) and shadcn/ui's token mapping

### 2.1 Radix Colors — the scale semantics

**Source R1** — https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
(table verbatim); **R2** — `https://raw.githubusercontent.com/radix-ui/colors/main/src/light.ts`
and **R3** — `…/src/dark.ts` (gray values).

| Step | R1 use case                             | Light `gray` (R2) | L     | Dark `gray` (R3) | L     | Light `grayA` | Dark `grayA` |
| ---- | --------------------------------------- | ----------------- | ----- | ---------------- | ----- | ------------- | ------------ |
| 1    | App background                          | `#fcfcfc`         | 0.991 | `#111111`        | 0.178 | `#00000003`   | `#00000000`  |
| 2    | Subtle background                       | `#f9f9f9`         | 0.982 | `#191919`        | 0.213 | `#00000006`   | `#ffffff09`  |
| 3    | UI element background                   | `#f0f0f0`         | 0.955 | `#222222`        | 0.252 | `#0000000f`   | `#ffffff12`  |
| 4    | Hovered UI element background           | `#e8e8e8`         | 0.931 | `#2a2a2a`        | 0.285 | `#00000017`   | `#ffffff1b`  |
| 5    | Active / Selected UI element background | `#e0e0e0`         | 0.907 | `#313131`        | 0.313 | `#0000001f`   | `#ffffff22`  |
| 6    | Subtle borders and separators           | `#d9d9d9`         | 0.885 | `#3a3a3a`        | 0.348 | `#00000026`   | `#ffffff2c`  |
| 7    | UI element border and focus rings       | `#cecece`         | 0.851 | `#484848`        | 0.402 | `#00000031`   | `#ffffff3b`  |
| 8    | Hovered UI element border               | `#bbbbbb`         | 0.792 | `#606060`        | 0.489 | `#00000044`   | `#ffffff55`  |
| 9    | Solid backgrounds                       | `#8d8d8d`         | —     | `#6e6e6e`        | —     | `#00000072`   | `#ffffff64`  |
| 10   | Hovered solid backgrounds               | `#838383`         | —     | `#7b7b7b`        | —     | `#0000007c`   | `#ffffff72`  |
| 11   | Low-contrast text                       | `#646464`         | —     | `#b4b4b4`        | —     | `#0000009b`   | `#ffffffaf`  |
| 12   | High-contrast text                      | `#202020`         | 0.244 | `#eeeeee`        | 0.949 | `#000000df`   | `#ffffffed`  |

R1 guidance, verbatim: steps 1–2 are for "app backgrounds and subtle component backgrounds"
(examples given: main app background, card background, sidebar background); "Step 3 is for
normal states. Step 4 is for hover states. Step 5 is for pressed or selected states."; step 6 for
"subtle borders on components which are not interactive", step 7 for "subtle borders on
interactive components", "Step 8 is designed for stronger borders on interactive components and
focus rings."

**Rules encoded by the scale itself.** Hover and pressed/selected are _fills_, each exactly one
step darker (light) / lighter (dark) than the rest fill; borders have their own three steps and
hover by stepping the border, not the fill. Card and app background are _adjacent_ steps 1 and 2.
In dark mode every step is lighter than the one below it, so a step-2 card on a step-1 page is a
lifted surface by definition.

### 2.2 Radix Themes — how the steps are actually wired to surface roles

**Source R4** — `https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/styles/tokens/color.css`:

```css
:where(.radix-themes) {
  /* light */
  --color-background: white;
  --color-panel-solid: white;
  --color-panel-translucent: rgba(255, 255, 255, 0.7);
  --color-surface: rgba(255, 255, 255, 0.85);
  --color-overlay: var(--black-a6);
}
:is(.dark, .dark-theme) … {
  /* dark */
  --color-background: var(--gray-1);
  --color-panel-solid: var(--gray-2);
  --color-panel-translucent: var(--gray-a2);
  --color-surface: rgba(0, 0, 0, 0.25);
  --color-overlay: var(--black-a8);
}
```

So in Radix Themes: **light — page, panel (card/menu) and form surface are all white** (panel
separated by border/shadow only); **dark — page is gray-1, panel is gray-2 (one step lighter),
form surface is a 25 % black _darkening_ over whatever it sits on** (inputs read as sunken).
Component CSS (R5 `…/src/components/_internal/base-button.css`, R6 `…/_internal/base-card.css`,
R7 `…/components/text-field.css`, R8 `…/_internal/base-menu.css`):

| Component / variant      | Rest                                  | Hover                                                   | Active / pressed                         | Disabled                          |
| ------------------------ | ------------------------------------- | ------------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| Button `soft` (R5)       | `accent-a3`                           | `accent-a4`                                             | `accent-a5`                              | `gray-a3`                         |
| Button `ghost` (R5)      | none                                  | `accent-a3`                                             | `accent-a4`                              | transparent                       |
| Button `outline` (R5)    | `inset 0 0 0 1px accent-a8`           | fill `accent-a2`                                        | fill `accent-a3`                         | border `gray-a7`                  |
| Button `surface` (R5)    | `accent-surface` + border `accent-a7` | border → `accent-a8` (border change, not fill)          | fill `accent-a3`                         | `gray-a2` + border `gray-a6`      |
| Button `solid` (R5)      | `accent-9`                            | `accent-10`                                             | `accent-10`                              | `gray-a3`                         |
| Card `surface` (R6)      | `--color-panel` + `0 0 0 1px gray-a5` | border → `gray-a7`                                      | border → `gray-a6`                       | —                                 |
| Card `ghost` (R6)        | none                                  | fill `gray-a3`                                          | fill `gray-a4`                           | —                                 |
| TextField `surface` (R7) | `--color-surface` + `inset … gray-a7` | —                                                       | focus: `focus-a2` tint + `focus-a5` ring | `gray-a2` tint + `gray-a6` border |
| TextField `soft` (R7)    | fill `accent-a3`                      | —                                                       | focus ring `accent-a5`                   | fill `gray-a3`                    |
| Menu panel (R8)          | `--color-panel-solid`                 | item highlight `soft`: `accent-a4`; `solid`: `accent-9` | —                                        | —                                 |

Reading: for _gray-tinted_ interactive surfaces Radix uses **a3 rest → a4 hover → a5 pressed**
(alpha steps, so they composite on any panel); _cards_ hover by **border** (a5 → a7), never by
fill; _inputs_ sit on `--color-surface`, distinct from both page and panel.

### 2.3 shadcn/ui — the token mapping

**Source S1** — https://ui.shadcn.com/docs/theming (current v4 docs, default "neutral" theme in
OKLCH; token descriptions verbatim). **S2** — the pre-v4 theming page,
`https://raw.githubusercontent.com/shadcn-ui/ui/shadcn%402.3.0/apps/www/content/docs/theming.mdx`
(older, more component-specific descriptions). **S3** —
`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/{button,input,card,dropdown-menu,tabs}.tsx`.

| Token            | Light (S1)         | L     | Dark (S1)            | L     | S1 "what it controls" / "used by"                                                                                    | S2 (older) description                                                               |
| ---------------- | ------------------ | ----- | -------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `background`     | `oklch(1 0 0)`     | 1.000 | `oklch(0.145 0 0)`   | 0.145 | "The default app background and text color" — page shell                                                             | "Default background color of `<body />`"                                             |
| `card`           | `oklch(1 0 0)`     | 1.000 | `oklch(0.205 0 0)`   | 0.205 | "Elevated surfaces" — Card, dashboard panels                                                                         | "Background color for `<Card />`"                                                    |
| `popover`        | `oklch(1 0 0)`     | 1.000 | `oklch(0.205 0 0)`   | 0.205 | "Floating surfaces" — Popover, DropdownMenu, ContextMenu                                                             | "Background color for popovers such as DropdownMenu, HoverCard, Popover"             |
| `primary`        | `oklch(0.205 0 0)` | 0.205 | `oklch(0.922 0 0)`   | 0.922 | "High-emphasis actions and brand surfaces"                                                                           | "Primary colors for `<Button />`"                                                    |
| `secondary`      | `oklch(0.97 0 0)`  | 0.970 | `oklch(0.269 0 0)`   | 0.269 | "Lower-emphasis filled actions and supporting surfaces" — secondary buttons, secondary badges                        | "Secondary colors for `<Button />`"                                                  |
| `muted`          | `oklch(0.97 0 0)`  | 0.970 | `oklch(0.269 0 0)`   | 0.269 | "Subtle surfaces and lower-emphasis content" — descriptions, placeholders, empty states, subdued surfaces            | "Muted backgrounds such as `<TabsList />`, `<Skeleton />` and `<Switch />`"          |
| `accent`         | `oklch(0.97 0 0)`  | 0.970 | `oklch(0.269 0 0)`   | 0.269 | "Interactive hover, focus, and active surfaces" — ghost buttons, menu highlight states, hovered rows, selected items | "Used for accents such as hover effects on `<DropdownMenuItem>`, `<SelectItem>`…etc" |
| `border`         | `oklch(0.922 0 0)` | 0.922 | `oklch(1 0 0 / 10%)` | alpha | "Default borders and separators"                                                                                     | "Default border color"                                                               |
| `input`          | `oklch(0.922 0 0)` | 0.922 | `oklch(1 0 0 / 15%)` | alpha | "Form control borders and input surface treatment"                                                                   | "Border color for inputs such as Input, Select, Textarea"                            |
| `sidebar`        | `oklch(0.985 0 0)` | 0.985 | `oklch(0.205 0 0)`   | 0.205 | "The base sidebar surface"                                                                                           | —                                                                                    |
| `sidebar-accent` | (see S1)           |       |                      |       | "Hover and selected states inside the sidebar"                                                                       | —                                                                                    |

**shadcn's own default ships `secondary` = `muted` = `accent`** (identical values in both modes,
S1) — the three names are distinguished by _intent_ in the docs, not by value. This is the
mapping VegaStack inherited. S1's newer `customization.md` additionally lists a
`--surface / --surface-foreground` pair described as "Secondary surface" (no default value on
the page).

Component-level rules (S3, verbatim class fragments):

- `Card`: `"… rounded-xl border bg-card … shadow-sm"` — light: same colour as page, border-only
  separation; dark: card 0.205 on page 0.145, lifted one shade.
- `Input`: `"… border border-input bg-transparent … dark:bg-input/30"` — light **transparent**
  with a border; dark gets a 30 % `input`-tinted fill (a 4.5 % white wash over the page).
- `Button` `outline`: `"border bg-background … hover:bg-accent … dark:border-input dark:bg-input/30 dark:hover:bg-input/50"`
  — hover is a **fill** to `accent` in light; in dark the fill goes 30 % → 50 % of `input`.
- `Button` `secondary`: `"bg-secondary … hover:bg-secondary/80"` — hover by **opacity**, no second
  token. `ghost`: `"hover:bg-accent … dark:hover:bg-accent/50"`.
- `DropdownMenuItem`: `"focus:bg-accent focus:text-accent-foreground"`; `DropdownMenuContent`:
  `"border bg-popover"`.
- `TabsList` default variant: `"bg-muted"`.

Selected state has no dedicated token: S1 maps "selected items" to `accent` and "selected
states" to `primary`, depending on the component.

---

## 3. Linear

**Sources.** Linear publishes no token documentation; the values are read from the compiled
stylesheets of https://linear.app (fetched 2026-09-07). Theme blocks live in
`https://static.linear.app/web/_next/static/css/index.DF8NERDv.css` (L1); button rules in
`…/Button.dcAi4KbO.css` (L2); header/dropdown rules in `…/Header.52ZtgjCi.css` (L3); mention
dropdown / composer in `…/SlackIssue.tG1BN7t9.css` (L4). Hashes rotate; selectors are quoted so
the rules can be re-found. The marketing site runs three themes: `[data-theme=light]`,
`[data-theme=dark]`, and `[data-theme=glass]` (a translucent dark variant).

### 3.1 Roles and values (L1)

Linear carries **two overlapping neutral families** in the same theme block — an older
`bg-primary…quinary` / `border-*` / `text-*` set and a newer `bg-level-0…3` / `line-*` / `fg-*`
"ladder". Both are live.

| Role                                    | Variable                                | Light                                       | L     | Dark                                  | L     | Glass (dark, translucent) |
| --------------------------------------- | --------------------------------------- | ------------------------------------------- | ----- | ------------------------------------- | ----- | ------------------------- |
| App background                          | `--color-bg-primary`                    | `#fff`                                      | 1.000 | `#08090a`                             | 0.139 | `#000212`                 |
| Marketing canvas                        | `--color-bg-marketing`                  | —                                           |       | `#010102`                             | 0.069 | —                         |
| Secondary / subtle                      | `--color-bg-secondary`                  | `#f9f8f9`                                   | 0.980 | `#1c1c1f`                             | 0.228 | `#ffffff08`               |
| Tertiary (hover fill)                   | `--color-bg-tertiary`                   | `#f4f2f4`                                   | 0.963 | `#232326`                             | 0.257 | `#ffffff12`               |
| Quaternary (hover/press)                | `--color-bg-quaternary`                 | `#eeedef`                                   | 0.947 | `#28282c`                             | 0.278 | `#ffffff26`               |
| Quinary (pressed)                       | `--color-bg-quinary`                    | `#e9e8ea`                                   | 0.932 | `#282828`                             | 0.277 | `#fff3`                   |
| Translucent wash                        | `--color-bg-translucent`                | `#00000005`                                 |       | `#ffffff0d`                           |       | —                         |
| Panel (card/dialog/drawer)              | `--color-bg-panel`                      | not defined in light block                  |       | `#0f1011`                             | 0.172 | —                         |
| Ladder level 0 (page)                   | `--color-bg-level-0`                    | `#fff`                                      | 1.000 | `#08090a`                             | 0.139 | same as dark              |
| Ladder level 1 (panel)                  | `--color-bg-level-1`                    | `#f8f8f8`                                   | 0.979 | `#0f1011`                             | 0.172 | same                      |
| Ladder level 2                          | `--color-bg-level-2`                    | `#f4f4f4`                                   | 0.967 | `#141516`                             | 0.195 | same                      |
| Ladder level 3 (hover/selected/sub-nav) | `--color-bg-level-3`                    | `#f0f0f0`                                   | 0.955 | `#191a1b`                             | 0.217 | same                      |
| Tint                                    | `--color-bg-tint`                       | `#f4f4f5`                                   |       | `#141516`                             |       | same                      |
| Border primary (hairline)               | `--color-border-primary`                | `#e9e8ea`                                   | 0.932 | `#23252a`                             | 0.264 | `#ffffff14`               |
| Border secondary                        | `--color-border-secondary`              | `#e4e2e4`                                   | 0.915 | `#34343a`                             | 0.327 | `#ffffff1f`               |
| Border tertiary                         | `--color-border-tertiary`               | `#dcdbdd`                                   | 0.893 | `#3e3e44`                             | 0.366 | `#ffffff26`               |
| Border translucent / strong             | `--color-border-translucent(-strong)`   | `#0000000d` / `#00000014`                   |       | `#ffffff0d` / `#ffffff14`             |       | —                         |
| Line primary (ladder)                   | `--color-line-primary`                  | `#d4d4d6`                                   | 0.871 | `#37393a`                             | 0.343 | —                         |
| Line secondary / tertiary / quaternary  | `--color-line-*`                        | `#eaeaeb` / `#f0f0f0` / `#f4f4f4`           |       | `#202122` / `#18191a` / `#141515`     |       | —                         |
| Text primary                            | `--color-text-primary`                  | `#282a30`                                   |       | `#f7f8f8`                             |       | `#f7f8f8`                 |
| Text tertiary / quaternary              | `--color-text-tertiary` / `-quaternary` | `#6f6e77` / `#86848d`                       |       | `#8a8f98` / `#62666d`                 |       | `#b4bcd099` / `#b4bcd066` |
| Brand                                   | `--color-brand-bg`                      | `#7070ff`                                   |       | `#5e6ad2`                             |       | `#5e6ad2`                 |
| Accent hover                            | `--color-accent-hover`                  | `#8989f0`                                   |       | `#828fff`                             |       | —                         |
| Selection                               | `--color-selection-bg`                  | `color-mix(in lch, brand, transparent 64%)` |       | `color-mix(in lch, brand, black 10%)` |       | `…transparent 30%`        |

Observations on the numbers: dark `bg-secondary` (`#1c1c1f`, L 0.228) is **lighter than every
ladder level** (level-3 is L 0.217) — the two families are not interleaved on one axis. The dark
ladder's four steps span only L 0.139 → 0.217 (≈0.026 per step); the light ladder spans
1.000 → 0.955 (≈0.015 per step).

### 3.2 Rules (compiled CSS)

- **Panels / cards are a lifted step with a hairline border, no shadow.** L3
  `.MwJdiW_panel{background:var(--color-bg-level-1);box-shadow:inset 0 0 0 1px var(--color-border-primary)}`;
  L4 `.qM9FAa_mentionDropdown{background:var(--color-bg-level-1);border:1px solid var(--color-border-primary);box-shadow:var(--shadow-high)}`;
  L1 `.xkjYBq_drawer`, `.UBZV-G_dialog` → `background:var(--color-bg-panel);border:1px solid var(--color-border-translucent)`.
  Product cards stack a white wash over the panel:
  `.OPfogq_card{border:var(--border-hairline) solid var(--color-border-translucent-strong);background:linear-gradient(#ffffff03,#ffffff03),var(--color-bg-panel)}`
  (also `#ffffff05`, `#ffffff08`, `#ffffff0a` variants on other cards) — sub-4 % white washes are
  how Linear makes one more layer without a new token.
- **Hover is a fill, two steps up the old family, or level-3 on the ladder.** L2 button variants:
  `variant-secondary … :hover{background:var(--color-bg-level-3)}`,
  `variant-tertiary … :hover{border-color:var(--color-bg-tertiary);background:var(--color-bg-tertiary)}`,
  `variant-ghost … :hover{background:var(--color-bg-quaternary)}`,
  `variant-border:hover{border-color:var(--color-bg-tertiary);background:var(--color-bg-tertiary)}`.
  Menus: L3 `.TZTsQG_dropdownItem:hover{background:var(--color-bg-quaternary)}`,
  `.TZTsQG_dropdownHighlight:hover{background:var(--color-bg-level-3)}`; L4
  `.qM9FAa_mentionOption[data-highlighted], …:hover{background:var(--color-bg-tertiary)}`. Select
  trigger `.m-yS4G_trigger:hover{background:var(--color-bg-tertiary)}`.
- **Pressed is one more step than hover, plus a scale:** L2
  `variant-tertiary:active{background:var(--color-bg-quaternary);transform:scale(.97)}`,
  `variant-ghost:active{background:var(--color-bg-quinary);transform:scale(.97)}`;
  `variant-secondary:active` stays on `level-3` (hover and active share the step).
- **Selected = the same step as hover, painted as a pseudo-element:** L1
  `:is(.wOrUyW_item,.wOrUyW_hit)[aria-selected=true]:after{background:var(--color-bg-level-3);inset:2px 0;border-radius:8px}`;
  `.tEYzwG_row[data-active=true]{background:#ffffff08}`.
- **Rest-state secondary button is translucent in dark, page-white with a ring in light:** L2
  `variant-secondary{background:var(--color-bg-translucent);backdrop-filter:blur(4px);box-shadow:inset 0 0 0 1px #ffffff08,inset 0 1px #ffffff0a,0 0 0 1px #0009,0 4px 4px #0000001a}` and
  `[data-theme=light] .variant-secondary{background:var(--color-bg-primary);box-shadow:0 0 0 1px #00000014,var(--shadow-low)}`.
  `variant-tertiary{border:1px solid var(--color-bg-secondary);background:var(--color-bg-primary)}`
  — a tertiary button's _border_ is the secondary _background_ token.
- **Inputs are transparent:** L1 `.wOrUyW_input{background:0 0;border:none}`;
  `.hCgVwa_reset-input{background:0 0;border:none}`; the chat composer is
  `linear-gradient(#ffffff08,#ffffff08),var(--color-bg-panel)` with a `border-translucent-strong`
  hairline (L4 `.xd368q_composer`). Placeholder = `--color-text-quaternary`.
- **Focus** is an outline, never a fill: `outline:2px solid var(--color-accent);outline-offset:2px`
  (L1, several selectors); `--focus-ring-color:#0006` in light.
- **Dark layering: lighter = higher** on both families (level-0 0.139 → level-3 0.217; primary
  0.139 → quinary 0.277). Light layering: darker = higher (1.000 → 0.955). The `glass` theme
  replaces every step above the page with a white alpha (`#ffffff08 / 12 / 26 / 33`) so the same
  ladder composites over imagery.
- **Disabled** — no colour rule found in the fetched chunks (buttons use `:not([disabled])` guards
  on hover/active only). Not public beyond that.
- **Secondary vs. muted vs. hover:** Linear keeps **separate** tokens for the subtle page region
  (`bg-secondary` / `level-1`), the panel (`bg-panel`), and the hover step (`bg-tertiary` /
  `level-3`), and the hover step is _also_ the selected step. It does not collapse them.

---

## 4. Raycast

**Sources.** Raycast publishes neither a web design-token page nor product CSS. Two public
surfaces exist: the compiled stylesheets of https://www.raycast.com (dark-only, fetched
2026-09-07 — `https://www.raycast.com/_next/static/immutable/chunks/3kx5useibgx0u.css` (Y1) holds
the `:root` block; `…/05x2280ggw--1.css` (Y2) the Input; `…/3vd0w84w7zy93.css` (Y3) card hovers),
and the **product theme JSON schema** (Y4 — the ray-so Theme Explorer repository,
`https://github.com/raycast/ray-so`, `app/(navigation)/themes/themes/**.json`; Y5 — the manual,
https://manual.raycast.com/themes.md). No light-mode values exist for the website (`grep` for
`prefers-color-scheme:light`, `data-theme=light`, `.light` across all seven chunks: 0 matches).

### 4.1 Website roles and values (Y1, `:root`)

| Role                                   | Variable                                         | Dark value                                                                                                   | L                                           |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Page background                        | `--background`, `--color-bg` → `var(--grey-900)` | `#07080a`                                                                                                    | 0.134                                       |
| Grey scale (dark-first, 900 = darkest) | `--grey-900 … --grey-50`                         | `#07080a`, `#0c0d0f`, `#111214`, `#1b1c1e`, `#2f3031`, `#434345`, `#6a6b6c`, `#9c9c9d`, `#cdcece`, `#e6e6e6` | 0.134, 0.159, 0.182, 0.226, 0.309, 0.384, … |
| Surface ladder                         | `--color-bg-100 / 200 / 300 / 400`               | `#101111`, `#18191a`, `#313133`, `#494b4d`                                                                   | 0.176, 0.213, 0.314, 0.412                  |
| Border                                 | `--color-border`                                 | `#242728`                                                                                                    | 0.270                                       |
| Foreground ladder                      | `--color-fg / -200 / -300 / -400`                | `#f4f4f6`, `#c2c7ca`, `#78787c`, `#5e6366`                                                                   | —                                           |
| Button (inverted)                      | `--color-button-bg` / `-hover`                   | `#ffffffd0` → `#fff`                                                                                         | —                                           |
| Reverse (light) background             | `--reverse-background`                           | `#fff`                                                                                                       | 1.000                                       |
| Light theme                            | —                                                | **not public** (website is dark-only)                                                                        |                                             |

### 4.2 Website rules (compiled CSS)

- **Hover is a fill one or two grey steps lighter, or a white alpha:** Y3
  `.blog-card-module__ws7tPa__card:is(a):hover{background-color:var(--grey-600)}` (`#1b1c1e` on
  the `#07080a` page); `.APISection-module__…colLink:hover{background-color:var(--grey-800)}`;
  `.Popover-module__…popoverClose:hover{background-color:var(--grey-600)}`; many marketing rows
  use `:hover{background-color:#ffffff1a}` (10 % white) or `#ffffff0d` (5 %).
- **Cards hover by border, not fill, when they already have a fill:** Y3
  `.FeatureWall-module__…card:hover{border-color:#ffffff1f}`;
  `.index-module__NFhuXW__card:hover{border:1px solid var(--Card-Border,#ffffff0f);box-shadow:inset 0 1px 1px #ffffff1a}`.
- **Inputs are filled with a 5 % white wash and a 5 % border; hover and focus change the border only:** Y2
  `.Input-module__oMomFq__input{background:#ffffff0d;border:1px solid #ffffff0d}`,
  `…:hover{border-color:#ffffff40}`, `…:focus{border-color:#fff6}`,
  `…:disabled{color:var(--Text-Muted,var(--grey-300));cursor:not-allowed}`,
  `.withError .input{border-color:var(--Red-Dim,#833637)}`. Placeholder `var(--grey-300)`.
- **Active = hover** for the dock item:
  `.index-module__utU0aa__item:hover, .item.active{border:1px solid var(--grey-400);background:radial-gradient(…#787878 0%,#282828 100%)}`.
- **Dark layering: lighter = higher** (page `#07080a` → bg-100 `#101111` → bg-200 `#18191a` →
  bg-300 `#313133`), with elevation also carried by inset 1px white highlights
  (`inset 0 1px 1px #ffffff1a`, `inset 0 1px .4px #fff`).
- Secondary vs. muted vs. hover: the site has a numbered surface ladder (`bg-100..400`) and a
  separate grey scale; hover reuses grey steps rather than a dedicated hover token. The `bg-*`
  ladder is defined but no rule in the fetched chunks consumes it (its consumers are elsewhere).

### 4.3 Product theme schema (Y4, Y5)

The app's themes are a fixed JSON with **two background slots**, one text, one selection, one
loader, and seven accents — no hover/border/card slots exist; every other surface is derived by
the app. Y5: themes let you "adjust the background, primary text, and support colors, which
adapts across Raycast in Light and Dark mode." Real light/dark pair from Y4
(`catppuccin-org/catppuccin-latte.json`, `…/catppuccin-mocha.json`):

| Slot                         | Light (Latte) | L     | Dark (Mocha) | L     |
| ---------------------------- | ------------- | ----- | ------------ | ----- |
| `appearance`                 | `"light"`     |       | `"dark"`     |       |
| `colors.background`          | `#EFF1F5`     | 0.958 | `#1E1E2E`    | 0.243 |
| `colors.backgroundSecondary` | `#EFF1F5`     | 0.958 | `#1E1E2E`    | 0.243 |
| `colors.text`                | `#4C4F69`     |       | `#CDD6F4`    |       |
| `colors.selection`           | `#9CA0B0`     | 0.708 | `#6C7086`    | 0.550 |
| `colors.loader`              | `#8C8FA1`     |       | `#7F849C`    |       |
| `colors.red … magenta`       | 7 accents     |       | 7 accents    |       |

Raycast's own default "Raycast Dark / Light" theme values: **not public** as JSON (the Theme
Explorer repo hosts community themes; the built-in defaults are copied out of Theme Studio, which
is Pro-gated). The derivation rule for hover/selected from `selection` is **not public**.

---

## 5. Comparison table (system × role × light × dark × rule)

Values are the published ones; L is derived. "= page" means the same value as the app background.

| Role                           | Geist (light / dark)                                                                           | Radix Colors + Themes (light / dark)                                                                               | shadcn default (light / dark)                                               | Linear (light / dark)                                                                    | Raycast site (dark only)                                              | VegaStack today (light / dark)            |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| **App background**             | `background-100` `#fff` 1.000 / `#000` 0.000                                                   | white 1.000 / `gray-1` `#111` 0.178                                                                                | `oklch(1 0 0)` / `0.145`                                                    | `bg-level-0` `#fff` / `#08090a` 0.139                                                    | `grey-900` `#07080a` 0.134                                            | 0.994 / 0.175                             |
| **Subtle / secondary bg**      | `background-200` `#fafafa` 0.985 / `#000` (= page)                                             | `gray-2` `#f9f9f9` 0.982 / `#191919` 0.213                                                                         | none (`muted` doubles)                                                      | `bg-secondary` `#f9f8f9` 0.980 / `#1c1c1f` 0.228; `level-1` `#f8f8f8` / `#0f1011` 0.172  | `bg-100` `#101111` 0.176                                              | `secondary`=`muted`=`accent` 0.97 / 0.269 |
| **Card / panel**               | = page + `0 0 0 1px #00000014` / `#ffffff25` (shadow-border)                                   | Themes: `panel-solid` white (= page) / `gray-2` 0.213 (one step up)                                                | `card` = page 1.000 / `0.205` (lifted)                                      | `level-1` `#f8f8f8` 0.979 (sunken) / `bg-panel` `#0f1011` 0.172 (lifted) + hairline      | `grey-800/700` or `#ffffff0f` border                                  | `card` 0.985 (sunken) / 0.205 (lifted)    |
| **Popover / menu**             | `material-menu` = page + shadow                                                                | `panel-solid` = card                                                                                               | `popover` = card                                                            | `level-1` + `border-primary` + `shadow-high`                                             | not found                                                             | 0.994 (= page) / 0.205 (= card)           |
| **Component rest fill**        | `gray-100` `#f2f2f2` 0.961 / `#1a1a1a` 0.218                                                   | `gray-3` `#f0f0f0` 0.955 / `#222` 0.252 (Themes: `gray-a3`)                                                        | `secondary` 0.97 / 0.269                                                    | `bg-secondary` (tertiary button border) ; `bg-translucent` `#00000005` / `#ffffff0d`     | `#ffffffd0` (inverted button)                                         | 0.97 / 0.269                              |
| **Hover**                      | **fill** `gray-200` `#ebebeb` 0.940 / `#1f1f1f` 0.239, or `gray-alpha-100/200`                 | **fill** `gray-4` 0.931 / 0.285 (Themes: `a3→a4`; cards: border `a5→a7`)                                           | **fill** `accent` 0.97 / 0.269; secondary button `/80` opacity              | **fill** `bg-tertiary` 0.963 / 0.257 or `level-3` 0.955 / 0.217; cards → border          | fill `grey-600` `#1b1c1e` 0.226 or `#ffffff1a`; inputs/cards → border | `accent` 0.97 / 0.269                     |
| **Active / pressed**           | fill `gray-300` `#e6e6e6` 0.925 / `#292929` 0.281                                              | fill `gray-5` 0.907 / 0.313 (Themes: `a5`)                                                                         | none distinct (`accent` again)                                              | `bg-quaternary/quinary` 0.947→0.932 / 0.278→0.277 + `scale(.97)`                         | = hover                                                               | none distinct                             |
| **Selected**                   | `aria-selected` → `gray-300` (solid) or `gray-alpha-100` (menus)                               | `gray-5` ("Active / Selected" share step)                                                                          | `accent` (rows/items) or `primary` (states)                                 | `level-3` pseudo-element (= hover step)                                                  | `.active` = hover                                                     | `accent` / `primary`                      |
| **Input**                      | **transparent**, border `gray-alpha-400` `#00000014` / `#ffffff24`; hover border → `alpha-200` | Themes: `--color-surface` `rgba(255,255,255,.85)` / `rgba(0,0,0,.25)` (dark: darker than panel) + border `gray-a7` | **transparent** + `border-input` 0.922 / dark fill `input/30` + `1 0 0/15%` | **transparent**, no border; composer `#ffffff08` wash + hairline                         | filled `#ffffff0d` + border `#ffffff0d`; hover/focus border only      | `input` = `border` 0.922 / 0.269          |
| **Border**                     | `gray-400` `#eaeaea` 0.937 / `#2e2e2e` 0.301; hover `gray-500`; active `gray-600`              | `gray-6` 0.885 (non-interactive) / `gray-7` 0.851 (interactive) / `gray-8` hovered                                 | `border` 0.922 / `1 0 0/10%`                                                | `border-primary` `#e9e8ea` 0.932 / `#23252a` 0.264; `line-primary` `#d4d4d6` / `#37393a` | `#242728` 0.270                                                       | 0.922 / 0.269                             |
| **Disabled**                   | region fill `gray-100`                                                                         | fill `gray-a3`, border `gray-a6/a7`                                                                                | `opacity-50`                                                                | not public                                                                               | text `grey-300`, cursor only                                          | `--opacity-*`                             |
| **Dark layering**              | flat: page = secondary = `#000`; elevation by shadow + 25 % hairline                           | lighter = higher (`gray-1` → `gray-2` panel); inputs _darker_                                                      | lighter = higher (0.145 → 0.205)                                            | lighter = higher (0.139 → 0.172 → 0.195 → 0.217), plus ≤4 % white washes                 | lighter = higher (0.134 → 0.176 → 0.213 → 0.314)                      | lighter = higher (0.175 → 0.205)          |
| **Secondary ≠ muted ≠ hover?** | three families, distinct (except dark bg-100 = bg-200)                                         | distinct steps (2 / 3 / 4 / 5)                                                                                     | **collapsed** (one value, three names)                                      | distinct (`secondary`, `panel`, `tertiary`), hover = selected                            | ladder + grey scale, hover reuses grey                                | **collapsed**                             |

---

## 6. Patterns that recur across all four

Facts that hold in every system examined (Geist, Radix/shadcn, Linear, Raycast), stated
without a recommendation:

1. **Hover on a gray-tinted interactive element is a _fill_, one step "up" from its rest fill,
   and pressed/selected is one further step.** Geist 100→200→300; Radix 3→4→5 (a3→a4→a5 in
   Themes); Linear secondary→tertiary→quaternary/quinary (or level-3); Raycast grey-800→600.
   shadcn is the outlier by _value_ (one token for all three) but its docs describe the same
   three intents.
2. **Elements that already carry a border (cards, inputs, outline buttons) hover by changing the
   _border_, not the fill.** Geist gray-400→500→600 and `alpha-400`→`alpha-200`; Radix card
   `a5→a7`, surface button `a7→a8`; Linear cards "elevate … with stronger borders"; Raycast
   `#ffffff0f→#ffffff1f`, input `#ffffff0d→#ffffff40→#fff6`.
3. **In light mode the card is the page colour, separated by a hairline** (Geist, Radix Themes,
   shadcn) or at most one sub-2 % step below it (Linear `#f8f8f8`). No system lifts a light card
   above white.
4. **In dark mode every system except Geist makes the panel one step _lighter_ than the page**
   (Radix gray-1→gray-2, shadcn 0.145→0.205, Linear 0.139→0.172, Raycast 0.134→0.176), and
   further elevation continues lighter. Geist keeps page and panel both `#000` and carries
   elevation with shadow plus a 25 %-white hairline.
5. **Inputs are transparent (or a ≤5 % wash) on their host surface, with a border; none uses the
   opaque "secondary/muted" fill for an input.** Geist transparent + alpha border; shadcn
   transparent (dark: 30 % of a 15 %-white token ≈ 4.5 %); Linear transparent or `#ffffff08`;
   Raycast `#ffffff0d`; Radix Themes a translucent `--color-surface` that is _darker_ than the
   panel in dark mode.
6. **The hover/pressed steps are alpha (composited) in at least one lane of every system**, so
   the same token works on page, card, and popover: Geist `gray-alpha-*`, Radix `grayA` /
   `accent-aN`, shadcn `accent/50`, `input/30`, `secondary/80`, Linear `#ffffff08…26` and the
   whole `glass` theme, Raycast `#ffffff0d / 1a / 40`.
7. **"Selected" is not a separate lightness step anywhere.** It reuses the pressed step (Geist
   gray-300, Radix 5) or the hover step (Linear level-3, Raycast `.active`), or moves to the accent
   (shadcn `primary`, Radix `solid` menu `accent-9`).
8. **Light-mode surface steps are tiny (≈0.010–0.025 L per step) and dark-mode steps are similar
   or smaller (0.02–0.04 L)**; the systems rely on the _ordering_ of steps, not on large
   contrast, and on borders/shadows for card edges.
9. **Where a system offers a "secondary background" for page regions, it is distinct from the
   component rest fill and from the hover step** (Geist `background-200` vs `gray-100` vs
   `gray-200`; Radix 2 vs 3 vs 4; Linear `bg-secondary`/`level-1` vs `bg-tertiary`/`level-3`).
   Only shadcn's default (and therefore VegaStack's inherited mapping) publishes one value under
   three names.

### Not public (checked, not found)

- Geist: dark-mode values for `--ds-gray-700/800` beyond the hex above; the Input page's own
  token list; any documented rule for `selected`.
- Radix Colors: no official page maps `card` to a step beyond "steps 1–2 … card backgrounds".
- Linear: light-mode `--color-bg-panel`; any disabled-state colour; any documentation at all.
- Raycast: light-mode website values; the built-in default theme JSON; the derivation of hover /
  selected / border from the theme's `background` and `selection` slots.
