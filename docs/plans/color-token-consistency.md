# Color Token Consistency Overhaul

**Goal:** Make color tokens _identical_ across `design.md` (spec) ↔ `packages/tokens` source/`theme.css` ↔ components ↔ docs. Ship every token design.md specs (no opacity-derived colors). Fix the foreground split that made `purple-foreground` look whiter than `info-foreground`.

**Status:** ✅ DONE (local, uncommitted). All gates green: contrast 60/60, design-lint clean (registry + token-css src/app), verify-headers 64/64, tests 670/670, live preview verified light + dark.

**Two findings during execution:**

1. **design.md fills had drifted from css** — design.md `destructive/success/warning` fills (`#d72630`/`#0c853d`/`#c94d08`) were _lighter_ than the css primitives (`red.700`/`green.750`/`amber.750`) and some failed AA with the off-white foreground. Kept the darker, AA-safe css fills and synced design.md hexes + ratios to them.
2. **hover/active direction bug (caught + fixed)** — taking hover/active straight from design.md on top of the darker css fills made hover _lighter_ than fill for destructive/warning. Re-tuned all five families to darken uniformly (hover = fill −0.05 L, active = −0.09 L, same hue/chroma); verified hover<fill for every family.

**Decided to NOT do (surfaced to MK):** the remaining component-level opacities that design.md does not tokenize — `border-destructive/70` (invalid border, intentional), soft-button hover steps (`/20` `/30`) + outline-soft (`border-/50 bg-/5 hover:bg-/10`), alert/sonner decorative borders (`/20` `/30`), `hover:bg-purple/15` (chip clear-button), `text-info-text/80` (link hover). Kept as deliberate opacities; no `bg-{family}/NN` lint ban added (would false-positive on these).

---

## Locked decisions (from MK)

1. **On-fill foreground:** every chromatic `*-foreground` → `{color.neutral.50}` (one warm off-white), both themes. (Was: purple=`white` 0.994, others=`neutral.50` 0.985.)
2. **Ship all, don't derive:** add real CSS vars for `subtle`/`hover`/`active` (×5 families), `primary-hover`/`primary-active`, `muted-foreground-faint`, and `*-bright` (data-viz). Swap component opacity classes → tokens.
3. **Dark-mode philosophy → HONOR design.md (my call, MK delegated):** chromatic **fill/hover/active/foreground are theme-independent**; only **subtle + text + charts** vary by theme. The implementation had drifted (it brightened status fills in dark + flipped to dark text) — that drift is exactly what created the purple anomaly. Honoring the spec removes it and makes foregrounds uniform.

### Contrast double-check (computed via the gate's OKLCH→WCAG math)

- `neutral.50` on each theme-independent fill: destructive 6.15, success 5.23, warning 5.56, info 5.13, purple 5.51 — all **PASS** (same in both themes, since fill+text are identical across themes).
- Light `-text` on background: all **PASS** (5.50–6.31). _(Correction to my earlier audit: warning-text is 5.70:1, it does NOT fail.)_
- Dark `-text` on bg/card: all **PASS** (6.7–8.8).
  → Honoring design.md is fully AA-safe. The only requirement it imposes on components: use `{family}` for **fills** (white text on top) and `{family}-text` for **page text** (never the raw fill as text), so dark page text stays bright via the `-text` token.

---

## Exact new/changed token values (OKLCH, from design.md hex)

### New primitives (`primitives.tokens.json`)

```
neutral.500  oklch(0.63  0.003 84.6)   # muted-foreground-faint (light)  (#8a8987)
neutral.550  oklch(0.559 0.003 84.6)   # muted-foreground-faint (dark)   (#757472)
neutral.850  oklch(0.236 0.002 67.8)   # primary-active (light)          (#1f1e1d)  [primary-hover light reuses neutral.800≈#2c2b2a]
purple.300   oklch(0.719 0.156 294.8)  # purple-bright / chart-1 dark    (#ac8efb)
purple.700   oklch(0.48  0.191 294.8)  # purple hover                    (#693abb)
purple.800   oklch(0.44  0.189 294.8)  # purple active                   (#5e2dad)
blue.300     oklch(0.72  0.147 256.4)  # info-bright                     (#64a6ff)
blue.600b    oklch(0.481 0.167 256.4)  # info hover                      (#005ab9)
blue.650     oklch(0.44  0.153 256.4)  # info active                     (#004fa4)
red.600      oklch(0.525 0.21  24.8)   # destructive hover               (#c70722)
red.750      oklch(0.479 0.194 25)     # destructive active              (#b1011b)
red.800      oklch(0.521 0.2   25)     # destructive-text light          (#c21725)
green.850    oklch(0.495 0.136 150)    # success hover                   (#007634)
green.900    oklch(0.452 0.125 149.7)  # success active                  (#00682c)
amber.800    oklch(0.534 0.162 41.6)   # warning hover                   (#b64200)
amber.850    oklch(0.49  0.147 42.3)   # warning active                  (#a13b00)
amber.700b   oklch(0.52  0.139 42.1)   # warning-text light              (#a8471b)
# subtle tints (light/dark) per family:
purple.subtle.L      oklch(0.959 0.02  295.2)   purple.subtle.D      oklch(0.276 0.06  294.7)
info.subtle.L        oklch(0.961 0.018 253.3)   info.subtle.D        oklch(0.275 0.059 255.4)
destructive.subtle.L oklch(0.949 0.022 24.4)    destructive.subtle.D oklch(0.275 0.07  25.3)
success.subtle.L     oklch(0.951 0.051 149.6)   success.subtle.D     oklch(0.276 0.061 149.9)
warning.subtle.L     oklch(0.96  0.019 41.8)    warning.subtle.D     oklch(0.28  0.069 42.5)
```

