# VegaStack Brand Direction — Evidence-Based Synthesis (2026-07-15)

Sources: 14-brand-forensics.md (computed-style teardowns: primeintellect.ai, vercel.com, linear.app) · 15-geist-typography.md (Geist family + mono/serif research) · 16-brand-landscape.md (12-company survey). Every rule below traces to measured data or a cited source, not taste.

## The core insight

What MK responds to on primeintellect.ai is NOT "mono headlines" — measured, PI has zero mono headlines. It is four disciplines compounding:

1. **A mono voice layer** — uppercase 10–14px labels/annotations/CTAs (23–27% of text elements across PI/Vercel/Linear)
2. **Extreme weight discipline** — 400 everywhere (PI: 100% of Geist at 400); hierarchy from size + alpha, never bold
3. **One-ink alpha-ramp** — white at 7 tokenized opacity steps instead of many gray tokens
4. **Severe accent rationing** — the green appears on 9 elements on PI's entire homepage

Sharp corners are PI's outlier move (Vercel/Linear read equally "technical" at 2–6px). The 7-of-8 surveyed pattern: small functional radii + ONE rationed sharp/pill gesture.

## Typography roles (all tokenized)

| Role            | Face                                          | Spec                                                                                                                            | Where                                                                                                        |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| UI & body       | Geist Sans                                    | 400 default · 500 labels · 600 rare emphasis (D3 cap)                                                                           | product + marketing                                                                                          |
| Display         | Geist Sans                                    | 32/40/56/72 · weight 400–500 · tracking −2% (24px) → −5/−6% (56–72px), tokenized `tracking-display-*`                           | marketing, docs heros                                                                                        |
| **Brand voice** | Geist Mono                                    | **uppercase · 12px floor (10px only for FIG-style annotations) · tracking +0.04–0.06em · weight 400/500 · `tnum` when numeric** | eyebrows, section numbers (01/1.1), FIG annotations, marketing CTAs, live-state labels, terminal, IDs/hashes |
| Data numerals   | Geist Mono                                    | `tabular-nums`                                                                                                                  | stat tiles, tables, prices (MK standing preference: mono for numbers)                                        |
| Serif accent    | **Newsreader italic** (recommended over Lora) | display emphasis words + pull-quotes ONLY — never long-form italic (readability research)                                       | marketing heros, testimonials                                                                                |
| ~~Geist Pixel~~ | decorative display cut (Feb 2026)             | **skip** — decorative register, trend-dated risk; revisit only as a single deliberate hero flourish                             | —                                                                                                            |

Hard rules (lintable): **uppercase is mono-exclusive** (uppercase Geist Sans is banned — matches PI/Vercel measured behavior 100%); mono never in headlines or long-form body; italic never for running text. Geist Serif is in development at Vercel — revisit the serif accent when it ships.

## Color & surface

- **Marketing ground**: the warm neutral ramp's dark end (hue 75, near-black steps) — NOT pure black. This keeps marketing↔product temperature continuous, mitigating the one genuinely untested risk the survey flagged (no surveyed company crosses dark-marketing → light-product; our bridge is shared hue + shared accent + shared mono voice + docs living dark-comfortably).
- **Alpha-ramp text hierarchy** (PI/Linear pattern): foreground = one ink at tokenized alpha steps (slots directly into the Phase 0 opacity token scale — same tokens serve both). Grays for surfaces, alpha for text hierarchy.
- **Accent budget, codified**: marker roles only — live/AI-state dot, sparkline endpoint, eyebrow highlight, terminal prompt glyph. Target ≤ ~10 accent elements per marketing page (PI's measured budget: 9). Never: fills, borders-at-rest, headlines, buttons (except the accent-outline marketing CTA), decorative washes beyond one radial.
- Vercel/Linear/Supabase (the three calibration companies) all converge on exactly this: one accent, marker roles, monochrome everything else.

## Shape

- **Product: unchanged** 6/8/12 (measured: Linear ships 2/4/6/8, Vercel 2–6 — our scale is already in the durable zone).
- **Marketing sharp gesture: 2px** (`radius-sharp`), not 0px — rationed to CTAs, chips, figure frames. 2px reads sharp at a glance but stays kin to the product scale; 0px-everywhere is PI's outlier and the all-sharp holdout (Together AI) is alone in the survey.
- Pills stay for the existing full-radius objects (badges, avatars, switches).

## Durability judgment (from the survey)

- Terminal-green-on-dark reads current _because of discipline_, not nostalgia — the saturating cliché in 2026 is undisciplined dark-navy-plus-gradient.
- Restrained mono (labels/data) is durable dev-culture vocabulary; full mono-headline branding is niche/indie and would date.
- The serif-accent trend (Claude, Perplexity school) + mono voice combination is the current "2026 and beyond" synthesis — exactly the D17 direction, with Newsreader sharpening it.

## MK decisions (2026-07-15 — folded into plan v4 as D17/D20)

1. Serif accent: **Newsreader confirmed** (Lora dropped from docs entirely); revisit when Geist Serif ships.
2. Geist Pixel: **one sanctioned hero flourish** (tokenized display-accent role + documented single-use rule) — not skipped.
3. Mechanics confirmed: alpha-ramp text hierarchy, firm 2px sharp gesture, uppercase-is-mono-exclusive + mono≤14px lint rules.
4. Accent budget: **guidance, not lint** — marker-roles rule documented in design.md, no numeric per-page enforcement (MK's call).
5. Marketing ground = warm ramp dark end (not pure black) for temperature continuity.
