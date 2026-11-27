---
"@vegastack/ui": minor
"@vegastack/design": patch
---

⚠️ Tool permissions v2: Always allow, Needs approval and Blocked, an All tools row, Use the default and an Applies to switch.

- `ToolPermissionList`: `ToolAnswer` is `"allow" | "ask" | "block"` (`auto_check` is gone). The menu and the rule lines read Always allow ("Runs without asking."), Needs approval ("Asks a person each time.") and Blocked ("Never runs. The agent isn't offered it."). A followed answer reads `From {inheritedFrom}` (was "Inherited from …").
- `ToolPermissionRow.kind` gains `"all"`: the whole source's row, drawn first above the classes with its own answer menu and no fold toggle, its label lined up with the class labels. `class` is optional (the `all` row has none).
- "Use the default" replaces "Use inherited" in a row's ⋯ and becomes the last item of the answer menu while the row holds its own rule, described `Follows {defaultFrom}.` (new `ToolPermissionRow.defaultFrom`); `onUseInherited` keeps its name. "Add a condition" is always its own quiet icon button.
- New `note` (one muted line under the header) and `scope` (`{ value, options, onChange }`, a segmented `ToggleGroup` named "Applies to" at the header's end) on `ToolPermissionListProps`; new `ToolPermissionScope` type.
- `PermissionMenu`: optional `onReset`, `resetLabel` (default "Use the default") and `resetDescription`, a quiet item after the levels and a separator.
- `RunTimeline`: `decision.answer` is `"allow" | "ask" | "block"`. `AskCard`: `answeredVia: "auto_check"` reads "by Auto-check".
