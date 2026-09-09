# Resume protocol — your predecessor agent was killed by an API rate limit at ~15:50 IST, 2026-09-08.

Its remote sweep kept running on the box. Before doing ANYTHING else:

1. `git -C <worktree> status` / `git log --oneline -3`; if a rebase is in progress (`.git/rebase-merge` under the main repo's `.git/worktrees/<name>/`), finish it properly (do not abort blindly — look at what was already resolved).
2. Check both boxes for your worktree's results: `ssh gates 'cat ~/wt/<worktree-basename>/.gates/push.json; git -C ~/wt/<worktree-basename> rev-parse HEAD'` and the same on `gates2`. The box whose `~/wt/<name>` HEAD equals your local HEAD holds the relevant result. If a sweep is still running there (`ssh <box> pgrep -af gates.mjs`, or the lane lock `flock -n ~/.browser-lane-N.lock true` failing), WAIT for it — poll `.gates/push.json` mtime every 60 s. Never start a second sweep while one runs for your worktree.
3. If that sweep PASSED at your current HEAD: `rsync -a <box>:wt/<name>/.gates/ <worktree>/.gates/` then `node tooling/verify-gate-receipt.mjs` in the worktree; if it verifies, do NOT re-run — commit the receipt and continue with push + PR per `finish-after-f2.md` steps 5–7.
4. If it FAILED: rsync `.gates/` back anyway and read `.gates/last-failure.json` and the lane reports (`.gates/*.json`) for the root cause. Fix at the root (F2 renamed Button sizes to xs/sm/md/lg, removed `size="default"`, `glass`, `finish`, the seven colour variants, and moved dismiss/pager controls to `IconButton` — stale tests asserting the old names are the common cause). Then ONE new sweep via `remote-gates-v3.sh`.
5. Everything else per `_common.md`, your batch brief, and `finish-after-f2.md`. Do not merge.
