---
"@vegastack/design-tokens": patch
---

🐛 An agent face keeps its size inside a button, and Ink faces stay visible in the dark theme.

- `AgentFace` sets its width and height inline, so a button's rule for unsized icons (`[&_svg]:size-4`) no longer shrinks a face in a trigger such as a colour picker or a hover card.
- `face-ink-a`, `face-ink-b` and `face-ink-deep` are lighter in the dark theme, so an Ink face no longer sinks into the page; the phone's `agent-face-spec.json` carries them as `onDark`.
