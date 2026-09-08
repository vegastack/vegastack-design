---
---

📚 **The docs shell obeys the design system it documents.** Fumadocs' chrome and the
typography plugin are compiled against Tailwind's stock theme, so headings, sidebar titles and prose
`<strong>` rendered at weight 600–900 in a system whose ladder is 400/500, cards used `rounded-xl`,
and popovers used the stock shadow ladder. All of it is remapped to system values once. Demos also
sat on the 15px/28px prose base because the product type scope re-bound the `--type-*` vars but not
the inherited `font-size`.
[foundations](/docs/foundations/typography)
