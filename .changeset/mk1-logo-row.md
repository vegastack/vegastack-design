---
"@vegastack/ui": minor
---

🔧 **LogoRow shows marks, not links.** The underline is gone — wordmarks rest in
`text-muted-foreground` and lift to `text-foreground` on hover, because a wall of underlined text
reads as a paragraph of links. Cell seams are logical (`-ms-px border-s`), so RTL keeps its inner
rules instead of doubling the outer edge, and `wallColumns` is now a MAXIMUM over an `auto-fill`
track with an 8rem cell floor: a 4-column wall at 320px gave 80px cells and clipped every mark.
[docs](https://design.vegastack.com/docs/components/logo-row)
