---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Library grid and sidebar tree. `FolderTree` takes `dragScope`: its folders and section headings accept rows and cards dragged from a `DataList` in the same scope, and its own rows drop onto that list's folder rows and onto `BreadcrumbDropTarget`s; every drag now carries the host's own ids. `canDropInto` adds the host's rule after the tree's own (and is the only rule for ids the tree does not hold), `FolderTreeSection.href` makes a section heading a link (active when `activeId` is the section's id) with its open/close on a chevron beside it, and the labels gain `toggleSection` and `itemCount`. `DataList` takes `gridDensity="dense"`: 2 columns, then 3, 4 and 5 as the container widens at `gridSize="lg"`. `MediaCard` takes `imageBadge`, a chip over the image's bottom end ("▶ 1:24") that never takes the click. `audio-player` exports `AudioWaveform`, the player's waveform as still, `aria-hidden` bars for cards.
