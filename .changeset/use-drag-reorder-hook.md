---
"@vegastack/ui": minor
---

New `use-drag-reorder` registry hook — the system's one drag-engine seam, wrapping the newly
sanctioned `@atlaskit/pragmatic-drag-and-drop` (D3). Pragmatic owns pointer/touch mechanics and
closest-edge hit-testing; the hook owns what must match this system's voice: a keyboard move mode
(Space/Enter lifts, arrows commit one announced step at a time, Escape ends — Atlassian's own
user-tested commit-per-step pattern), an overridable live-region vocabulary
(lifted/moved/ended/rejected), a `requestMove` entry point for the mandatory menu equivalents, and
the async drop contract no drag library models: a promise-returning `onReorder` is `pending` until
it settles and a rejection announces + clears, so server-refused moves snap back. One API covers a
single list and cross-container boards. Selected for cross-engine smoke.
