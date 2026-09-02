---
"@vegastack/ui": minor
---

Rework AudioPlayer's transport. On a wide player it is a single line: play/pause, rewind/forward (±15s), the combined elapsed/duration readout, a flexible seek bar, and a tappable playback-speed control that cycles rates (1x → 1.25x → 1.5x → 2x → 0.5x), all in subdued secondary emphasis instead of the primary accent, with a smoothed waveform progress edge that fills continuously. Audio carries no volume control — mute stays on the M key. On a narrow, mobile-width player it reflows to two lines: the seek bar with elapsed/duration pinned to either edge in a smaller font on top, and a centred play/pause flanked by rewind/forward on the bottom, with an optional transcript control (new `onTranscriptClick`, lucide `audio-lines`) on the leading edge and the speed control on the trailing edge. VideoPlayer's overlay controls are unchanged.
