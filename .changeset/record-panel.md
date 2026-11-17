---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
"@vegastack/design": patch
---

⚠️ Record Layout: one side panel of stacked sections replaces the strip of icons (record side panel R1–R5). `RecordPanelProvider`, `RecordPanel`, `RecordPanelSection`, `RecordPanelAction`, `RecordPanelList`, `RecordPanelItem`, `RecordPanelEmpty`, `RecordPanelToggle` (▥, ⌘.) and `RecordPanelTrigger` (the phone's Details button) are new. The panel is 320px, flush to the page's right edge, docked from 1200px of record width and open as the person last left it, floating over the page below that, and a bottom sheet on a phone. `RecordLayout` now fills the shell page edge to edge and `RecordLayoutMain` pads and scrolls itself. **Breaking:** `RecordLayoutSide`, `RecordLayoutStrip`, `RecordLayoutStripItem`, `RecordLayoutStripSlot`, `RecordLayoutPanel` and the `RECORD_PANEL_*` width constants are removed, with no compatibility exports (the panel no longer resizes). `PropertyList` gains `variant="panel"` (a 92px key, 30px rows), `ShellTopBarPanel` holds ▥ after ⋯, and the new `--panel` token (`bg-panel`, COL-26) is the panel's surface.
