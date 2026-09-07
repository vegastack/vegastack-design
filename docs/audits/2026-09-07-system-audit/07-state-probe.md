# 07 — Interaction-state probe (hover · pressed · focus · radius)

**Why:** MK pointed out that the Tabs underline hover wash sits flush on the rail, and that "a lot of
such minute things" were being missed by rest-state captures. This pass hovers, presses and
keyboard-focuses every visible interactive element in every fixture at 2× device scale and checks
geometry that a static screenshot cannot show.

**Method:** `probe-states.mjs` — 111 routes, 817 elements probed (deduped by visual signature,
≤14 per fixture), light theme; a dark pass runs the same script with `--dark`. For each element it
records computed colour/border/outline/shadow/opacity at rest, hover, active (pointer down) and
focus, and the edges it shares with bordered / rounded / overflow-hidden ancestors. Crops of every
flagged element are in `captures/_states/<route>/<id>__hover.png`; raw data in `states.json`.

| flag                   | raw hits | after triage | what it means                                                                                                                         |
| ---------------------- | -------: | -----------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| `active-same-as-hover` |      268 | **systemic** | pressing changes nothing beyond hover on every non-primary button, toggle, trigger, tab                                               |
| `hover-invisible`      |      149 |     ~40 real | hover changes nothing visible                                                                                                         |
| `focus-none`           |       73 |     ~10 real | keyboard focus draws nothing (most hits were text inputs whose ring lives on the wrapper, or buttons my test click had just disabled) |
| `focus-clipped`        |       19 |      19 real | outline offset outward under an overflow-hidden ancestor                                                                              |
| `hover-touches-border` |       13 |      13 real | hover fill sits on a container hairline                                                                                               |
| `radius-mismatch`      |        4 |       1 real | inner corner does not follow the container corner                                                                                     |

## Findings

### SP-01 · HIGH · systemic · There is no pressed state

- 268 elements across 60 routes: secondary/outline/ghost/link buttons, every IconButton, toggles,
  toggle-group items, tabs, all overlay triggers, accordion/collapsible triggers, copy buttons,
  sidebar buttons. Only the solid primary Button has a pressed step (hover L 15.2 → active L 11.4).
  Geist, Linear and Raycast all darken by one more step on `:active`.
- **Fix:** P1's `--alpha-pressed` applied by the shared hover/pressed recipe (`active:bg-surface-3`
  for washes, `active:bg-primary/(--alpha-fill-pressed)` for solids) — one place, every control.

### SP-02 · HIGH · geometry · Hover fills sit on container hairlines

- **Tabs** (`tabs.tsx`): the underline variant's trigger hover wash ends exactly on the
  `tabs-list` bottom border; the vertical variant's wash ends on the list's left rail
  (`captures/_states/tabs/p0-0__hover.png`, `p1-0__hover.png`). Geist/Linear inset the hover pill
  (rounded, with a 4px gap above the rail) so the wash never touches the indicator line.
- **NumberField** (`number-field.tsx`): the `−`/`+` segment hover fills touch the field border on
  three sides with a square inner corner against the field's rounded corner
  (`number-field/p0-0__hover.png`). Either the buttons get `rounded-[inherit]` with the outer radius
  minus the border, or the field clips with `overflow-hidden` and the ring becomes inset.
- **Command** items: the hover pill is inset by only the list padding (2px from the panel border at
  the last row). Give the list `p-1` + item `rounded-md` a 4px floor, as the menu items already have.
- **Fix:** a doctrine line — "a hover wash is always inset from a container border by ≥4px and
  inherits the container's inner radius" — plus the three fixes. Add this geometry check to the
  contract lane (the probe's `hover-touches-border` and `radius-mismatch` rules).

### SP-03 · MEDIUM · a11y · Focus rings are clipped on every scroll viewport and truncating cell

- `scroll-area-viewport` (5 fixtures), `message-scroller-viewport` (7), Board's column viewports,
  `data-grid-cell` (the roving cell inside `table-container`), `sidebar-rail`, PropertyList's link
  inside a truncating `dd`, NumberField's inner Select trigger. The outline is offset outward and
  the ancestor is `overflow: hidden|auto`, so the ring is partly or fully cut.
- **Fix:** focusable viewports and cells use `focus-visible:-outline-offset-2` (the Terminal
  pattern); truncating containers use `overflow-clip-margin` or put the ring on the inner span.

### SP-04 · MEDIUM · consistency · Hover is missing where users expect it

- `select-trigger` (16 fixtures): no hover in light; dark has `hover:bg-input/…` — one theme hovers,
  the other does not. `split-button-primary` (7): the primary half loses Button's hover entirely (rest
  = hover, active only). `popover-trigger` / `date-picker-trigger` / `country-select` /
  `sheet-trigger` / `dialog-trigger` when rendered as outline buttons: no hover in light (the P1
  invisible-wash problem). Checkbox/Radio/Switch (31): no hover treatment at all; Geist tints the
  control border on hover.
- **Fix:** P1 ladder gives every trigger a visible wash in both themes; SplitButton stops
  re-wrapping the primary's classes; Checkbox/Radio/Switch get `hover:border-foreground/…` on the
  unchecked box.

### SP-05 · LOW · a11y · Charts are focusable with no ring

- `chart.tsx` (8 fixtures): recharts `accessibilityLayer` makes the `<svg>` a tab stop, but the
  system's outline rule does not match `svg`, so focus is invisible. Add
  `[&_svg:focus-visible]:outline-2 …` on the chart container (inset).

### SP-06 · LOW · consistency · Active sidebar rows have no hover step

- `sidebar-menu-button[data-active]` (14): rest = hover = `sidebar-accent`; a hovered active row
  reads dead. Use `surface-3` for active and `surface-2` for hover, so active+hover still moves.

### Probe artefacts (not defects)

`focus-none` on `input`/`textarea`/tiptap editor: the tint lives on the wrapper (`focus-within`),
which the probe did not snapshot. `focus-none` + `opacity 0.5` on "Send reply"/"Next": my test click
disabled them. `radius-mismatch:…33554400` on BubbleReactions: `rounded-full`. `role="listitem"`
Items flagged `focus-none`: not interactive (and B7-01 removes the role). ActionBar "Save": the
fixture is in the pending state.

## Dark-theme pass

`probe-states.mjs --all --dark`, same 817 elements (`captures/_states-dark/index.json`).

| flag                            | light | dark |
| ------------------------------- | ----: | ---: |
| `active-same-as-hover`          |   268 |  270 |
| `hover-invisible`               |   149 |  135 |
| `focus-none`                    |    73 |   72 |
| `focus-clipped`                 |    19 |   19 |
| `hover-touches-border`          |    13 |   14 |
| `radius-mismatch` (incl. hover) |     4 |    4 |

The two themes fail the same way, which is the useful result: the defects are structural
(recipes, geometry), not palette-specific. Dark-only differences are four elements: the
NumberField's inner Select trigger gains a hover in dark (dark has `hover:bg-input/…`, light has
none — SP-04) and so touches the field border there; one chart svg. 14 elements hover-invisible in
light are visible in dark, all Select/Combobox-style triggers — the same one-theme-only hover.
Verdict unchanged: SP-01…SP-06 apply to both themes and are fixed once by F1/N1/Fo1/T1.
