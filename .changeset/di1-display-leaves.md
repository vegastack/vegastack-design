---
"@vegastack/ui": minor
---

🔧 **One key chip, and the display leaves move onto role tokens.** `TooltipKbd` renders `Kbd
size="xs"` instead of restyling a second `<kbd>`, so a shortcut hint reads identically wherever it
appears — and inherits the OS rewrite. `Kbd`'s three sizes now use one type role (`text-code-sm`);
`md` reached the same 12px through `text-sm`, the same pixel size named twice, and the meaningless
`pointer-events-none` on a `<kbd>` is gone. `StatusIcon` sizes become the `--icon-inline` /
`default` / `action` / `feature` role tokens (14 / 16 / 20 / 24px), the ladder Spinner already uses,
instead of raw `size-N` steps spelling the same four values. A `Skeleton` line moves to the text
radius (`rounded-sm`): 8px on a 16px bar reads as a pill, not as text.
[docs](https://design.vegastack.com/docs/components/kbd)
