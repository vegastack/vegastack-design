# 03 — Proposals needing MK's decision

Each proposal states the problem, the options with trade-offs, a recommendation, and the migration
that ships with it. Nothing here is code yet.

## P2 · Button: `variant × tone` instead of 15 hardcoded variants

**Problem.** Button hardcodes 15 variants (`button.tsx:24-60`). Seven of them (`success`, `warning`,
`info`, `success-outline`, `warning-outline`, `info-outline`, `destructive-outline`) are the same two
recipes (soft fill, outline tint) repeated per status hue. MK's question: _if they go, how is a
status-coloured action still expressed, and what happens to existing uses?_

**How the benchmarks do it.** Radix Themes: `variant` (solid · soft · outline · ghost) × `color`.
Geist: `type` (primary · secondary · tertiary · error · warning) × `variant`. Vercel's own brand CSS ships
three shapes (primary, secondary, tertiary) and puts status colour on _text and borders of fields_, never
on buttons. Linear: primary · secondary · tertiary, with `danger` as the single tinted action. Raycast:
primary · secondary · destructive. Nobody ships a green button as a first-class variant.

**Options.**

| option                                                                                                                          | what it is                                                                                                                                                                                                                                                                   | pros                                                                                                                                                                                                                                               | cons                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) two axes: `variant` = `solid · soft · outline · ghost · link` × `tone` = `neutral · destructive · success · warning · info` | Recipes are written once per `variant` using CSS custom properties (`--btn-fill`, `--btn-fill-hover`, `--btn-ink`, `--btn-border`); `tone` only sets the variables. The same 5×5 matrix is available, but from **10 class strings** instead of 25 hand-written combinations. | Every status action stays expressible (`<Button variant="soft" tone="success">`). Lean CVA; consistent hover/active for every cell because the recipe is shared. Matches Radix/Geist mental model. `IconButton`/`SplitButton` inherit it for free. | Two props instead of one on the most-used component. Breaking rename (`default → solid`). Docs must explain the matrix.                                             |
| (b) six named variants + `tone` only on `soft`/`outline`                                                                        | `default · secondary · outline · ghost · link · destructive`, plus `tone` accepted only when it makes sense.                                                                                                                                                                 | Fewer visible options; closest to today's naming.                                                                                                                                                                                                  | Two props that only sometimes combine is a worse API than a clean matrix; `destructive` becomes both a variant and a tone.                                          |
| (c) delete outright, no replacement                                                                                             | Status actions are composed: an action inside an `Alert intent="success"` inherits the tint via `[data-slot=alert] [data-slot=button]` styling.                                                                                                                              | Smallest surface.                                                                                                                                                                                                                                  | Loses a legitimate need (a standalone "Approve" soft-success action in a review flow) and pushes styling into Alert, which the "no local styles" principle forbids. |

**Recommendation: (a).** It is the only option that is both leaner _and_ more capable. Default
`tone="neutral"`, so `<Button>` and `<Button variant="outline">` read exactly as today; the marketing
`cta` becomes `variant="cta"` (kept, it is a genuinely different recipe); `glass` is decided in Batch 4.
`destructive` stays reachable as `<Button tone="destructive">` (solid) and `variant="soft" tone="destructive"`
(today's soft-destructive, which the doctrine says is the _only_ destructive button — that rule survives as
lint: `tone="destructive"` forbids `variant="solid"`).

**Migration table (ships in the same issue).**

| today                                        | after                                                  |
| -------------------------------------------- | ------------------------------------------------------ |
| `variant="default"`                          | `variant="solid"` (default — can be omitted)           |
| `variant="secondary"`                        | `variant="soft"` (neutral)                             |
| `variant="outline"` / `"ghost"` / `"link"`   | unchanged names                                        |
| `variant="destructive"`                      | `variant="soft" tone="destructive"`                    |
| `variant="success"` / `"warning"` / `"info"` | `variant="soft" tone="…"`                              |
| `variant="{x}-outline"`                      | `variant="outline" tone="{x}"`                         |
| `variant="cta"`                              | unchanged                                              |
| `finish="lit"`                               | removed (decision 2026-09-07)                          |
| `size="default"`                             | `size="md"`; `size="icon*"` → use `IconButton size="xs | sm  | md  | lg"` |

**Every current use, and what happens to it** (grep on 2026-09-07):

- `apps/docs/components/preview/button.tsx`, `button-playground.tsx`, `button.mdx` — rewritten around the matrix; the "Variants" example becomes a 5×5 matrix preview; "Lit finish" section deleted.
- `apps/docs/components/preview/icon-button.tsx:53-77`, `icon-button-playground.tsx` — the eight status examples collapse to a `tone` row.
- `apps/docs/components/preview/split-button.tsx:61-85`, `split-button-playground.tsx` — same.
- `apps/docs/components/preview/empty.tsx:189` (`variant="info"`) → `variant="soft" tone="info"`.
- `packages/ui/registry/ui/alert.tsx:130` (JSDoc example, `warning-outline`) → `variant="outline" tone="warning"`.
- `packages/ui/registry/ui/alert-dialog.tsx:34` (JSDoc, `destructive-outline`) → `variant="outline" tone="destructive"`; `alert-dialog.tsx:365` Cancel stays `outline`.
- `copy-button-playground.tsx` — variant list regenerated from the type.
- `pricing-section.mdx` (`finish="lit"`) → removed.
- `component-contracts.json` Button summary ("15 variants × 8 sizes") regenerated; `design.md` §Components Button paragraph rewritten; `button.test.tsx` cta/lit tests updated.
- No block, hook, or other component passes a status variant (verified: only previews and JSDoc).

