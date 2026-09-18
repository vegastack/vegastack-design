---
"@vegastack/design-tokens": minor
---

⚠️ **The shadcn `base-nova` reset — the token contract is shadcn `base-nova`'s `neutral` base plus our recorded additions, and every deleted family is gone with no alias.**

94 resolved tokens per theme, down from 185. **Deleted:** the surface ladder
(`--surface-1/2/3`, `--surface-raised`), the 22-entry `--alpha-*` ladder, the `--opacity-*` ladder,
`--size-*`, `--icon-*`, `--panel-width-*`, `--layout-*`, `--z-*`, `--shadow-overlay`, `--radius-xs`,
`--radius-sharp`, `--overlay`, `--muted-foreground-faint`, `--font-family-pixel`, the whole role and
display type scale (`text-h1`…`text-h4`, `text-label*`, `text-code*`, `text-mono-label`,
`text-display-*`), and every `<family>-subtle`/`-hover`/`-active` step. Each is now a plain Tailwind
utility. **Kept and ours:** the four status families in upstream's own `destructive` shape — each with
a `-foreground` ink for the solid fill and a `-text` ink for the page and the family's own tint — the
8-hue chart palette plus `--chart-single`, the 10-hue tag palette, the brand pair, the media trio, the
Geist families, and the `--duration-*`/`--motion-ease-*` pairs behind the `motion-*` utilities.

**Who this affects:** every consumer, including ones that never touched a component. A deleted token
compiles to nothing rather than failing, so a page keeps rendering and quietly looks wrong. The
searches that find every holdover, and the write-instead table for each family, are
the migration guide §§ 3–5 and § 11.
