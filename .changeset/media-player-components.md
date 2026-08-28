---
"@vegastack/ui": minor
---

Add AudioPlayer and VideoPlayer registry components with shared custom transport controls, including
a smoothly expanding video progress rail, contained volume rocker, larger overlay actions, and
state-aware fullscreen controls. The AudioPlayer mirrors the video control surface statically — a
full-width solid scrubber, a background-free primary play control with a combined `elapsed / duration`
readout, and matching settings submenus — and gains a `variant="waveform"` that renders the decoded
audio as an interactive, seekable waveform.