## P1 · Surface tokens: `secondary` / `muted` / `accent` — scenario study and proposal

Facts come from `research-surface-palettes.md` (Geist, Radix/shadcn, Linear, Raycast, every value
cited) and Vercel's published brand CSS (`vercel-brand.css`, read 2026-09-07).

### What we have

| token              | light              | dark               | used for (grep, 2026-09-07)                                                                                |
| ------------------ | ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `background`       | 0.994              | 0.175              | page                                                                                                       |
| `card`             | 0.985 (below page) | 0.205 (above page) | Card, Board columns, dashboard tiles                                                                       |
| `popover`          | 0.994 (= page)     | 0.205 (= card)     | every floating surface, Sheet, Dialog, Command                                                             |
| `secondary`        | 0.970              | 0.269              | Button secondary fill, `Textarea`? no — 3 uses                                                             |
| `muted`            | 0.970              | 0.269              | 21 hover fills, Slider rail, Progress track, Kbd, Skeleton, disabled input fill, footers via `/alpha-wash` |
| `accent`           | 0.970              | 0.269              | 9 hover/highlight fills (menus, command, select items), Avatar fallback, chips                             |
| `input` = `border` | 0.922              | 0.269              | field borders; dark input wash via `/30`                                                                   |

So: **one neutral step (0.97 / 0.269) does rest-fill, hover, selected, sunken well, track, disabled
and skeleton all at once.** There is no pressed step, no distinct hover step, and hover on a
`muted`-filled element (a Kbd inside a hovered menu row, a secondary button) is invisible because
hover _is_ the same value.

### What every reference does (facts, §6 of the research)

1. Hover on a gray-tinted interactive element is a **fill one step up** from its rest fill; pressed
   or selected is **one further step** (Geist 100→200→300, Radix 3→4→5, Linear
   secondary→tertiary→quaternary).
2. Elements that already carry a border (cards, inputs, outline buttons) hover by **changing the
   border**, not the fill.
3. Light cards are **page-coloured with a hairline** (Geist, Radix Themes, shadcn); nobody lifts a
   light card above white, and only Linear goes 2 % below.
4. Dark panels are **one step lighter than the page** everywhere except Geist (which keeps black +
   shadow + 25 % white hairline).
5. Inputs are **transparent or ≤5 % wash** with a border; none uses the opaque muted fill.
6. Hover/pressed steps exist as **alpha** in every system, so one token composites on page, card
   and popover.
7. "Selected" is never its own lightness step; it reuses pressed (Geist, Radix) or hover (Linear,
   Raycast).
8. shadcn's default is the _only_ system with one value under three names. VegaStack inherited it.

### Scenario matrix — where each role is needed and what breaks today

| scenario                                                                     | needs                                | today                                                                                             | breaks today?                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Page → subtle page region (settings sidebar, table header band, code well)   | a _sunken_ neutral                   | `muted` 0.97                                                                                      | fine alone                                                                             |
| Rest fill of a filled control (secondary button, kbd, chip, tab-list pill)   | a _rest_ step                        | `secondary`/`muted` 0.97                                                                          | fine alone                                                                             |
| Hover on that filled control                                                 | rest + 1                             | none — secondary button hovers with `/80` opacity, kbd never hovers, chips use `bg-foreground/10` | **yes** — three different hover mechanisms for one role                                |
| Hover on a transparent row/item (menu, list, sidebar, table row)             | a hover step                         | `accent` 0.97 (9 files) _or_ `muted` 0.97 (21 files)                                              | invisible split; and a hovered row is the **same colour as an adjacent kbd/chip/well** |
| Pressed / active on any of the above                                         | hover + 1                            | none (Button `default` has `primary-active`; nothing else)                                        | **yes** — no pressed feedback except on primary                                        |
| Selected row/item (data-grid row, sidebar current item, command highlighted) | hover or pressed step, or ink        | `accent` (menus), `primary` (sidebar/tab underline), `bg-primary/…` (grid rows, checked later)    | inconsistent                                                                           |
| Card on page, light                                                          | = page + hairline                    | `card` 0.985 < page 0.994 (a grey slab)                                                           | **yes** — against every reference                                                      |
| Card on page, dark                                                           | page + 1                             | 0.205 > 0.175                                                                                     | fine                                                                                   |
| Popover on card, light                                                       | = card (+ shadow)                    | `popover` 0.994 ≠ `card` 0.985 → a popover over a card is _lighter_ than the card                 | odd but tolerable; fixed by P1                                                         |
| Input at rest                                                                | transparent + border; dark ≤5 % wash | matches (`dark:bg-input/30`)                                                                      | fine                                                                                   |
| Disabled filled control                                                      | dimmed rest                          | `opacity-dim` + `bg-muted` on inputs                                                              | fine                                                                                   |
| Track / rail (slider, progress, switch off)                                  | sunken well                          | `muted` (slider/progress) but `track` 0.87 (switch)                                               | split — `track` exists only for Switch                                                 |
| Skeleton / kbd / code block                                                  | sunken well                          | `muted`                                                                                           | fine                                                                                   |
| Drag preview / lifted row                                                    | dims flat, hairline                  | doctrine says no shadow                                                                           | fine                                                                                   |

