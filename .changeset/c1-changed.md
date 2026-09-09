---
"@vegastack/ui": minor
---

🔧 **A list row is 14/500 over 12, disclosures hover with the row wash, and the checklist composes
the progress primitive.** `ItemTitle` moves from 12px to `text-label` — the same type Sidebar menu
rows, DataList cells, menu items and Message rows already use, because a 12px Item title beside a
14px sidebar row read as two systems; `size="sm"` keeps the denser 12/12 pair. Accordion and
Collapsible triggers dropped `hover:underline` — underlining on hover is the link affordance — and
took `surfaceInteractive` together with the padding, inner radius and ≥4px hairline inset that the
wash requires, with the accordion panel taking the same horizontal padding so the body stays aligned
under its label and row heights unchanged. `OnboardingChecklist`'s segmented bar was a second
hand-rolled `role="progressbar"` next to the primitive that already draws one, so it now composes
`ProgressIndicator segments`; the primitive gains `segmentsFill` (segments share the container width
instead of a fixed bar width) and accepts a single segment. A navigable `Stepper` label is now a
`link`-variant Button instead of a `ghost` Button with its height and padding stripped to imitate
inline text. [docs](https://design.vegastack.com/docs/components/item)
