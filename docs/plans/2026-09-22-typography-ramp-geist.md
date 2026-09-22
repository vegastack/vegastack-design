# Typography — one global ramp, Geist metrics (2026-09-22)

**Status:** implemented. Decisions TYP-15/16/17/18 ratified by MK during the work.
**Target shape:** Vercel / Geist spec.

## 1. What was actually wrong

Not "the tokens are messed up" — **there was no typography contract to be broken.** Batch 1 of the
shadcn reset (2026-09-18) resolved TYP-1…TYP-9 and TYP-11 as **shadcn**, deleting the size scale,
the 400/500 weight ladder, the role utilities and the tracking rules, and taking seventeen
design-lint rules with them. What remained:

- `semantic.tokens.json` carried four typography tokens, **all font-family**.
- The `@theme inline` bridge declared **zero** `--text-*`, `--leading-*`, `--tracking-*`,
  `--font-weight-*`.
- 112 component files held **229 local font-size decisions, 83 local weight decisions, 5 tracking
  decisions**. Four of those five were `tracking-widest`; the system had **no negative tracking at
  any size**, which is the single biggest visual gap against Linear and Vercel.
- `-webkit-font-smoothing: antialiased` appeared **nowhere**.
- **No default body size existed.** Unclassed text fell back to the browser's 16px while components
  were 14px, so a page mixed two sizes.
- TYP-10 ("tabular figures on code and data") had been **ours** since the reset with **no gate at
  all**.

## 2. Scope (final)

Grew three times as MK reviewed. End state: the product layer, the docs site, and every
markdown-rendering surface.

1. The global ramp and the rendering/default-size rules.
2. Every off-ramp size and every ramp-overriding tracking utility in the registry.
3. Lint rules so none of it can drift back, each with negative coverage.
4. **The Fumadocs site itself** — prose headings and the shell's own chrome.
5. **Markdown-rendering components** — `MarkdownView`, `TextEdit`, and the prose recipe behind both.

## 3. The mechanism

Verified against the installed Tailwind 4.3.3 (`dist/chunk-*.mjs`):

    resolveWith(…, ["--text"], ["--line-height","--letter-spacing","--font-weight"])

Per-size `--text-{size}--line-height` and `--text-{size}--letter-spacing` resolve off the theme, so
declaring the ramp once re-metrics every `text-*` utility in every file with **no component edit**.
Proven by compiling probes through Tailwind's own `compile()` rather than assumed.

## 4. The ramp

Geist splits a **copy** tier (letter-spacing 0) from a **heading** tier (negative, scaling with
size). This system's body sizes are 12/14/16 — exactly Geist's copy tier — so the copy tier is not
declared at all and renders byte-identically.

| step        | px  | lh before  | lh after | ls after |
| ----------- | --- | ---------- | -------- | -------- |
| `text-xs`   | 12  | 16         | —        | —        |
| `text-sm`   | 14  | 20         | —        | —        |
| `text-base` | 16  | 24         | —        | —        |
| `text-lg`   | 18  | 28 (1.556) | 26       | −0.012em |
| `text-xl`   | 20  | 28         | 26       | −0.02em  |
| `text-2xl`  | 24  | 32         | 32       | −0.04em  |
| `text-3xl`  | 30  | 36         | 38       | −0.04em  |
| `text-4xl`  | 36  | 40         | 44       | −0.05em  |
| `text-5xl`  | 48  | 48         | 56       | −0.06em  |
| `text-6xl`  | 60  | 60         | 64       | −0.06em  |
| `text-7xl`  | 72  | 72         | 72       | −0.06em  |

Two deliberate calls: stock `text-lg` was **looser** than `text-base` (1.556 vs 1.5), which is
non-monotonic and backwards; and `3xl`–`5xl` go **looser**, because stock Tailwind collapses them
toward 1.0, which clips Geist's descenders once negative tracking pulls the glyphs together (Vercel
runs 48px at 56px leading, not 48).

**Sizes never move**, so TYP-1 stays **shadcn** and a pasted shadcn snippet still renders at
upstream's size. **Weight is deliberately not in the ramp** — per-size `--font-weight` would force
every `text-2xl` to one weight and break the component layer's legitimate mix.