_(Primitive names indicative; final naming to fit the existing ramp scheme. Light `-text` for success/info already match design.md — keep green.800/blue.800; purple-text light → 0.52 0.17 295 matches #734dbe.)_

### `semantic.tokens.json` (light) — changes

- `purple-foreground`: `{color.white}` → `{color.neutral.50}`.
- Add per family (purple, info, destructive, success, warning): `{f}-hover`, `{f}-active`, `{f}-subtle`.
- `destructive-text` → red.800 (#c21725); `warning-text` → amber.700b (#a8471b); `purple-text` → 0.52 0.17 295 (#734dbe). _(success/info-text unchanged.)_
- Add `primary-hover` (neutral.800), `primary-active` (neutral.850), `muted-foreground-faint` (neutral.500).
- Add `purple-bright` (purple.300), `info-bright` (blue.300).

### `semantic.dark.tokens.json` — changes (honor-spec → fewer overrides)

- **Remove the dark fill drift** — set theme-independent (= light): `destructive`→red.700, `success`→green.750, `warning`→amber.750, `info`→blue.700. (purple already constant.)
- **Foregrounds** → `{color.neutral.50}` for ALL chromatics (was neutral.950). (primary-foreground stays neutral.950 — primary inverts.)
- Add dark `{f}-subtle` (the `.D` tints above).
- `{f}-hover`/`{f}-active`: theme-independent → same refs as light (purple.700/800, etc.).
- Keep dark `-text` tokens as-is (red.400, green.500, amber.500, blue.400, purple.400 — these are the page-text colors and PASS).
- `primary-hover`→neutral.100, `primary-active`→white; `muted-foreground-faint`→neutral.550.
- **chart-1 dark fix:** `{purple}` → `purple.300` (#ac8efb bright) to match chart-2..8 which are already bright + design.md.

---

## Component propagation (canonical `packages/ui/registry/ui/*` only)

Swap derived opacity → shipped tokens:

- `bg-{family}/10` → `bg-{family}-subtle` (alert, badge, callout, etc. — 23 hits)
- `hover:bg-primary/90` → `hover:bg-primary-hover`; add `active:bg-primary-active` where applicable (button)
- `hover:bg-{family}/90` → `hover:bg-{family}-hover`; `active:` → `-active`
- Audit `text-{family}` used as **page text** → `text-{family}-text` (required for dark legibility under honor-spec)
- Ad-hoc border tints (`border-{family}/20|30|50`, `bg-{family}/5|20`, `hover:bg-{family}/15|20|30`): these have NO design.md token. Decide per-use: collapse to `-subtle`/`-hover` where that's the intent, else keep as a deliberate opacity (document). **Surface the final list to MK.**
- `muted-foreground/NN` placeholders/disabled → `text-muted-foreground-faint` where it matches design.md intent.

Then `npm run registry:build` (regenerates copy-in + JSON + integrity headers).

## Tooling

- `contrast-check.mjs`: (a) use the real `{family}-subtle` token instead of the `/10` composite approximation; (b) ADD a `{family}-text on background/card` page-text check; (c) include `purple` already present.
- `design-lint.mjs`: allow new tokens; optionally flag raw `bg-{family}/NN` to prevent regression.

## Docs

- `apps/docs/components/foundations.tsx` `ColorPalette`: add subtle / hover / active / bright / faint rows → full coverage of the now-larger token set.
- `colors.mdx`: rewrite "Per-family variants" from "derived" → "shipped tokens" (subtle/hover/active/text/bright all real vars).
- `design.md`: update `foreground: #ffffff` → neutral.50 (#fbfaf8) for chromatics + primary-foreground; confirm line 82 (now TRUE under honor-spec); note chart-1 dark = bright.

## Verification

1. `npm run build` (tokens) → inspect new `--*` + `@theme inline` bridges in theme.css.
2. `node tooling/contrast-check.mjs` (extended) — must be all-PASS.
3. `npm run registry:build` → verify-headers clean.
4. `node tooling/design-lint.mjs` (registry + token-css) clean.
5. Component tests (`pnpm test`).
6. Live preview: colors page + a few components (alert/badge/button) in **light AND dark**.

## Rollback

All uncommitted; `git checkout` per file.
