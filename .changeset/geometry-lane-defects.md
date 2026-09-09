---
"@vegastack/ui": patch
---

🐛 **Pointer targets** — nine WCAG 2.2 §2.5.8 misses recorded by the geometry lane are closed at
the root. `IconText`'s row and a `Marker` rendered as a link or a button each carry an invisible
hit area, so a clipped row and an action marker measure 24px to the pointer and not one pixel
differently to the eye. In the docs, the attachment demo composed its actions above the card
trigger — the reverse of the documented order, which made the remove button unclickable — the
scroll-fade demos now reflow at 320px instead of scrolling the page sideways, and the
message-scroller outline entries sit on a target-sized pitch. The lane itself learned two facts it
was missing: an `inert` control accepts no pointer action, and a `role="tabpanel"` is not a target.
[docs](https://design.vegastack.com/docs/components/truncated-text)
