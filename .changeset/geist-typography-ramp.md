---
"@vegastack/design": patch
"@vegastack/design-tokens": minor
"@vegastack/ui": minor
---

🔧 Typography: a global Geist-spec ramp replaces per-component type decisions

The system had no typography contract at all — the shadcn reset resolved TYP-1…TYP-9 and TYP-11 as
**shadcn**, which left every size, weight, line-height and letter-spacing to Tailwind's stock values
plus 229 local decisions across 112 component files. Nothing was globally declared, and nothing
carried letter-spacing at any size.

Four new decisions (MK, 2026-09-22), all declared once and inherited everywhere:

- **TYP-15 — heading-tier optical metrics.** At `text-lg` and above, line-height and letter-spacing
  follow Geist's heading spec, declared as per-size `--text-*--line-height` and
  `--text-*--letter-spacing` in the `@theme inline` bridge. Tracking runs −0.012em at 18px to
  −0.06em at 72px. Geist's copy tier carries zero letter-spacing, and this system's body sizes are
  its copy tier, so `text-xs`/`text-sm`/`text-base` are untouched and render byte-identically.
  SIZES do not move, so TYP-1 stays **shadcn** and a pasted shadcn snippet still renders at
  upstream's size.
- **TYP-16 — Geist rendering.** `-webkit-font-smoothing: antialiased` on `body`. Geist is drawn for
  it; without it the same weight renders heavier and softer than the identical weight elsewhere.
- **TYP-17 — a declared 14px default body size**, on `body` and never on `html`. `rem` resolves
  against the root, so an `html` size would rescale every token and override the reader's browser
  font-size preference. Previously unclassed text fell back to 16px while components were 14px.
  The docs shell keeps its 16px reading size.
- **TYP-18 — no arbitrary font size.** Upstream's `text-[0.8rem]` (`button` sm, `toggle` sm,
  `calendar`) and `text-[0.625rem]` (`questionnaire`) now sit on the ramp. Upstream's ladder does
  scale type with control size and is KEPT — the `sm` half-step resolves down to `text-xs` rather
  than flattening up to 14px.

Also enforced: **TYP-10** ("tabular figures on code and data") had been **ours** since the reset
with no gate at all, and `number-field` shipped proportional digits whose value jittered on every
stepper press. It now carries `tabular-nums`, and three new `design-lint` rules — `raw-tracking`,
`arbitrary-text-size` and `tabular-figures` — hold all of the above, each with negative-specimen
coverage in `verify-design-lint-structural`.

Block heading weight is normalised to `font-semibold`; chart figure labels keep `font-bold`.

**Markdown surfaces.** `prose.root` never declared a font family, and neither of its two consumers
(`MarkdownView`, `TextEdit`) sets one — so prose inherited whatever surrounded it, and inside any
mono container the whole tree rendered in Geist Mono: headings, paragraphs, table cells, and the
`1.` / `2.` markers of an ordered list, since `::marker` inherits font properties from its element.
The recipe now declares `font-sans`, making mono the exception it names explicitly (`code`, `pre`,
`pre code`) rather than something prose falls into by accident.

**No uppercase, anywhere.** `design.md` § Voice & content has always said sentence case for
everything and TYP-7 resolves as **shadcn** ("No uppercase"), but twelve `font-mono text-xs
uppercase tracking-wide` eyebrows had survived across the docs shell, plus the `terminal` and
`code-block` header labels and the OG card. Two were a correctness bug rather than a style one: the
home page rendered real CSS custom-property names through the transform, so `--text-lg` displayed
as `--TEXT-LG`. All of it is removed and gated by a new `uppercase-transform` rule, which bans the
CSS transform rather than uppercase text — if a string is uppercase, write it that way. That also
removed the only justification for positive `tracking-*`, which existed to make uppercase legible,
so `raw-tracking` now allows `tracking-widest` alone (the menu shortcut hint). `code-block` now
shows `tsx` as given instead of `TSX`, and `terminal` shows `Terminal`.

The principle applied throughout: **mono is for code, uppercase is for nothing** — content that is
code keeps `font-mono`, content that is language is `font-sans` in sentence case.

**The docs site.** Fumadocs' `.prose` writes `font-size` directly rather than through a utility, so
its headings tracked the ramp's sizes but never its letter-spacing, `h1` rendered at weight 800
(`h1 strong` at 900) and `h3` at 1.6 leading. All four now reference the ramp variables at weight 600. Two arbitrary sizes baked into Fumadocs' own class strings — 15px on the sidebar, tabs and
accordion, 13px on code blocks — are pulled onto `--text-sm`, putting every piece of docs chrome at
the same 14px as the product layer. Prose body stays 16px; it is a reading surface.