## 5. Decisions

| ID         | What                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| **TYP-15** | Heading-tier optical metrics in the `@theme` bridge; copy tier held at 0; no local tracking |
| **TYP-16** | `-webkit-font-smoothing: antialiased` on `body` (Geist is drawn for it)                     |
| **TYP-17** | A declared 14px default body size, on `body` and **never** `html`                           |
| **TYP-18** | No arbitrary font size; upstream's control ladder kept, half-steps resolved onto the ramp   |

TYP-10 needed no new row — it was already **ours**, so its patches name it directly.

## 6. What changed

**Tokens and rendering**

- `packages/design-tokens/sd-hooks.mjs` — the ramp, in the `tailwind/inline-bridge` formatter.
- `packages/design-tokens/src/base.css` — TYP-16 + TYP-17 on `body`.

**Components** (five patches, each header naming its ID)

- `button` sm, `toggle` sm: `text-[0.8rem]` → `text-xs`; `calendar` weekday/week-number → `text-xs`;
  `questionnaire` shortcut badge `text-[0.625rem]` (10px) → `text-xs` (TYP-18).
- `empty`: `tracking-tight` at 14px removed — the registry's only copy-tier tracking (TYP-15).
- `number-field`: `tabular-nums` on its `Intl.NumberFormat` value (TYP-10).
- Six upstream login/signup block `h1`s: `font-bold` → `font-semibold`. The seven chart `font-bold`
  are SVG **figure labels**, a different role, untouched.

**The docs site** (`apps/docs/app/global.css`)

The ramp reaches every `text-*` utility for free. Two surfaces do not go through a utility and were
the only places on design.vegastack.com still rendering with no tracking:

- **Prose headings.** Fumadocs' `.prose` is `@tailwindcss/typography`, which writes `font-size`
  directly, so sizes tracked the ramp while letter-spacing never did. `h1` was weight **800** and
  `h1 strong` **900** — weights that appear nowhere else in this system, whose heaviest is 600.
  `h3` sat at 1.6 leading. All four headings now reference the ramp variables (never restated) at
  weight 600. Prose **body stays 16px**: it is a reading surface, the same line Vercel draws
  between its dashboard and its docs.
- **Two arbitrary chrome sizes** baked into Fumadocs' own class strings, invisible to any lint of
  ours because they live in `node_modules`: `text-[0.9375rem]` (**15px — the docs sidebar**, tabs,
  accordion) and `text-[0.8125rem]` (13px — code blocks, tab dropdown). Both pulled onto
  `--text-sm`, putting all docs chrome at the same 14px as the product layer.
- Three display headings carrying `tracking-tight`/`tighter` **looser** than the ramp they override
  (`not-found`, `foundations`, `home-proof-statement`) — removed so the ramp applies.

**Markdown surfaces** (`packages/design/src/prose.ts`)

`prose.root` was `"text-sm text-foreground"` — **it never declared a font family.** Neither of its
two consumers sets one either: `MarkdownView` and `TextEdit` both wear nothing but
`proseClassName`. So prose inherited whatever surrounded it, and inside any mono container
(`terminal-body` is one in this very registry; a chat or log panel is the obvious consumer case)
the **whole tree went mono** — headings, paragraphs, table cells, and the `1.` / `2.` markers of an
ordered list, because `::marker` inherits font properties from its originating element. That is
exactly the symptom MK reported. `root` now declares `font-sans`, so Geist Mono is the exception
the recipe names explicitly (`code`, `pre`, `pre code`) rather than something prose falls into by
accident.

The sweep found no third markdown surface: `chart`'s `dangerouslySetInnerHTML` injects a `<style>`
element, not markup, and `bubble` renders markdown by mounting `MarkdownView`, so it inherits the
fix.

**Enforcement** — three `design-lint` rules, each wired into `verify-design-lint-structural`'s
negative specimens (11 structural + 4 vocabulary, up from 9 + 3) and documented in the review
skill's `lint-rules.md` and the component skill's `tokens.md`:

- `raw-tracking` — negative and arbitrary tracking.
- `arbitrary-text-size` — any arbitrary length font size.
- `tabular-figures` — a file formatting numbers with no `tabular-nums`.

