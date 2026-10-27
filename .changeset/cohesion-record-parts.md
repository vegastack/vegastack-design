---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **RecordPeek**: a record opened beside its list — a non-modal side panel, resizable by its start edge (480px to 90% of the window, remembered with `storageKey`), whose header walks the list (↑/↓ and J/K, "n of N" from `position`, disabled at the ends), opens the full page (⌘↵ / Ctrl+↵ through `fullLink`, `fullHref` or `onOpenFull`), holds the record's `actions` and closes with Esc, returning focus to the row (`returnFocus`). Full-screen below the tablet tier. **useRecordPeekRow**: `data-peek-active` on the open row of a hand-rolled list, scrolled into view as the peek walks (`DataList`, `DataGrid` and `Board` take `activeRowId`). **RecordHeader**: one head for every record on its page and in a peek — eyebrow (where it lives) and key chip, icon and title renamed in place, status, meta line, chips, presence and actions — with `RecordHeaderSkeleton`. **RecordAsideSection**: `collapsible` (the title folds the section; an empty one is its header alone), `open`/`defaultOpen`/`onOpenChange`, `notice` and `headingLevel`; its count is read as a separate word. [docs](https://design.vegastack.com/docs/components/record-peek)
