# Geist Typography Research — VegaStack Design System

Research date: 2026-07-14/15. Scope: verify the Geist family lineup, how Vercel deploys mono in its own product, the mono-as-brand-voice trend, uppercase-mono label conventions, a Lora assessment vs. alternatives, and tabular-number guidance for dashboards.

---

## (a) Verified Geist family inventory

**The owner is right — there are now three shipped members, plus a fourth in development.**

| Cut             | Status (Jul 2026)                                        | Purpose                                                                                                                                               |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geist Sans**  | Shipped (original 2023 release)                          | UI/prose sans, geometric/Swiss-influenced                                                                                                             |
| **Geist Mono**  | Shipped (original 2023 release)                          | Code, terminal, technical labels                                                                                                                      |
| **Geist Pixel** | Shipped **Feb 6, 2026**                                  | Bitmap/pixel-grid display family, decorative                                                                                                          |
| **Geist Serif** | **In development, not yet released** as of this research | Confirmed by Vercel's own Pixel announcement: "the family now spans functional UI text to expressive display usage, with Geist Serif in development." |

Source for the three-plus-one state: [Introducing Geist Pixel](https://vercel.com/blog/introducing-geist-pixel) (Vercel blog, published Feb 6 2026, by Evil Rabbit) and [Geist Font](https://vercel.com/font).

### Geist Pixel detail

- Not one cut but **five stylistic variants**: Square, Grid, Circle, Triangle, Line — switched via a custom **`ELSH` axis** (values 1, 20, 40, 60, 80) rather than five separate font files.
- 480 glyphs, 7 stylistic sets, 32 supported languages, semi-mono horizontal metrics, vertical metrics aligned to Geist Sans/Mono so it drops into the same grid.
- Explicitly **decorative/display**: "banners, dashboards, experimental layouts, product moments" — not intended for body or long-form UI text.
- Ships inside the same `npm i geist` package, importable from `geist/font/pixel`.
- Sources: [Introducing Geist Pixel](https://vercel.com/blog/introducing-geist-pixel), [Geist Font](https://vercel.com/font).

### Variable axes, features, licensing

- **Geist Sans & Geist Mono**: both are variable fonts on a single **`wght` axis, 100 (Thin) → 900 (Black)** (static instances are also shipped: Thin, Ultra Light, Light, Regular, Medium, Semi Bold, Bold, Black, Ultra Black). Confirmed independently via [Geist Mono — Google Fonts](https://fonts.google.com/specimen/Geist+Mono) listing and [Geist Font](https://vercel.com/font)'s weight-slider playground.
- **OpenType features** (full set only available via the npm/self-hosted files — the Google Fonts–served version drops stylistic sets):
  - `ss01`–`ss09` stylistic sets (e.g. `ss01` = alternate `a`/`g`, `ss02` = stricter Swiss/neo-grotesk geometry, `ss03` = rounder punctuation, `ss04` = sharper punctuation).
  - `tnum` tabular numerals, `zero` slashed zero, `liga`/`calt` ligatures and contextual alternates, `locl` localized forms.
  - Recommended code-context feature string: `"liga" 0, "calt" 0, "tnum" 1, "zero" 1`.
  - Sources: [Geist Font: Complete Guide to OpenType Features in CSS](https://lexingtonthemes.com/blog/geist-opentype-features), [DeepWiki: vercel/geist-font](https://deepwiki.com/vercel/geist-font).
- **License**: **SIL Open Font License v1.1** for the whole family, per the repo README: "The fonts are licensed under the SIL Open Font License v1.1... https://scripts.sil.org/OFL". Source: [github.com/vercel/geist-font readme.md](https://github.com/vercel/geist-font/blob/main/readme.md).
- **npm package (`geist`)**: exports `geist/font/sans`, `geist/font/mono`, `geist/font/pixel`. Next.js usage: `import { GeistSans } from 'geist/font/sans'` / `import { GeistMono } from 'geist/font/mono'`, applied as CSS variables (`--font-geist-sans`, `--font-geist-mono`) to `<html>`/`<body>` and consumed via Tailwind `fontFamily` tokens. The npm path gives full OpenType feature access; the `next/font/google`-sourced equivalent does not (no stylistic sets). Source: [Geist Font](https://vercel.com/font), [geist — npm](https://www.npmjs.com/package/geist?activeTab=readme).

**Action for VegaStack:** current stack (Geist Sans + Geist Mono, `geist` npm package) is correctly scoped — do not add Geist Pixel (wrong register: decorative bitmap, not a UI/data face) and do not wait on Geist Serif (unreleased, no ship date). If a serif accent is wanted now, it has to come from outside the Geist family (see §e).

---

## (b) How Vercel deploys Geist Mono on their own surfaces

Vercel's own [Typography](https://vercel.com/geist/typography) spec (Geist Core Figma system) defines four **role** tiers, each a fixed size/line-height/letter-spacing/weight token — not "pick a font per use":

| Role         | Range                                                                   | Notes                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Headings** | `text-heading-72` → `text-heading-14`                                   | Page/section intros. Sizes ≤32 support a "Subtle" (dimmed) modifier.                                                                                                                                                |
| **Buttons**  | `text-button-16`, `text-button-14` (default), `text-button-12` (inputs) | Restricted to button components only.                                                                                                                                                                               |
| **Labels**   | `text-label-20` → `text-label-12`                                       | "Designed for single-lines." Strong modifier at 16/14. **Monospace variants exist at 14, 13, 12** (`text-label-14-mono` etc.) — this is where Geist Mono enters as a _role variant of Label_, not a separate scale. |
| **Copy**     | `text-copy-24` → `text-copy-13`                                         | Multi-line body, higher line-height than Label. Strong modifier at larger sizes. `text-copy-13-mono` exists specifically for **inline code**.                                                                       |

Key rules extracted:

- **Tabular numerals are a stated rule at the smallest label size**: "Tabular is used when conveying numbers for consistent spacing" (Label 13). This is Vercel prescribing `tnum` at the exact size dashboards/data chips use.
- Mono is **not** used for headings or body copy anywhere in the documented scale — it is scoped to (1) inline code inside Copy, and (2) small mono Label variants.
- Separately, teardown commentary on Vercel's marketing/dashboard surfaces (not the Figma spec doc itself) describes **Geist Mono set in uppercase with `tnum`/`liga` feature toggles as the "developer console" voice** — compact technical labels/eyebrows that visually bridge marketing pages and the actual product UI. Treat this as an observed pattern on vercel.com, not a documented rule in the Geist typography spec.
- Headline tracking on Vercel is aggressively negative (Geist Sans, not Mono): h1 ≈ **-2.28px at 48px (~-4.75%)**, h3 ≈ **-1.28px at 32px (~-4%)** — display sizes get compressed tracking; this is a Sans-headline trait, distinct from the mono-label conventions below.

Sources: [vercel.com/geist/typography](https://vercel.com/geist/typography), [vercel.com/geist/introduction](https://vercel.com/geist/introduction), cross-referenced against third-party teardown notes ([Vercel Design System Breakdown, SeedFlip](https://seedflip.co/blog/vercel-design-system), [Vercel DESIGN.md, awesome-design-md](https://digiflex-solution.github.io/awesome-design-md/)).

**Takeaway for VegaStack:** Vercel's own system treats mono as a _variant switch within Label/Copy roles_ (mono suffix at specific small sizes) rather than a free-floating "use mono wherever it looks techy" license, and it explicitly pins `tnum` to the numeric label size. That's a more disciplined model than ad hoc mono usage and is worth mirroring in VegaStack's type-role tokens.

---

## (c) Mono-as-brand-voice: trend analysis with examples

**The trend is real and dated precisely to this stretch (2025–2026), and VegaStack sits squarely inside it.**

- Developer-tools marketing — **Vercel, Linear, Cursor, Raycast, Resend, PostHog** — has made monospace-for-labels/metadata a recognizable brand signal that has since spread outward into general editorial and indie-brand work. Source: search synthesis across [madegooddesigns.com/font-trends-2026](https://madegooddesigns.com/font-trends-2026/), [madegooddesigns.com/monospace-font](https://madegooddesigns.com/monospace-font/).
- Specific confirmed implementation: **Raycast** uses Geist Mono for code elements, Inter for UI text, and enables `calt`/`kern`/`liga`/`ss03` site-wide (ss03 swaps Inter's alternate lowercase `g`) — i.e. mono is scoped to code/technical strings, not general UI voice. Source: search synthesis referencing Raycast's design system documentation.
- Framing: "It's a rebellion against overly glossy UI, bringing back the spirit of the command line... the analog-computing aesthetic is in" — mono type is read as a nostalgia/authenticity signal (paired with the broader 2026 Y2K/film-photography revival), used deliberately as a counterweight to homogenized AI-generated visual design. Source: [madegooddesigns.com/font-trends-2026](https://madegooddesigns.com/font-trends-2026/).
- **Counter-trend, and directly relevant to the Lora question**: 2026 also has a strong, well-documented swing toward **serif-for-warmth in AI-company branding** specifically — "From Perplexity to Claude, AI brands across the board are reaching for the warmth and familiarity of serif fonts... The paradox is that AI is the cutting edge of technological frontier, yet it's increasingly framed with serif typefaces—typography associated with age, authority and trust." AI brands are choosing serif specifically to differentiate from "the myriad brands of the last quarter century who have used sans serifs," and from their own AI competitors. Source: [Creative Bloq — Why AI brands are obsessed with serif fonts](https://www.creativebloq.com/design/fonts-typography/why-ai-brands-are-obsessed-with-serif-fonts) (syndicated/also at [Yahoo Tech](https://tech.yahoo.com/ai/meta-ai/articles/why-ai-brands-obsessed-serif-050000829.html), referenced by [WIRED](https://news.google.com/read/CBMiZ0FVX3lxTE1iZmZvWlEwNTFrel9pYTJ6bUdCM1VvbWREMmZkZTF6eHg4dUpiVlllSVNyQmctOXVMVUlmQkhjNmd0ZTRJUGlQSnpCbk9QSGZMcE9HeHBCTzRSdGowRlp2aHM1cElzRG8?hl=en-US&gl=US&ceid=US%3Aen)).
- The two trends are being explicitly **combined**, not competing, in the highest-taste 2026 AI/dev work: "A warm, almost literary serif headline meets a developer-tribe monospace in the nav and buttons. It says this is built for people who live in a terminal, without feeling cold." Confirmed pairing pattern in the wild: "Fraunces or Reckless display headlines paired with Fragment Mono or JetBrains Mono body and accents" in indie editorial/product work. Sources: [madegooddesigns.com/font-trends-2026](https://madegooddesigns.com/font-trends-2026/), [aigoodies.beehiiv.com/p/aesthetics-2026](https://aigoodies.beehiiv.com/p/aesthetics-2026).

**Read for VegaStack:** the current direction — Geist Sans (UI) + Geist Mono (code/data) + a serif italic accent — is not a novelty, it's the _canonical_ 2026 AI-platform formula (geometric-sans-and-mono system for "engineered" credibility, warm-serif accent for "human" trust). The question isn't whether to pair serif-with-mono, it's whether Lora is the _right_ serif for that accent role (see §e).

### Pitfalls of mono for anything beyond labels/code

- **Long-form mono body text hurts readability**: monospace's fixed advance width creates uneven visual rhythm/word-shape at paragraph length; every source and system audited (Vercel's own spec, Raycast) scopes mono to single-line labels, inline code, or short metadata — never multi-line body copy. VegaStack's existing Copy-role convention (mono only for `-mono` inline-code variants at small sizes) matches this.
- **Uppercase + screen readers**: no evidence found of a real accessibility hazard from uppercase mono labels themselves — the documented WCAG-relevant caution is about `text-transform: uppercase` causing some screen readers to spell out short strings as acronyms/letter-by-letter in specific browser/AT combinations; this is a general uppercase-CSS caution, not specific to Geist or to monospace. Mitigate by keeping the semantic text sentence-case in the DOM and applying uppercase via CSS `text-transform`, not by hand-typing caps.
- **Monospace and dyslexia**: an ACM eye-tracking study across 48 dyslexic readers found **monospaced, sans-serif, roman-style fonts outperformed serif/proportional/italic fonts** for reading performance — and that the same gains benefited readers generally, not just dyslexic readers. Italic fonts specifically impaired reading. However the same research cautions that _purpose-built "dyslexia fonts"_ show no proven advantage beyond these general characteristics (monospacing, sans, non-italic) — so this is evidence _for_ using Geist Mono/Sans (non-italic, sans) as the accessible defaults, and a caution _against_ relying on Lora's italic cut for anything but short decorative accents. Source: [Rello & Baeza-Yates, "The Effect of Font Type on Screen Readability by People with Dyslexia," ACM TACCESS](https://dl.acm.org/doi/10.1145/2897736) ([PDF mirror](https://www.superarladislexia.org/pdf/2016-Luz%20Rello-Fonts-taccess.pdf)).

---

## (d) Uppercase-mono label spec recommendation

No single authoritative "Vercel spec sheet" for uppercase-mono tracking values was found (Vercel's own typography page defines size/line-height/letter-spacing/weight tokens per role but the exact numeric letter-spacing values for the `-mono` Label variants weren't exposed in the fetched content — flag this as **unverified precision**, not fabricated). Combining what _was_ verified (Vercel's role model, the general OpenType feature set, and standard uppercase-tracking typographic practice) into a concrete recommendation for VegaStack's `Label` mono variant:

- **Case**: apply `text-transform: uppercase` in CSS on a sentence-case DOM string (accessibility: avoids literal all-caps text nodes, keeps semantic casing intact for anything that parses raw text).
- **Tracking**: uppercase-set mono needs _added_ positive tracking relative to mixed-case mono at the same size — uppercase glyphs are visually denser with no ascenders/descenders to break up rhythm, so under-tracked uppercase reads as clumped. Standard practice for small uppercase UI labels is **+0.02em to +0.08em**, scaling up as size goes down (12px mono uppercase wants more relative tracking than 16px). Anchor VegaStack's `-mono` Label tokens at the upper half of that range (~0.04–0.06em) given Geist Mono's fairly tight native spacing.
- **Weight**: keep uppercase mono labels at **Regular (400) or Medium (500)** — heavier weights (600+) combined with uppercase + tight tracking compound density and hurt legibility at 12–14px; reserve Semi Bold/Bold mono for emphasis states only (e.g. a "Strong" label modifier), matching Vercel's own Strong-modifier pattern for Label/Copy.
- **Size floor**: don't go below Vercel's own floor of **12px** for mono labels — this matches VegaStack's already-tokenized `text-label-12` role and Vercel's `text-label-14/13/12-mono` variants.
- **tnum**: enable `tnum` by default anywhere a mono label carries a number (counts, IDs, timestamps) — consistent with Vercel's explicit Label-13 rule (§b) and the tabular-number guidance in §f.
- **Feature string** for uppercase mono labels: `font-feature-settings: "tnum" 1, "case" 1` where applicable (the `case` OpenType feature adjusts punctuation for all-caps contexts) — worth verifying Geist Mono ships a `case` table; if not, the tracking adjustment above does the compensating work manually.

---

## (e) Serif-accent assessment: Lora vs. alternatives

### Does Lora fit VegaStack's "dense dev-tool aesthetic, AI-platform company" system?

**Verdict: Lora is a workable but not optimal choice — it leans bookish/warm rather than "2026 lab-serif," and better-matched, equally-licensed alternatives exist.**

Reasoning, evidence-based:

- Lora is a **transitional serif with visible calligraphic DNA** — "letter terminals that curve with a hand-drawn quality," explicitly contrasted against "more rigid serifs like Times New Roman or Source Serif." Its documented strongest pairings are with **Inter/Open Sans for professional/corporate audiences** and **Space Grotesk/Fira Code for creative/design-literate audiences**, and its best-fit use cases are **"blogs, online magazines, and content platforms"** — i.e., editorial/content contexts, not technical/dashboard contexts. Source: [Lora Font Pairing: 12 Best Combinations, MadeGoodDesigns](https://madegooddesigns.com/lora-font-pairing/).
- That's a mismatch with VegaStack's stated aesthetic ("dense dev-tool," "everything tokenized," Base UI + Tailwind semantic-token discipline). Lora's warmth is real but its calligraphic terminals and text-serif proportions read closer to "blog/magazine" than "engineered AI platform accent."
- The 2026 trend data in §c shows the winning AI-brand serif move is pairing a **"warm, almost literary serif headline"** with mono — Lora technically satisfies "warm literary serif," but the specific exemplars cited in trend research (Fraunces, Reckless) skew toward **higher-contrast, more expressive/display-oriented serifs** than Lora's fairly restrained text-serif design, which was built for body reading, not display accenting.

### Alternatives assessed (variable, OFL, closer to "2026 lab-serif")

| Typeface                                                               | Variable axes                                                                                                                                                                                                                              | License                 | Fit assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Newsreader** (Production Type, commissioned by Google Fonts)         | `wght` 200–800, `opsz` 6–72, roman + italic                                                                                                                                                                                                | SIL OFL 1.1             | Best-matched alternative. Built explicitly "for continuous on-screen reading in content-rich environments" with an **optical-size axis** — meaning the same family can supply a genuinely display-tuned italic accent (opsz near 72) _and_, if ever needed, a text-tuned instance (opsz near 6-14), without swapping fonts. More restrained/neutral than Lora's calligraphic warmth — closer to a "quiet lab-serif" register. Sources: [productiontype.com/font/newsreader](https://productiontype.com/font/newsreader), [github.com/productiontype/Newsreader](https://github.com/productiontype/Newsreader), [Fonts In Use: Newsreader](https://fontsinuse.com/typefaces/152858/newsreader). |
| **Source Serif 4** (Frank Grießhammer / Adobe)                         | `wght` 200–900, `opsz` 8–60, roman + italic                                                                                                                                                                                                | SIL OFL 1.1             | More rigid/transitional than Lora — matches "not Times New Roman, not Source Serif" comparison point directly (i.e., it's the _rigid_ option Lora was being contrasted against). Reads more corporate-editorial than lab-serif; solid but less distinctive as a brand accent. Source: [blog.adobe.com — Source Serif gets optical sizes](https://blog.adobe.com/en/publish/2021/03/04/source-serif-gets-optical-sizes), [Adobe Fonts: Source Serif 4](https://fonts.adobe.com/fonts/source-serif-4).                                                                                                                                                                                           |
| **Instrument Serif**                                                   | Not variable in the official Google Fonts release (single static display style); an unofficial multi-weight/width **variable fork exists** on GitHub (not Google-Fonts-distributed, use with caution for supply-chain/maintenance reasons) | SIL OFL                 | Condensed, high-contrast **display-only** serif — closer to the "expressive variable serif" register the 2026 trend research points to (Fraunces/Reckless-adjacent), good for short italic accents (wordmarks, hero words) but not usable as anything beyond single-word/short-phrase display given no official weight range and condensed proportions. Sources: [Fonts In Use: Instrument Serif](https://fontsinuse.com/typefaces/219915/instrument-serif), [github.com/eliheuer/instruments-serif](https://github.com/eliheuer/instruments-serif) (unofficial fork), [github.com/Instrument/instrument-serif](https://github.com/Instrument/instrument-serif) (original).                    |
| Signifier (Klim Type Foundry) — named by the user as a reference point | N/A                                                                                                                                                                                                                                        | **Commercial, not OFL** | Ruled out on licensing grounds alone — not a candidate under VegaStack's public/OFL distribution constraints. Named here only to confirm it's excluded, not to recommend it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Recommendation**: keep Lora only if the "bookish/editorial warmth" read is actually the intended brand signal (it is a legitimate, well-supported choice for that specific effect). If the goal is closer to what the 2026 research calls the "lab-serif" register — warm but engineered, restrained rather than calligraphic — **swap to Newsreader**: it's OFL, variable on both weight and optical size (so italic display accents can sit at a properly display-tuned optical size instead of a scaled-up text cut), and its Production-Type pedigree/on-screen-reading design brief is a closer sibling to Geist's own "designed for the web" brief than Lora's magazine/blog-oriented design brief.

---

## (f) Numeric UI: tabular numbers, Mono vs. Sans tnum

- **`font-variant-numeric: tabular-nums`** (or the raw `font-feature-settings: 'tnum' 1` fallback) is the correct tool regardless of which family renders the digits — it forces every digit glyph to the same advance width, eliminating the horizontal "jitter" that proportional digits cause when values update (countdowns, live stock/metric tickers, incrementing counters). Browser support is >96% per caniuse; the real constraint is **whether the font itself ships `tnum` glyphs** — a font without them silently no-ops. Both Geist Sans and Geist Mono do ship `tnum`. Source: [Loke.dev — A Stable Rhythm for the Numeric Display](https://loke.dev/blog/css-font-variant-numeric-tabular-nums), [dev.to — Tabular Numbers in CSS](https://dev.to/alanwest/tabular-numbers-in-css-font-variant-numeric-vs-monospace-hacks-25cn).
- **Recommendation for VegaStack stat tiles/tables**: use **Geist Sans with `tabular-nums` enabled**, not Geist Mono, for dashboard stat tiles and table numeric columns that live inside otherwise-Sans UI chrome (labels, headers, surrounding copy) — mixing Mono digits into a Sans-typeset card reads as an inconsistent voice-shift for what is fundamentally a UI number, not "data-as-code." Reserve **Geist Mono + tabular-nums** specifically for genuinely code/terminal-adjacent numeric contexts (IDs, hashes, raw JSON/API responses, CLI-style output) where the monospace _register_ itself is the intended signal, matching this project's own CLAUDE.md convention ("Font-mono for numbers — Dollar amounts, card numbers use monospace") for financial/precision figures specifically.
- **Consistency rule**: whichever choice is made per-context, apply it uniformly — "if tabular-nums is chosen for a data-heavy dashboard, all numerical elements should follow the same rule to maintain a uniform grid" (tables, timers, pricing sheets, numeric inputs all get it; mixing tabular and proportional digits in the same view reintroduces the jitter problem at the boundary). Source: [Loke.dev](https://loke.dev/blog/css-font-variant-numeric-tabular-nums).
- **Practical CSS pattern**:
  ```css
  /* dashboard-wide default */
  .dashboard {
    font-variant-numeric: tabular-nums;
  }

  /* code/terminal-register numbers */
  .mono-data {
    font-family: var(--font-geist-mono);
    font-feature-settings:
      "tnum" 1,
      "zero" 1;
  }
  ```

---

## Sources (deduplicated)

- [Geist Font — vercel.com/font](https://vercel.com/font)
- [Introducing Geist Pixel — Vercel blog](https://vercel.com/blog/introducing-geist-pixel)
- [github.com/vercel/geist-font readme.md](https://github.com/vercel/geist-font/blob/main/readme.md)
- [geist — npm](https://www.npmjs.com/package/geist?activeTab=readme)
- [DeepWiki: vercel/geist-font](https://deepwiki.com/vercel/geist-font)
- [Geist Mono — Google Fonts](https://fonts.google.com/specimen/Geist+Mono)
- [Geist Font: Complete Guide to OpenType Features in CSS — lexingtonthemes.com](https://lexingtonthemes.com/blog/geist-opentype-features)
- [vercel.com/geist/typography](https://vercel.com/geist/typography)
- [vercel.com/geist/introduction](https://vercel.com/geist/introduction)
- [Vercel Design System Breakdown — SeedFlip](https://seedflip.co/blog/vercel-design-system)
- [awesome-design-md (Vercel DESIGN.md)](https://digiflex-solution.github.io/awesome-design-md/)
- [Font Trends 2026 — madegooddesigns.com](https://madegooddesigns.com/font-trends-2026/)
- [Best Monospace Fonts of 2026 — madegooddesigns.com](https://madegooddesigns.com/monospace-font/)
- [Aesthetics in the AI era: Visual + web design trends for 2026 — aigoodies.beehiiv.com](https://aigoodies.beehiiv.com/p/aesthetics-2026)
- [Why AI brands are obsessed with serif fonts — Creative Bloq](https://www.creativebloq.com/design/fonts-typography/why-ai-brands-are-obsessed-with-serif-fonts)
- [Rello & Baeza-Yates, ACM TACCESS — The Effect of Font Type on Screen Readability by People with Dyslexia](https://dl.acm.org/doi/10.1145/2897736)
- [Lora Font Pairing: 12 Best Combinations — madegooddesigns.com](https://madegooddesigns.com/lora-font-pairing/)
- [Newsreader — productiontype.com](https://productiontype.com/font/newsreader)
- [github.com/productiontype/Newsreader](https://github.com/productiontype/Newsreader)
- [Fonts In Use: Newsreader](https://fontsinuse.com/typefaces/152858/newsreader)
- [Source Serif gets optical sizes — Adobe blog](https://blog.adobe.com/en/publish/2021/03/04/source-serif-gets-optical-sizes)
- [Source Serif 4 — Adobe Fonts](https://fonts.adobe.com/fonts/source-serif-4)
- [Fonts In Use: Instrument Serif](https://fontsinuse.com/typefaces/219915/instrument-serif)
- [github.com/eliheuer/instruments-serif](https://github.com/eliheuer/instruments-serif)
- [github.com/Instrument/instrument-serif](https://github.com/Instrument/instrument-serif)
- [A Stable Rhythm for the Numeric Display — loke.dev](https://loke.dev/blog/css-font-variant-numeric-tabular-nums)
- [Tabular Numbers in CSS: font-variant-numeric vs Monospace Hacks — dev.to](https://dev.to/alanwest/tabular-numbers-in-css-font-variant-numeric-vs-monospace-hacks-25cn)
