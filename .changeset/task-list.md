---
"@vegastack/ui": minor
---

🧩 `TaskList`: an agent's live checklist for a longer job, above its answer. The live item stays on top with the next two, finished items fold into "✓ N done" and the rest into "+N more"; five or fewer rows never fold, and unfinished or skipped rows never fold. Working, done and stopped states, a "Waiting for you" badge with an action, per-item Subagent progress, a note line, ticks that animate only on a live change, and a polite announcement at most every 3 seconds. Also exports `TaskListProgress`, the sticky "Step 3 of 9" bar.
