---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 New `FileViewer` — a full-screen dark overlay for stored files, controlled by `items`, `index` (`null` closed), `onIndexChange` and `onOpenChange`. Images open fit to the screen with the thumb's blur fading into the full-size `srcSet` variant, zoom by double-click/double-tap, pinch, ⌘/Ctrl+scroll or +/−/0, and pan by drag; neighbours preload. PDFs render with `pdfjs-dist` (`^6.3.289`, now a sanctioned renderer, installed by the item and loaded lazily only when a PDF is shown, worker served same-origin) over range requests, as windowed canvas pages at the device pixel ratio with fit-width, zoom and "Page 3 of 20". Anything else shows its type icon, name, size and Download. ←/→, side buttons (fine pointers) or a swipe page; Esc or a swipe down closes and focus returns to the opener; paging announces "Image 3 of 12".
