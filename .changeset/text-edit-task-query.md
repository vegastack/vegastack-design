---
"@vegastack/ui": patch
---

🧩 **TextEdit and MarkdownView: live task lists.**

- **`taskQuery` block:** an atom `{ blockId, query, snapshot }`, selectable and draggable, and in `BLOCK_ID_TYPES`. Its Markdown is the `:::tasks{id="…" …}` container directive: the task mention rows (`- [ ] [@Title](mention://task/<id>) — <status>`), then `:::`. It round-trips byte for byte. `id` is its `blockId`, the one block id Markdown carries. The other attributes are its `query`, unknown keys included. Lines that do not make a whole block stay text and a list.
- **`renderTaskQuery`:** a new TextEdit prop. It draws the list with the host's own component, in the editor and in the read view. Without it the stored snapshot shows as a quiet card.
- **MarkdownView:** renders `:::tasks` as that card (`MarkdownTaskList`: "Task list", task chips with their status labels, or "No matching tasks"). It is server-safe and takes the same optional `renderTaskQuery`.
- **`text-edit-grammar`:** adds `readTasksDirective`, `tasksDirectiveMarkdown`, `parseDirectiveAttrs` and `parseTaskListRows`.
  [docs](https://design.vegastack.com/docs/components/text-edit)
