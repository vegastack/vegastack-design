---
"@vegastack/ui": patch
---

🧩 **TextEdit**, **InlineChip**, **MarkdownView**: linked task lines, Make task, closed-target chips, product mentions and section marks.

- **Linked task lines:** `linkedTaskId(node)` returns the task id of a checklist line whose first inline is a task mention (`- [x] [@Order glass](mention://task/t1)`). `onTaskItemToggle(taskId, checked)` reports only this person's own ticks. It never reports a collaborator's tick, a `value` change or `setTaskItemChecked`.
- **Make task:** with `onMakeTask`, the block menu of an unlinked checklist line offers **Make task**, or **Make N tasks** for the lines the selection reaches. `onMakeTask` gives each line a `key` (its `blockId`); `handleRef.linkTaskItems([{ key, id, label }])` turns each still-unchanged line into a leading task chip. Text after a matching plain-text title stays after the chip; otherwise the whole line stays, mentions included. `handleRef.setTaskItemChecked(taskId, checked)` ticks or unticks every line linked to a task that changed elsewhere.
- **Closed targets:** `mentionStatus(kind, id)` on `TextEdit` and `MarkdownView` strikes a chip's label through and adds a small status tag ("Canceled"). The props behind it are `InlineChip`'s new `struck` and `status`.
- **Products:** a new `product` mention kind with the package icon on a magenta tint. The `@` menu has a **Products** group after Projects.
- **Section marks:** `sectionMarks` (`{ key, tone, label }`, keyed by a heading's `blockId`) draws a gutter dot and a `warning` or `info` bar along each marked section. They are decorations only: nothing is written to the document and no text moves. Clicking the dot calls `onSectionMark(key)`.
- **`renderTaskQuery` `setQuery`:** in an editable editor the live task list gets `setQuery(query)`, which replaces its filter as one local edit; read views get none.
