---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 **AudioPlayer** docks, closes, loads its source lazily and seeks from outside. `docked` pins it to the bottom of its scroll column (sticky, bordered, on the popover surface, clear of the bottom safe area) as a `region` named by `label`. `open` and `onOpenChange` hide it with a close button (`closeLabel`, "Close player") that pauses, reports `false` and returns focus to the control that opened it; a hidden player stays mounted and `inert`, and Escape does not close it. `src` also takes a function, resolved once on the first play. `loading` shows and announces "Loading audio…" (`loadingLabel`) once, and `error` renders an alert with "Try again" (`retryLabel`, `onRetry`). `actionsRef` exposes `seek(seconds, { play })`, `play()` and `pause()`; a seek before the metadata loads is applied when it does. `ref` is still the root element.
[docs](https://design.vegastack.com/docs/components/audio-player)
