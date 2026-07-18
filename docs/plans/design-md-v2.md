# Plan — v2 `design.md` (canonical VegaStack design spec)

**Status:** awaiting approval. Operating mode: build LOCAL, stop at publish/deploy.
**Source of truth for visuals:** `docs/research/design-comparison/proposed-design-system.html` (interactive, both themes, AA-verified live).
**Output:** rewrite the root `design.md` (v1 is 344 lines, pre-overhaul values) → v2 with every decision below.

---

## 1. What is locked (decided, built, verified in the artifact)

| Area | Decision |
|---|---|
| Neutrals | Warm ramp, OKLCH hue 75 / chroma 0.003. 14 steps `n0–n1000`. **One ramp, both themes.** Dark bg `#131211` (deep, not espresso). |
| Primary | **Neutral ink** = the workhorse (`n700` light / `n200` dark). Almost every button. |
| Type | `display` 300 (hero only) · `h1–h3` 400 · `h4` 500 · `text-lg/base/sm` · `label` 500 · `code` (Geist Mono, tabular). Never 600+. |
| Border | **ONE** translucent-ink border (`.11` light / `.13` dark) on every card/input/table/overlay. Plus `scrim` for the modal dim. No separate alpha scale. |
| Focus | **No rings.** `:focus-visible` mirrors hover; inputs darken border to the **primary ink**; links underline. |
| Radius | 4 steps: 6 / 8 / 12 / full. |
| Elevation | Flat (hairline only). Overlays get **one** soft shadow. 5-rung surface ladder. |
| Motion | 0/150/200/300ms · `cubic-bezier(0.4,0,0.2,1)` · honours `prefers-reduced-motion`. |
| Icons | lucide only, `currentColor`, 14/16/20/24, 1.5–2px stroke. |
| A11y | WCAG 2.1 AA, **14/14 text pairs pass both themes** (computed live). Colour-never-alone. Targets 24/44. |
| Voice / Do's & Don'ts | Written. |

---

## 2. Colour model — **UPDATED (please confirm)**

Earlier we rationed to **one** accent and said "info uses the accent." Per the latest decision that changes to **two rationed chromatics + status**, all on top of the neutral primary:

| Role | Colour | Used for | Rationing |
|---|---|---|---|
| **Primary** | Neutral ink (black/white) | Default buttons, surfaces, text | The workhorse — bulk of the UI |
| **Brand accent** | **Purple** (`#774bcb`…) | AI/agent moments, the one key CTA highlight, selected state | Sparing — "whenever we want" |
| **Info** | **Blue** (`#0068d2`…) | **Links**, informational badges/alerts | Sparing — conventional blue = link/info |
| Destructive | Red | Errors, destructive actions | State only |
| Success | Green | Positive state | State only |
| Warning | Orange | Caution | State only |
| Data-viz | categorical (series-1 = brand/purple) · sequential (purple-hued) · diverging (red↔neutral↔green) | charts | separate scale |

- Both **blue** and **purple** families are already defined with full ramps (subtle/fill/hover/active/text, light+dark) and verified AA. No new colour computation.
- **Reversal noted:** "info uses the accent" is dropped — info is now its own blue. Indigo is dropped.
- **Discipline (two cool colours):** purple ≈ hue 295, blue ≈ hue 256 — distinguishable but both cool. Keep roles clean: **blue = link/info text**, **purple = brand/action fills**. Don't sit a blue link inside a purple action cluster where "which is clickable?" gets ambiguous.

### ⚠ Token-naming decision this forces (key item)
We use shadcn registry + Base UI. In **shadcn**, `--primary` = the main action colour and `--accent` = the *neutral hover/selected* fill. Our mapping:

| Ours (artifact) | shadcn / Tailwind v4 name | Value |
|---|---|---|
| neutral primary | `--primary` / `--primary-foreground` | neutral ink ✓ (shadcn-compatible) |
| neutral hover wash (`--hover-fill`) | `--accent` / `--accent-foreground` | neutral ✓ (matches shadcn's meaning) |
| **purple brand** | **NEW `--brand`** (not `--accent`, to avoid breaking shadcn hovers) | purple |
| **blue info** | **NEW `--info` / `--info-foreground`** | blue |
| single border | `--border` (+ `--input`, `--sidebar-border` alias to it) | `.11`/`.13` |
| focus | `--ring` = primary ink | — |
| status | `--destructive` + custom `--success` / `--warning` | — |

**Recommendation:** name the purple brand accent `--brand` (keep shadcn `--accent` = neutral hover). Confirm or override.

---

## 3. v2 `design.md` structure

Follows the reference format (Vercel/ElevenLabs/Cursor) + our additions:

0. **Frontmatter** — DTCG token block + Tailwind v4 `@theme inline` mapping (machine-consumable).
1. **Overview** — philosophy: warm-neutral, restrained, futuristic; light+dark co-primary; rationed colour.
2. **Colour** — neutral ramp · primary · brand (purple) · info (blue) · status · data-viz (3 scales) · the one border + scrim.
3. **Typography** — full scale, weights, tabular figures.
4. **Spacing & layout** — 4px scale, rhythm, container, breakpoints.
5. **Radius** — 4 steps.
6. **Elevation & surfaces** — flat, one overlay shadow, surface ladder.
7. **Motion** — durations, easing, reduced-motion, AI motion.
8. **Iconography** — lucide, sizes, stroke, currentColor.
9. **Components** — variants (primary/brand/secondary/ghost/destructive/soft) · sizes (sm/md/lg) · states (default/hover/focus/active/disabled/loading) · inventory (forms, badges, alerts, tabs, table, overlays, nav, avatars, progress, skeleton, accordion, command palette, AI surfaces).
10. **Accessibility** — AA contract, contrast table (both themes), focus model, colour-never-alone, targets, reduced-motion.
11. **Voice & content** — errors / toasts / empty states / in-progress / casing / numbers.
12. **Do's & Don'ts** — consolidated rules.

---

## 4. Open items to confirm before writing

1. **Colour model** (§2): purple = brand accent, blue = info/links. ← the big one.
2. **Token naming** (§2): brand accent = `--brand` (keep shadcn `--accent` = neutral hover). 
3. **Lede paragraph** weight: currently 300 (light intro). Bump to 400 for full consistency? (minor)
4. Accent stays **swappable** via tokens (ships purple), per the tokenization goal — assumed yes.

---

## 5. Next steps (after approval)

1. (Optional) Update the artifact to show **purple brand + blue info** live, so it's visually confirmed before the spec is frozen.
2. Write v2 `design.md` to repo root (local only — no publish).
3. (Later, separate) feed values into `packages/tokens` (DTCG → Style Dictionary) per the implementation plan.
