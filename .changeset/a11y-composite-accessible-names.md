---
"@vegastack/ui": minor
---

🐛 **Composite controls announced as one run-together string.** Where a control is labelled by
several sibling elements spaced by CSS `gap`, there is no whitespace text node between them, so
accessible-name computation concatenates them flush: `OnboardingChecklist`'s collapsed pill
announced as `Getting started1/3Expand checklist`, a counted `TabsTrigger` as `Activity3`, a
navigable `Stepper` step as `Upload fileCompleted`, a collapsed `Board` column as
`1WonExpand column, read-only`, a `DataGrid` primary cell with merged mobile columns as
`Acme renewalOpen300`, a `CommandItem` with a `CommandShortcut` (and the same hint in
`DropdownMenu`/`ContextMenu`) as `Profile⌘P`, a multi-key `Kbd` as `CommandK`, and a `ToolCallChip`
composed as a button as `Search files1.2s`. Each now carries screen-reader-only separators, which
are absolutely positioned and therefore out of flow — the NAME changes, the layout does not, and
the visible label stays verbatim inside the name, so WCAG 2.2 SC 2.5.3 (Label in Name) still holds
and speech input still works. The tests assert whole accessible names rather than substrings; the
substring assertions are what hid this.
[docs](https://design.vegastack.com/docs/components/onboarding-checklist)