### Options

| option                                                              | what changes                                                                                                                                                                                                                                                                                                                                                                                                                                | pros                                                                                                                                                                                                                                                                                    | cons                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a) Keep one value, formalise aliases**                           | `secondary`/`accent` become aliases of `muted`; pick `accent` as the only hover token; lint.                                                                                                                                                                                                                                                                                                                                                | Zero visual change; 30 min of work.                                                                                                                                                                                                                                                     | Locks in the defects in rows 3–5: no visible hover on filled controls, no pressed step, hovered row = well colour. Every reference has the ladder we lack.                                |
| **(b) A four-step neutral surface ladder with alpha hover/pressed** | New roles: `surface-1` (rest fill / sunken well, today's 0.97 / 0.269), `surface-2` (hover), `surface-3` (pressed/selected), each **also as alpha** (`--alpha-hover`, `--alpha-pressed` on `foreground`) so they composite on page, card and popover. Keep shadcn names as aliases for registry compatibility: `secondary` = `muted` = `surface-1`, `accent` = `surface-2`. `card` = `background` in light. `track` folds into `surface-1`. | Matches all four references; one hover mechanism system-wide (replaces `/80` opacity, `bg-foreground/10`, `hover:bg-muted`, `hover:bg-accent`); gives every control a pressed state; alpha means Kbd-inside-hovered-row stays visible. Consumers using shadcn token names keep working. | Touches ~35 files (mechanical: hover/active classes); needs contrast gates for the two new steps; light and dark step sizes must be tuned by eye (references use 0.010–0.025 L per step). |
| **(c) Radix-style full 12-step neutral scale**                      | Replace semantic tokens with `gray-1…12` + `grayA`.                                                                                                                                                                                                                                                                                                                                                                                         | Maximum flexibility.                                                                                                                                                                                                                                                                    | Throws away the semantic layer that lint, docs, and consumers rely on; against locked "semantic tokens only".                                                                             |

### Recommendation: (b), with these values to start from (to be eye-tuned in the token issue)

| role                                                 | light L                                                                                                                    | dark L | alpha form (on `foreground`)             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------- |
| `background` (page)                                  | 0.994                                                                                                                      | 0.175  | —                                        |
| `card`                                               | **= background** (light) · 0.205 (dark)                                                                                    |        | —                                        |
| `popover`                                            | = card                                                                                                                     |        | —                                        |
| `surface-1` rest / well (`muted`, `secondary` alias) | 0.970                                                                                                                      | 0.245  | —                                        |
| `surface-2` hover (`accent` alias)                   | 0.945                                                                                                                      | 0.275  | `--alpha-hover` ≈ 5 %                    |
| `surface-3` pressed / selected                       | 0.920                                                                                                                      | 0.305  | `--alpha-pressed` ≈ 9 %                  |
| `border` / `input`                                   | 0.922 → consider **alpha border** (Geist/Vercel: `gray-alpha-400`) so one hairline works on page, card, well and dark band |        | `--alpha-border` ≈ 8 % light / 14 % dark |

Rules that follow (into `design.md` §Surfaces and §Components):

- Transparent interactive elements (rows, items, ghost buttons) hover `surface-2`, press/select
  `surface-3`.
- Filled controls (secondary/soft buttons, chips, kbd) rest on `surface-1`, hover `surface-2`, press
  `surface-3` — no opacity tricks.
- Bordered elements (cards, inputs, outline buttons) hover by **border** (`border` → `ring/70`), not fill
  (already the doctrine for inputs; extend to cards and outline buttons).
- Light cards are page-coloured; separation is the hairline. Dark keeps the lift.
- `secondary`, `muted`, `accent` stay as _names_ so shadcn-shaped code keeps compiling, but the
  docs say which of the three is canonical for each scenario, and lint flags `hover:bg-muted`.

**Decision (MK, 2026-09-07): (b) — build the ladder, with alpha borders** (`border`/`input` become
a foreground alpha, ≈8 % light / ≈14 % dark, tuned against the contrast gate). The token issue
lands _before_ any component batch is implemented, because every hover/pressed class in the change
list depends on it.

**P2 decision (MK, 2026-09-07): variant × tone accepted**, with the migration table above shipping in
the same issue.
