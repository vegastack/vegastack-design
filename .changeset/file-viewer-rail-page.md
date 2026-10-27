---
"@vegastack/ui": patch
---

🧩 **FileViewer** carries a file's discussion: `rail={{ details, comments, activity }}` adds a column beside the stage with a tab per slot given (a bottom sheet below 768px), opened by a header Details toggle — `railOpen` / `defaultRailOpen` / `onRailOpenChange`, `railTab` / `defaultRailTab` / `onRailTabChange`, `railLabels`. `header={{ share, watch, menu }}` puts Share and Watch before Download and the ⋯ menu after it. Every slot is a node or a function of the open file. `mode="page"` renders the same viewer in place as a file's page (no dialog or Close, the page's theme, the name as its `h1`). `onOpenChange` is now optional (needed only for the overlay). Existing overlay usage is unchanged. [docs](https://design.vegastack.com/docs/components/file-viewer)
