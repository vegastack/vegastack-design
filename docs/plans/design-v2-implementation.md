# v2 implementation & migration plan — propagate `design.md` into the live tokens + components

> **Historical record — no current authority.** This migration has been completed and its package
> names, component counts, token state, and commands are intentionally preserved as a point-in-time
> record. Use `design.md`, current source/scripts, and `AGENTS.md` for present behavior.

**Critical context:** this is **not greenfield.** The repo already has a complete pipeline + **59 built, tested, design-linted components**. The token _values_ are still **stock-grey shadcn** (pure grey chroma 0, solid border, `--radius` 10px, 3px focus rings). Our entire v2 `design.md` is a **spec that has not been applied.** This plan is the migration.

References verified this round: `packages/tokens/tokens/*.tokens.json`, `packages/tokens/dist/theme.css`, `packages/ui/registry/ui/*.tsx`, shadcn `new-york-v4` source. "Nova" = official shadcn _compact_ style (Dec 2025); no published numbers — it's a direction, not a spec.

---

## 0. Where CSS/tokens are centrally managed (the answer to "where do we manage css?")

| Layer                     | Path                                                                     | Role                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Token source of truth** | `packages/tokens/tokens/{primitives,semantic,semantic.dark}.tokens.json` | DTCG 2025.10. **Edit here.**                                                                           |
| Build                     | `packages/tokens/build-tokens.mjs` (Style Dictionary)                    | → `dist/theme.css` (`:root` + `.dark` + `@theme inline` bridge) + `src/tokens.ts` + `dist/tokens.json` |
| Generated CSS             | `packages/tokens/dist/theme.css`                                         | **artifact — never hand-edit.** Regenerate.                                                            |
| Base reset                | `packages/tokens/src/base.css` → `dist/base.css`                         | universal `*`/`body`/`:focus-visible`, portals isolation, reduced-motion                               |
| Consumer one-import       | `packages/tailwind-preset/preset.css`                                    | Tailwind + tokens + base + `@source` for ui/icons                                                      |
| App entry                 | `apps/docs/app/global.css`                                               | imports theme.css + base.css, binds runtime fonts                                                      |
| Components                | `packages/ui/registry/ui/*.tsx`                                          | CVA + `cn()` + **semantic Tailwind utilities** (`bg-primary`, `border-border`, `rounded-md`)           |

**The leverage:** components reference _semantic_ utilities, so **changing a token VALUE re-skins all 59 components automatically.** Colour migration = edit DTCG → regenerate → done. **Sizing/padding/radius/type are NOT tokenized** — they're raw Tailwind in each CVA, so those changes mean editing components (or introducing size tokens).

---

## 1. Central-management gaps (tokenize, or stay Tailwind-driven?)

| Concern               | Today                                                      | Recommendation                                                                  |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Colour                | tokenized ✓                                                | migrate values (§2)                                                             |
| Radius                | one token `--radius: 0.625rem` (10px); sm/md/lg/xl derived | **add explicit scale** so it matches the spec (sm6/md8/lg12/full); see §4       |
| Control height / size | not tokenized (raw `h-8` etc.)                             | **add `--size-sm/md/lg`** tokens → drive every control from one place (§3)      |
| Spacing               | not tokenized (Tailwind 4px)                               | keep Tailwind; document the scale (no token)                                    |
| Shadow                | not tokenized (raw `shadow-md`)                            | **add `--shadow-overlay`** token (one) → `@theme inline`                        |
| Typography            | not tokenized (raw `text-sm`/`font-medium`)                | **add type tokens** (`--text-*`) OR keep Tailwind + spec guidance — decision Q5 |
| Charts                | `chart-1..5` only                                          | extend to **`chart-1..8`** + add `sequential`/`diverging` recipes               |

---

## 2. Token migration — values: current → v2 (the central, low-touch change)

### 2a. Primitives (`primitives.tokens.json`)

