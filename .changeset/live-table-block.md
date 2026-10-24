---
"@vegastack/ui": patch
"@vegastack/design": patch
---

⚠️ **MarkdownView, TextEdit, DocumentLayout**: live blocks of any kind show their stored snapshot generically. `liveBlockKinds` now takes the host's kinds as `LiveBlockKind` objects (`{ name, rowKind, label, empty? }`, default `DEFAULT_LIVE_BLOCK_KINDS`, the live task list) instead of bare names, in `MarkdownView`, `TextEdit`, `markdownToDoc` and `textEditExtensions`; `MarkdownTaskList` becomes `MarkdownLiveBlock` (the kind's heading, its rows' chips, a box only on rows that have one) and `parseTaskListRows` becomes `parseLiveBlockRows(snapshot, rowKind)`, whose rows carry `checked: null` when they have no box. A live block's rows may be plain list items (`- [@Row](mention://row/<id>)`). New `DocumentLayoutBlockTable` parts (`Head`, `Body`, `Row`, `Column`, `Cell`): a quiet read-only table for a block of a table's records, its name column first, keyboard-reachable while it scrolls sideways. [docs](https://design.vegastack.com/docs/components/markdown-view)