**Doctrine** — `design.md`'s type section rewritten; `design:sync:check` green.

## 7. Learnings — where the first pass was wrong

Four corrections, each caught by evidence rather than review:

1. **Flattening the `sm` control tier was wrong.** The first pass sent `text-[0.8rem]` up to
   `text-sm` (14px), reasoning from Vercel's small button. But upstream's ladder genuinely scales
   type with control size — `xs` (h-6) 12px, `default` (h-8) 14px — and its `sm` tier reached for
   an arbitrary 12.8px **only because Tailwind has no step between 12 and 14**. Flattening up
   deleted a real signal and crowded an `h-7` box. Resolved **down** to `text-xs`, keeping the
   ladder at 12/12/14/14. Inventing a 13px step would have re-opened TYP-5's deleted vocabulary.
2. **The TYP-10 gap was one component, not four.** The audit flagged `kbd`, `slider`, `pagination`
   and `data-grid` by **absence of a string**, which is not the same as needing the fix. On
   inspection: `slider` renders no figure text, `kbd` renders key glyphs, `pagination` puts digits
   in fixed `size="icon"` boxes, and `data-grid` already inherits `tabular-nums` from
   `columnCellClass` on a per-column opt-in. Only `number-field` had a real defect. **Zero patches
   were needed**, against three predicted.
3. **Banning all `tracking-*` was the wrong line.** The first rule allowed only `tracking-widest`
   and immediately flagged **twelve** uppercase mono eyebrows across the docs shell. Those need
   positive tracking — uppercase reads cramped without it, and Linear and Vercel both space it. The
   correct line is **direction**: the ramp owns optical **negative** tracking; **positive** tracking
   is a separate role (uppercase micro-labels, shortcut hints) the ramp does not cover. Arbitrary
   values are rejected in both directions.
4. **A green lint run meant nothing until the invocation was checked.** `node tooling/design-lint.mjs`
   with no argument scans `packages/ui/src`, not the registry — the first "clean" result was a rule
   that had never run. Every rule was then proven to fail closed by reintroducing the defect.

5. **Defending the uppercase eyebrows was the worst call of the session.** When the first
   `raw-tracking` rule flagged twelve `font-mono text-xs uppercase tracking-wide` labels, I loosened
   the rule to permit them, calling uppercase-with-positive-tracking "a legitimate idiom" — a
   pattern reached for from habit and then rationalised, rather than judged. MK pushed back, and the
   repo had already decided it twice: `design.md` § Voice & content says sentence case for
   **everything**, and TYP-7 resolves as **shadcn**, whose column reads simply "No uppercase". Two
   of the twelve were not a style question at all — the home page ran real CSS custom-property names
   through the transform, so `--text-lg` rendered as `--TEXT-LG`, a false identifier on a
   design-system docs site. All uppercase is gone (docs shell, `terminal`, `code-block`, and the OG
   card), which removed the only justification for positive tracking, so `raw-tracking` went back to
   its original strict form — allowing `tracking-widest` alone, for the menu shortcut hint, where
   the spacing separates glyph keys instead of compensating for a case transform. The lesson is the
   one MK named: check the project's own decisions before reaching for a familiar pattern, and treat
   a rule that fires a lot as possibly right about the code rather than wrong about the rule.

   The clean principle that fell out, now applied throughout: **mono is for code; uppercase is for
   nothing.** Content that IS code (token names, a language tag) keeps `font-mono`; content that is
   language (section labels, counts, sentences) is `font-sans`, sentence case.

One near-miss worth recording: `@theme inline` inlines values into utilities, which raised the
question of whether `--text-3xl` would still be **emitted** as a custom property — Fumadocs' prose
references `var(--text-3xl)` directly, and losing it would have silently stripped the size from
every docs heading. A compile probe confirmed Tailwind still emits any theme variable that is
referenced. Worth remembering before declaring anything else in that block.

## 8. Not this change

A `stepper` rebuild and a toast/sonner consolidation landed in the working tree during this session.
Every remaining failure belongs to them — `upstream:parity` on `toast.tsx` (197 insertions, zero
typography) and the stepper typecheck/contract errors. Left untouched by instruction.
