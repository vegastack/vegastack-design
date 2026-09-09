---
"@vegastack/ui": minor
---

🔧 **Button**, **Select**, **Sidebar**, **Toggle**, **Tabs**, **Table**, **DataGrid**,
**DataList**, **Board**, **Item**, **Pagination**, **NavigationMenu**, **Combobox**, **DatePicker**,
**Dialog**, **Sheet**, **Popover**, **HoverCard**, **Segmented**, **TagGroup**, **Bubble**, **Card**,
**AppShell**, **EmojiPicker**, **FieldInline**, **MessageScroller**, **NumberField**,
**OnboardingChecklist**, **ShortcutOverlay**, **Sonner**, **Switch**, **ToolCallChip** and the
**dashboard-01** block — every hover now climbs one rung and **every control has a pressed step**.
Previously only the solid primary Button darkened on `:active`; a state probe found 268 elements
where pressing changed nothing. Select's trigger hovered only in dark mode; it now hovers in both.
The current sidebar row rests on `surface-3` so hovering it still moves. ComparisonMatrix and
PricingSection stop using `info` (blue) for the promoted column and the highlighted plan — `info` is
links and informational UI only; promotion is a neutral ladder rung.
[docs](https://design.vegastack.com/docs/components/button)
