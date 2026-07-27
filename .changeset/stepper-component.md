---
"@vegastack/ui": minor
---

New `stepper` component — a bounded linear process as an ordered list with
`aria-current="step"`, deliberately not `Tabs` (tab semantics promise free navigation a wizard
doesn't offer). Per-step complete/current/upcoming/**error** states map 1:1 onto `StatusIcon`'s
vocabulary and always carry icon shape plus visually hidden text; a `blockedReason` renders against
the current step, announces politely, and wires to the host's Next button via `aria-describedby`;
focus moves to the new current step's label on change (never on mount); horizontal and vertical
orientations share one DOM order; `navigable` mode turns completed steps into real buttons.
