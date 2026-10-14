---
"@vegastack/ui": patch
"@vegastack/design": patch
---

⚠️ **VersionList** kinds are now `auto · safety · restore · import · agent_checkpoint · named · approved`, each with its badge (`VERSION_KIND_LABELS`: "Before a large deletion", "Before a restore", "Before an import", "Before an agent's edits", "Approved"); a row's own `label` replaces it ("Before Claude's edits") and a named row shows none, except Approved. `conflict` ("Unsaved copy") is removed, and `restore` now means the text just before a restore (it was "Restored").
[docs](https://design.vegastack.com/docs/components/version-list)
