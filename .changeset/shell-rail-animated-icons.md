---
"@vegastack/ui": minor
---

🧩 `ShellRailItem` takes `animatedIcon` (L23): the static icon paints first, and the animated one — a DS animated icon wrapped in the new `lazyAnimatedIcon`, so its module and Motion load only after the browser is idle — takes its place at the same size and plays on hover and when the item becomes the current module. Reduced motion keeps it still. Additive. `ShellSection` (a region's own measure: `prose`, `default`, `full`, with `align`), `ShellBleed` (past the gutter to the page's edges) and `shellGutterClasses` (the shell's container-based `--page-gutter`) join the shell, so pages move off `AppShellSection` and `AppShellBleed`.
