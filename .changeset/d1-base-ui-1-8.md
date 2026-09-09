---
"@vegastack/ui": minor
---

🔧 **Base UI 1.6.0 → 1.8.0, `@shadcn/react` 0.2.1 → 0.3.1.** Fifteen upgrade deltas were executed and
observed in a browser rather than assumed from a green suite; only MessageScroller needed a source
change. Its viewport now answers the primitive's new `data-pending-scroll` attribute with
`invisible`, so a server-rendered transcript no longer paints the top of the thread for one frame
before jumping to the bottom — `visibility: hidden` rather than `display: none` on purpose, because
the primitive measures `clientHeight`/`scrollHeight` to decide where to scroll and a display-none
viewport measures zero. A regression test asserts the attribute never sticks. `message-scroller`'s
declared `@shadcn/react` range moves to `^0.3.1`; it and `date-picker` carry new integrity hashes.
Two user-visible upstream changes are kept as shipped: a `readOnly` Select/Combobox now opens and
browses (reached through `editable-cell`), and start/end-aligned popups take their pop-in
`--transform-origin` from the aligned edge.
[docs](https://design.vegastack.com/docs/components/message-scroller) ·
[`e519fa6`](https://github.com/VegaStack/vegastack-design/commit/e519fa6)
