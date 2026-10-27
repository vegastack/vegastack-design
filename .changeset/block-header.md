---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **BlockHeader** (new): the one header row of a live block inside a page — a table view, a task list. `BlockHeader` lays out `icon` · `title` · its controls (children: `BlockHeaderButton`s, small quiet buttons to use as the `render` of the host's View ▾ and Filter triggers) · a ⋯ menu (`menu` items, `menuLabel`) · `open` (a `BlockHeaderOpen`: ↗ Open, a real link via `href` or a router link as `render`, with a `label`). Before the block has a source, `picker` takes the title's place ("Pick a table…") so a block inserts at once and is configured where it sits. On a narrow block the controls wrap under the title and Open folds to its icon. [docs](https://design.vegastack.com/docs/components/block-header)
