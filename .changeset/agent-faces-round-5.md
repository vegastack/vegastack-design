---
"@vegastack/design-tokens": minor
---

⚠ Agent faces show each busy state with its own shape, and small faces draw the character's own eyes instead of a dot grid.

- The Pebble (40px and up): thinking shows a thought cloud joined to the head by two beads, working a turning gear, writing a speech bubble with the dots typing inside. Cues are made of the face's own lit material with no dark backing chip, move with the head, and pop in on a state change (`motion-face-pop`). The thinking eyes look clearly up and over at the cloud; working looks down at the work.
- The Mini replaces the Dot below 40px: the same character in its own silhouette with its eyes and mouth drawn bolder and centred (no brows; no mouth below 24px). It keeps the Pebble's body rhythm while busy and the amber, blue and red badges. `data-form` is now `"mini"` (was `"dot"`).
- Polish: Ink's thought cloud is light, never dark smoke; the needs-you warmth is a light amber instead of a brown cast; the thinking light inside an Ink face is soft white; working bobs slower and writing's mouth talks in step with its body; Moon box keeps its cube when small.
- Removed: the `face-dot-ink` token and the `motion-face-chase` and `motion-face-wave` utilities. `agent-face-spec`: every preset's `dot.fit` is now set (it also places the Mini's eyes).
