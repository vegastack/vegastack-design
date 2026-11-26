---
"@vegastack/design-tokens": patch
---

🔧 Agent faces load on demand and weigh less, so they stay out of every page's first bundle.

- `PersonAvatar` loads `AgentFace` lazily: the server still renders the face into the HTML, which stays on screen until its chunk arrives.
- `AgentFace` takes `name` and picks a face from it when `face` is missing. `agentFaceFor` moved from `person-avatar` to `agent-face`: import it from there (re-exporting it would pull the face back into every bundle).
- The face spec stores a Dot drawn from its body as a fit (`dot.fit`, drawn by `dotPath`) instead of a second path, with leaner outlines: about 8 KB gzipped, down from 17 KB. The phone's `agent-face-spec.json` keeps every path whole.
