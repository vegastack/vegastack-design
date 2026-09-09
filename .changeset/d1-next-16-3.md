---
---

🛠 **Next 16.2.11 → 16.3.4 for the docs app.** The 16.2 line stopped receiving patches in July and
two criticals were never backported. `enablePrerenderSourceMaps` and
`experimental.turbopackFileSystemCacheForBuild` are defaults in 16.3 and were deleted. `next dev` in
16.3 writes a managed agent-rules block into an `AGENTS.md`/`CLAUDE.md` in the Next app directory
when it detects a coding agent; `agentRules: false` turns that off — this repo's agent instructions
are authored and reviewed, and a tool-managed block inside a hand-authored file has no owner.
[`dd4173e`](https://github.com/VegaStack/vegastack-design/commit/dd4173e)
