# Brand Forensics — Computed-Style Teardowns (2026-07-15)

Method: ran a computed-style extractor in the live browser on each site's homepage (every visible element: font stacks, sizes, weights, tracking, text-transform, colors, backgrounds, border-radius — with usage counts). This is measured data, not impressions. Raw JSON captured in-session; distilled below.

## primeintellect.ai (MK's primary reference)

| Dimension         | Measured                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts             | **Geist 294** text els (body+headlines!) · **ABC Favorit Mono 94** (brand voice, commercial face by Dinamo) · ABC Favorit 13 · Geist Mono 4 (code only)  |
| Mono role         | **Labels only**: 12px ×72, 10px ×12, 14px ×4 — 100% of mono usage is `uppercase`, tracking +0.02–0.05em, weight 400 (some 500). **Zero mono headlines.** |
| Headlines         | Geist at 20/28/36px, **weight 400** — hierarchy is size+color, never weight                                                                              |
| Weights           | 400 across the board (Geist 294/294 at 400!)                                                                                                             |
| Text color system | **White-alpha ramp**: white @ /0.85 /0.62 /0.5 /0.45 /0.4 /0.25 /0.2 — no gray tokens, alpha does hierarchy                                              |
| Backgrounds       | Neutral near-blacks: rgb(14/16/22/25) + white-alpha washes /0.02–0.25                                                                                    |
| Accent            | rgb(133,237,117) phosphor green on **9 elements total** on the entire homepage                                                                           |
| Radius            | **0px everywhere** (only 9999px pills ×9 for dots/avatars); buttons 0px                                                                                  |

## vercel.com (Geist's home)

| Dimension   | Measured                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts       | GeistSans 130 · **Geist Mono 48 (27% share)**                                                                                               |
| Mono role   | 14px ×28 (uppercase ×20), 8px ×9 (uppercase micro-annotations), 12px ×8; weights **600 ×24 / 400 ×23** — Vercel semibolds small mono labels |
| Headlines   | Sans 24–64px, tracking **−5% to −6%** (24px @ −1.2px, 48px @ −2.88px, 64px @ −3.84px), weights 400/500 only                                 |
| Text colors | Cool grays: 136/136/136, 237, 161 — effectively achromatic; single blue occurrence                                                          |
| Backgrounds | rgb(10,10,10) black, near-blacks                                                                                                            |
| Radius      | 2px ×9 · 4px · **6px ×14** · pills; buttons 4–6px                                                                                           |

## linear.app

| Dimension   | Measured                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts       | Inter Variable 395 · **Berkeley Mono 132 (25% share)**                                                                                              |
| Mono role   | **14px ×118** — Linear pushes mono into short descriptive body blocks, not just labels; 12px ×12; all weight 400; uppercase rare (Berkeley 12px ×7) |
| UI text     | Inter 12/13/15px dense; weights 400/510/590 (variable); headlines 24/38px, tracking −1% to −2.2%                                                    |
| Text colors | Cool grays + pastel accents (pink/peach/green) but accents live in illustration washes, not chrome                                                  |
| Backgrounds | White-alpha washes (/0.02 /0.03 /0.05 /0.08) on near-black — same alpha-ramp trick as PI                                                            |
| Radius      | 2px ×48 · 6px ×41 · 4px ×27 · 8px · pills — small-radius, not sharp                                                                                 |

## Convergent findings (all three sites)

1. **Two-font system, universally**: workhorse sans + characterful mono. Mono share on marketing pages: 23–27% of text elements. The mono IS the brand voice.
2. **Mono never does display work.** It lives at 8–14px: eyebrows, annotations, CTAs (PI), data, short body blocks (Linear max). Headlines are always the sans.
3. **Weight discipline is extreme**: 400 dominates everywhere (PI: 100% of Geist at 400). Hierarchy = size + alpha, not weight. Vercel's exception: 600 on tiny mono labels only.
4. **Display headlines = tight negative tracking** (−2% to −6%), moderate weight — never bold.
5. **Alpha-ramp text hierarchy** (PI 7 alpha steps of white; Linear alpha washes): one ink, many opacities — matches our warm-neutral + tokenized-opacity direction exactly.
6. **Accent rationing is severe**: PI's green = 9 elements/page. Linear's pastels = imagery only. Vercel = fully achromatic.
7. **Sharpness varies — PI 0px is the outlier**; Vercel/Linear sit at 2–6px. "Technical" reads as SMALL radii + mono voice + monochrome, not necessarily 0px.
8. **Uppercase is mono-exclusive** (PI 100%, Vercel ~100%): uppercase sans is essentially absent from all three.
