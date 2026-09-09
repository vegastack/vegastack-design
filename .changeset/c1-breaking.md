---
"@vegastack/ui": minor
---

⚠️ **`Empty` has one container axis.** `variant: plain | card | dashed` replaces the `bordered`
flag crossed with `surface`, a pair that could ask for a dashed card and resolved it only by letting
tw-merge pick a winner. Rename map: `bordered` → `variant="dashed"`, `surface="card"` →
`variant="card"`, `surface="transparent"` (the default) → `variant="plain"`. The `data-bordered` and
`data-surface` attributes are replaced by `data-variant`. `EmptyTitle` also takes an `as` prop, so
the hard-coded `<h3>` no longer guesses at the host page's heading outline — pass `as="h2"` when the
empty state replaces a page body, or `as="p"` when the surrounding card already carries the heading.
[docs](https://design.vegastack.com/docs/components/empty)
