---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

⚠️ `TextSpinner` is now a dot-matrix bolt, the bolt of the VegaStack V in 13 dots, as tall as capital letters (`0.72em`) in a fixed `0.6em` slot, replacing the braille frames. `variant` is `"working" | "waiting"` (default `"working"`), replacing `"braille" | "dots"` with no alias. `working` is Strike: the bolt fills top to bottom, holds and clears. `waiting` is Pulse: the whole bolt fades through six slower frames. Under reduced motion it is a still bolt, not `…`. The design tokens replace `motion-frames` with `motion-strike` (per dot, reading `--vs-row`) and `motion-pulse`. Both keyframes end on the full bolt, so the global reduced-motion reset leaves it still with no override. `LiveLine` gains `waiting`, and `MessageParts` sets it while the turn is still Thinking or is paused on a person or a limit. A `ChatComposerNotice` with `tone="progress"` (Reconnecting, Stopping) now leads with the pulsing bolt. `text-spinner` joins design-lint's inline-SVG graphic allowlist (ICO-8, amended 2026-11-15).
