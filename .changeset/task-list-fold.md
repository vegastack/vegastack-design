---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🧩 `TaskList` and `ChatTaskList` fold long lists: finished items (done and skipped) fold into one "N done" row, the live item and up to eleven to do stay in view, and the rest fold into "+N more"; each fold opens in place with the height motion. A finished group (`members`) counts each member and shows them nested. `TaskList` gains `openFolds`, `defaultOpenFolds` and `onOpenFoldsChange` (`expanded` still opens both; Show less is gone). `SubagentsBlock` rows say how a finished Subagent's part went from `outcome` and `outcomeReason`: Done (the only check), Partly done and Couldn't finish with the reason and Retry, and "Finished · outcome not stated", which is also how a finished output with no `outcome` reads (never as done). A row or fold row holding focus stays where it is while the list moves on.
