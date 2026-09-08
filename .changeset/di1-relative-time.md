---
"@vegastack/ui": minor
---

🐛 **`RelativeTime` no longer renders an empty first frame.** A relative label needs
`Date.now()`, which the server cannot reproduce, so it used to render `""` until hydration — a
visible pop and a layout shift on every row of a list. Server and hydration render now agree on the
**absolute** date (`"Mar 15, 2025"`), derived from the target instant alone, and the swap to the
relative label is a text change inside a box that is already the right size.
[docs](https://design.vegastack.com/docs/components/relative-time)