| Token group       | Current                             | v2 target                                                                                            |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `neutral.*` ramp  | **pure grey** (chroma 0): 50…950    | **warm** OKLCH hue 75, chroma ~0.003; same step keys, warm values (`#fefdfc`…`#131211`)              |
| `purple`/`violet` | violet.600 `0.541 0.281 293` (neon) | add **`purple.brand`** = `oklch(0.53 0.189 295)` (#774bcb, restrained)                               |
| `blue`            | blue.700 `0.488 0.243 264`          | keep family; info fill = `oklch(0.531 0.182 256)` (#0068d2)                                          |
| `red/green/amber` | stock                               | retune to v2 status (destructive `0.569 0.21 25`, success `0.54 0.145 150`, warning `0.58 0.171 42`) |
| add               | —                                   | `*-hover`/`*-active`/`*-subtle`/`*-text`/`*-bright` for brand/info/status (full 6-token families)    |

### 2b. Semantic (`semantic.tokens.json`) — name-compatible with shadcn so components don't break

| Token                             | Current                  | v2                                                | Note                                                 |
| --------------------------------- | ------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| `background`                      | white                    | warm `neutral.0`                                  |                                                      |
| `foreground`                      | neutral.950              | warm `neutral.900` (#131211)                      |                                                      |
| `card` / `popover`                | neutral.50 / white       | `neutral.0`                                       | flat warm-white                                      |
| `primary`                         | neutral.900 ✓            | `neutral.700` (light) / `neutral.200` (dark)      | already neutral-ink — just retune step               |
| `accent` (neutral hover)          | neutral.100 ✓            | warm `neutral.100`                                | keep shadcn meaning = neutral hover                  |
| **`brand`** (NEW)                 | —                        | purple family                                     | the rationed brand; add `brand` + `brand-foreground` |
| `info`                            | blue.700 ✓               | blue family (v2 value)                            | already exists — retune                              |
| `success`/`warning`/`destructive` | stock                    | v2 values + subtle/text                           |                                                      |
| `border`                          | neutral.200 **solid**    | **translucent ink** `oklch(0.13 0.002 75 / 0.11)` | one border                                           |
| `input`                           | neutral.300 (separate)   | **alias → `border`**                              | one appearance, keep name for component compat       |
| `sidebar-border`                  | neutral.200              | **alias → `border`**                              | same                                                 |
| `ring`                            | neutral.350              | **`primary`**                                     | focus = primary ink (no separate ring colour)        |
| `overlay`/scrim                   | `oklch(0 0 0/.5)` ✓      | keep (tune light = warm-ink/.28)                  |                                                      |
| `chart-1..5`                      | stock 5                  | **`chart-1..8`**; chart-1 = brand                 |                                                      |
| `showcase-*`                      | violet/orange/blue/green | **remove** or fold into charts                    | dead since v2                                        |
| `radius`                          | 0.625rem (10)            | see §4                                            |                                                      |
| `motion-ease-standard`            | `[0.2,0,0,1]`            | `[0.4,0,0.2,1]` (spec) or keep                    | reconcile — Q                                        |

**Effort:** edit 2 JSON files + regenerate. All 59 components re-skin. Re-run contrast gate (recompute on the new values — must stay 14/14).

---

## 3. Density & sizing — "32px baseline for everything"

Baseline **32px (`h-8`)** as the default control height (Nova-compact). One scale for **every** control — button, input, select-trigger, icon-button, pagination item:

| Size             | Height         | Btn padding-x | Input padding-x | Icon-only | Use                         |
| ---------------- | -------------- | ------------- | --------------- | --------- | --------------------------- |
| **sm**           | 28 (`h-7`)     | `px-2.5` (10) | `px-2.5`        | `size-7`  | toolbars, table rows, dense |
| **md (default)** | **32 (`h-8`)** | `px-3` (12)   | `px-3` (12)     | `size-8`  | everything                  |
| **lg**           | 36 (`h-9`)     | `px-4` (16)   | `px-3.5` (14)   | `size-9`  | marketing/forms             |

- Drive from `--size-sm/md/lg` tokens so it's central, not per-CVA.
- Vertical padding: buttons centre (no py needed at fixed height); inputs `py-0`; multiline (textarea) `py-2`.
- Gap (icon↔text): **`gap-2` (8)** default; `gap-1.5` (6) at sm.
- Icon sizes: 14 inline / **16 default** / 20 action / 24 feature → `size-3.5 / size-4 / size-5 / size-6`.

---

## 4. Radius — per surface (reconcile spec 6/8/12 with repo 10)

`--radius` currently 0.625rem (10px) → lg=10. Spec says lg=12. **Set `--radius: 0.75rem` (12px)** and define explicit steps (don't rely on the multiply-derive, which gives ugly 7.2/9.6):

| Token          | px                   | Applied to                                                      |
| -------------- | -------------------- | --------------------------------------------------------------- |
| `rounded-sm`   | 6                    | menu items, chips, kbd, small toggles                           |
| `rounded-md`   | 8                    | **buttons, inputs, selects** (default control)                  |
| `rounded-lg`   | 12                   | cards, popover, dropdown content, dialog, tooltip-large         |
| `rounded-full` | 9999                 | pills/badges, avatars, switch, radio, slider thumb, status dots |
| (sheet)        | **0** on flush edges | side panel is full-height; inner content corners may use lg     |

---

## 5. Per-component target spec (meticulous)

Shared primitives above apply; this table is each component's specifics. Hover = neutral `accent`; **selected/checked/active = `brand`**; focus per §6.

| Component                            | Height/size                   | Padding                                   | Radius                             | Specifics                                                                                                                                                         |
| ------------------------------------ | ----------------------------- | ----------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                           | 28/32/36                      | px 10/12/16                               | md (8)                             | variants: primary(ink)·brand(purple)·secondary(card+border)·ghost(hover accent)·destructive·soft; text 13/500; gap-2                                              |
| **Input / Textarea / Select**        | 32 (h-8)                      | px-3                                      | md                                 | bg `secondary`, border `border`; focus border→`ring`(=primary); error→destructive; textarea `min-h-16 py-2`                                                       |
| **Checkbox**                         | size-4 (16)                   | —                                         | `rounded-[4px]` (≈sm)              | checked `bg-brand`; border `border`                                                                                                                               |
| **Radio**                            | size-4                        | —                                         | full                               | dot size-2 `bg-brand`                                                                                                                                             |
| **Switch**                           | track 18×32, thumb 14         | —                                         | full                               | off `bg-track`, on `bg-brand`, thumb `bg-background`                                                                                                              |
| **Slider**                           | track h-1.5, thumb 14         | —                                         | full                               | range `bg-brand`, track `bg-muted`                                                                                                                                |
| **Dropdown / Context / Select menu** | content min-w-32              | content `p-1`; item `px-2 py-1.5`         | content **lg(12)**, item **sm(6)** | item gap-2, text-13, hover `bg-accent`; destructive item `text-destructive`; check/radio indicator `text-brand`; shadow-overlay                                   |
| **Command palette**                  | input row h-9; list max-h-80  | item `px-2 py-1.5`                        | lg                                 | selected row `bg-accent`; group label text-11 uppercase muted; `⌘K` kbd                                                                                           |
| **Dialog / Alert-dialog**            | max-w-lg (512)                | `p-5` (20); header gap-1.5; footer gap-2  | **lg (12)**                        | close = icon-button (size-8) top-right; over `scrim`; shadow-overlay; title h4(16/500)                                                                            |
| **Sheet**                            | side w-3/4 sm:max-w-sm (384)  | header/footer/content `p-4` (16)          | **0** (flush, full-height)         | shadow-overlay; gap-4                                                                                                                                             |
| **Popover / Hover-card**             | w-72 (288)                    | `p-4` (16)                                | lg                                 | border `border`, shadow-overlay                                                                                                                                   |
| **Tooltip**                          | —                             | `px-2.5 py-1` (10/4)                      | md (8)                             | inverted `bg-foreground text-background`, text-12                                                                                                                 |
| **Sonner toast**                     | w ~360                        | `p-4` (16), gap-3                         | lg                                 | wire `--normal-bg:popover`, `--normal-border:border`, `--border-radius:radius-lg`; icon 16                                                                        |
| **Sidebar**                          | width 256 / icon 48; item h-8 | group/header/footer `p-2` (8); item `p-2` | item **md (8)**                    | item gap-2 text-13; hover `bg-sidebar-accent` (neutral); **active → `bg-sidebar-accent` + font-medium** (Q: brand-subtle?); section label text-11 uppercase muted |
| **Tabs**                             | trigger h-8 px-3              | —                                         | (underline)                        | active underline = **brand**; text-13; muted→foreground                                                                                                           |
| **Badge**                            | h-5 (20)                      | `px-2 py-0.5`                             | full                               | text-11/500 gap-1; status `{family}.subtle`+`.text`; neutral `muted`; icon size-3                                                                                 |
| **Alert**                            | —                             | `p-4`                                     | md                                 | left border-2 or full border `{family}`; icon 16; title 500; uses `{family}.subtle`                                                                               |
| **Card**                             | —                             | `p-4` (16) / `p-5` roomy                  | **lg (12)**                        | `bg-card` border `border`, **flat (no shadow)**                                                                                                                   |
| **Table**                            | header h-9, cell py-2         | cell `px-3`                               | —                                  | th text-11 uppercase 500 muted; row hover `bg-accent`; border-b `border`; mono numerics tabular                                                                   |
| **Pagination**                       | item size-8                   | —                                         | md                                 | active `bg-brand`/`text-brand-foreground` (or `border-brand`)                                                                                                     |
| **Breadcrumb**                       | —                             | gap-1.5                                   | —                                  | text-13 muted; current foreground; sep faint                                                                                                                      |
| **Avatar**                           | 32 (size-8) default           | —                                         | full                               | fallback `bg-accent`; sizes 24/28/32/40                                                                                                                           |
| **Progress**                         | h-1.5                         | —                                         | full                               | bar `bg-brand`, track `bg-muted`                                                                                                                                  |
| **Skeleton**                         | —                             | —                                         | md                                 | `bg-muted` pulse; reduced-motion → solid                                                                                                                          |
| **Accordion / Collapsible**          | trigger py-3                  | —                                         | (border-b)                         | trigger text-14/500; content text-13 muted py-2                                                                                                                   |
| **Separator**                        | 1px                           | —                                         | —                                  | `bg-border`                                                                                                                                                       |
| **Kbd**                              | —                             | `px-1.5 py-0.5`                           | sm (6)                             | mono text-11 `bg-muted` border                                                                                                                                    |
| **Field / Label**                    | —                             | label `mb-1.5`                            | —                                  | label text-13/500; helper text-12 muted; error text-12 destructive                                                                                                |
| **Tooltip/Popover/Menu arrows**      | —                             | —                                         | —                                  | optional; if used, match surface                                                                                                                                  |

Components not listed (copy-button, spinner, status-icon, relative-time, kbd, otp, separator, truncated-text, etc.) inherit the primitives — no bespoke spec.

---

## 6. Focus & hover/selected — the cross-cutting decision (highest impact)

- **Hover (neutral):** `bg-accent` (neutral hover-fill) — buttons darken within their own colour.
- **Selected / checked / active:** **`brand`** (checkbox/radio/switch on, active tab, current page).
- **Focus — THE decision.** Spec says _no rings_ (mirror hover; input border → primary ink). The current system centralizes focus with `:focus-visible{outline-2 outline-offset-2 outline-ring}` plus component-specific semantic focus states. Implementing "no rings" = remove visible focus treatment from every interactive component and replace it with hover-shade / border-darken, which diverges from the accessible default. → **Q1.**

---

## 7. `design.md` changes (apply after the questions resolve)

1. **Reconcile token names with the repo's actual names** — keep `input`, `sidebar-*` as **aliases** of the one `border` (don't pretend they don't exist; the components reference them). Document `brand`/`info` as the two chromatics; `accent` stays the neutral hover.
2. **G1** — publish colours as `oklch()` + hex fallback, sRGB-faithful chroma (confirmed).
3. **G2** — unify control heights to **28/32/36** + add padding per size (replaces the false "34/36 line up" claim).
4. **G4** — add `label-sm` (12) + `code-sm` (12, tabular).
5. **Radius** — state sm6/md8/lg12/full + per-surface map (§4); sheet = 0.
6. **Motion** — reconcile easing token (`[0.2,0,0,1]` in repo vs `cubic-bezier(0.4,0,0.2,1)` in spec) — Q.
7. **Remove fluff** (noise for an agent): the long "why" narration in Overview/Colour prose (keep one line each), the marketing-flavoured adjectives ("whisper", "espresso", "futuristic" repetition), and any reference to the _artifact_ exploration. Keep: token tables, usage rules, do/don't, a11y contract, component recipes. Target: every line is a rule or a value an agent acts on.

---

## 8. Decisions — LOCKED

1. **Focus = one neutral ring (REVISED — was "full no-ring").** Evidence: focus is already centralized + neutral — `base.css` `:focus-visible{outline-2 outline-offset-2 outline-ring}` plus semantic component focus styles, not a blue glow. Resolution: **set `--ring` = `primary` (neutral ink)** → re-colours every focus state via the token, stays accessible, and avoids a repo-wide focus surgery.
2. **Control heights = 28 / 32 / 40** (`h-7` / `h-8` default / `h-10`). lg is roomy (40) for marketing/forms.
3. **Border = SOLID warm neutral.** `--border` = `neutral-200` (light) / `neutral-800` (dark); `input` + `sidebar-border` **alias** to it (one appearance, names kept for component compat). Translucent-ink rationale is dropped — the "Borders & overlays" surface-adaptation story no longer applies.
4. **Tokenize all four now.** Add `--size-{sm,md,lg}`, explicit `--radius-{sm,md,lg}`, `--shadow-overlay`, and the full `--text-*` type scale to the DTCG source — including new Style-Dictionary formats in `build-tokens.mjs` for composite typography + shadow strings. (`size`/`radius` are trivial; `type`/`shadow` need the new formats.)

**Also resolved:** keep `showcase-*` (used in 8 files); keep the repo neutral ramp step keys (`50–950`, warm the values) and align `design.md`; keep the repo `motion-ease-standard` `[0.2,0,0,1]`; charts extend 1→8 (additive).

## 9. Execution roadmap (next steps) — meticulous, sequenced

Build LOCAL; stop before publish/deploy/push (user-triggered). Gates after every phase.

### Phase 0 — Baseline & branch

- [ ] `pnpm build` green today; run `contrast-check` + `design-lint` to capture a passing baseline.
- [ ] Screenshot docs app (light+dark) = the **before** state for diffing.
- [ ] Work on a branch (already on `feat/local-build`); no commit/push without approval.

### Phase 1 — Token VALUES (re-skins all 59 at once; highest leverage)

Files: `tokens/primitives.tokens.json`, `tokens/semantic.tokens.json`, `tokens/semantic.dark.tokens.json`.

- [ ] **Warm the neutral ramp** — keep each step's existing **L** (proven, contrast-tuned), set **C≈0.003, H=75**. (Decision in-flight: warm-existing-L vs replace with exact v2 hexes; rec = warm existing L, lower risk.)
- [ ] **Add chromatic families** — `brand` (purple oklch 0.53 0.189 295), `info` (blue 0.531 0.182 256), retune status; add `hover/active/subtle/text/bright` sub-steps.
- [ ] **Semantic rewire** — `background/foreground/card/...` → warm; **add `brand`+`brand-foreground`**; `border`→solid warm `neutral-200`/`neutral-800`; `input`+`sidebar-border`→**alias of border**; **`ring`→`primary`** (does focus); `chart-1=brand` + add `chart-6..8`; keep `accent`(neutral)/`secondary`/`muted`/`showcase-*`.
- [ ] Add `['brand','brand-foreground']` to `tooling/contrast-check.mjs`.
- [ ] **Regenerate** (`pnpm build` in packages/tokens) → `dist/theme.css` + `tokens.ts` + `tokens.json`.
- **GATE:** `contrast-check` 14/14 both themes (retune if any fail) · `design-lint` clean.
- **VERIFY:** run docs app, screenshot key surfaces light+dark — confirm warm/brand/solid-border/neutral-ring re-skin. **Checkpoint before touching sizing.**

### Phase 2 — Scale TOKENS + build-config (the new formats)

Files: `tokens/semantic.tokens.json` (or new `scales.tokens.json`), `build-tokens.mjs`.

- [ ] Add `--size-sm/md/lg` (28/32/40, dimension) + `--radius-sm/md/lg` (6/8/12, explicit — not shadcn's calc-derive) — trivial.
- [ ] Add `--shadow-overlay` (string, light+dark) + full `--text-*` type scale (composite) — **needs new Style-Dictionary formats** in `build-tokens.mjs` + `@theme inline` exposure so `text-h1`, `rounded-md`=8, `shadow-overlay`, control heights resolve as utilities.
- **GATE:** regenerate; confirm new utilities resolve in a scratch component.

### Phase 3 — Component migration (per-component; the bulk, ~30 of 59)

Files: `packages/ui/registry/ui/*.tsx`. Reference §5 table for each.

- [ ] **Sizing 28/32/40** — button (`h-8` default/`h-7`/`h-10`), input/select/textarea (`h-8`), icon-button (`size-8`), pagination, etc. + padding per size (sm10/md12/lg16 btn, 12 input).
- [ ] **selected/checked/active → `brand`** — checkbox checked, radio, switch on, active tab underline, current page, slider range, progress fill. (Discriminate from the **primary button**, which stays neutral `primary`.)
- [ ] **Radius per surface** — controls `md`, cards/dialog/popover `lg`, menu items `sm`, sheet `0`, pills `full`.
- [ ] **Per-component paddings** to match §5 (dialog `p-5`, sheet `p-4`/r-0, sonner `p-4`/lg, sidebar item `h-8`/`p-2`, dropdown item `px-2 py-1.5`/sm).
- [ ] Focus = **nothing** (the `ring`=primary token did it).
- [ ] (Optional) adopt `--text-*` utilities in components, or leave Tailwind classes + spec guidance.

### Phase 4 — Validation gates (comprehensive)

- [ ] `pnpm build` clean (turbo, all packages).
- [ ] `contrast-check` (both themes) + `design-lint` (no hex/palette/!important/icon-source).
- [ ] Unit tests + **vitest-axe** (a11y) — update any test asserting old heights/classes.
- [ ] **VRT screenshots — regenerate ALL** (sizing/colour/focus all changed → every screenshot diffs); review. ⚠ biggest review surface.
- [ ] **Registry integrity** — component source changed → re-run `tooling/registry-hash.mjs` (+ stamp/verify); `meta.integrity` SHA-256 must match.
- [ ] Docs app full visual QA, light+dark, every component page.

### Phase 5 — Spec ↔ tokens reconciliation

- [ ] Align `design.md` ramp step keys to the actual repo keys (`50–950`, not `0–1000`).
- [ ] Reconcile `motion-ease` (keep repo `[0.2,0,0,1]`; update spec note).
- [ ] (Later) the generator: design.md generated-from-tokens + CI drift-check (provenance promise).

### Phase 6 — Artifact & docs cleanup

- [ ] `proposed-design-system.html` is superseded (translucent border, single-accent picker, no-ring) — archive it or update to final (purple brand + blue info + solid border + neutral ring). Rec: archive/note as exploration.
- [ ] Update any MDX/docs in apps/docs referencing old values.

### Phase 7 — Commit / handoff (USER-TRIGGERED)

- [ ] `pnpm build` + full diff review → draft commit message → **wait for "commit"** → `git pull --rebase` → **wait for "push"**. No npm publish / Cloudflare deploy (irreversible/public — user only).

### Critical path & risk

- **Critical path:** Phase 1 (tokens) unblocks the visual re-skin immediately; Phase 2 unblocks Phase 3. Phase 3 + 4 are the bulk.
- **Biggest risks:** (1) VRT screenshot churn (every component changes — large review); (2) registry-integrity hashes must be regenerated or consume fails closed; (3) component tests asserting old sizes; (4) Phase-2 build-config for composite type/shadow is the only genuinely new engineering.
