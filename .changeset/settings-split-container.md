---
"@vegastack/ui": patch
---

🐛 **SettingsSection** `layout="split"` splits by the section's own width (`@container/settings-section`, 48rem) instead of the viewport, so a page narrowed by a side panel stacks rather than squeezing its fields; the left column is 14rem, 18rem from 64rem. **SettingsRow** keeps a sized control to at most half the row, so a description never squeezes into a sliver beside a wide field. **VersionList** with `headingHidden` and no Named only switch no longer leaves an empty header row above the list.
[docs](https://design.vegastack.com/docs/components/settings-row)
