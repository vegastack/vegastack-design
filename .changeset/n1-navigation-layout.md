---
"@vegastack/ui": minor
---

Navigation and layout, audit batch 6 (#43): Tabs, Segmented, Toggle and ToggleGroup take the shared
`selectedChipVariants` recipe, and a selected chip now hovers and presses instead of sitting inert.
The underline Tabs variant holds its hover wash 4px off the indicator rail (logical, so the vertical
variant mirrors and RTL follows). `SidebarProvider` gains `persist` (default `true`) around the
cookie write. `BreadcrumbPage` drops `role="link" aria-disabled` for a plain `aria-current` span.
`SidebarTrigger` is an `IconButton`. `ScrollArea`'s viewport is a tab stop only when it can scroll,
and its ring — with `MessageScroller`'s and the sidebar rail's — turns inward so a clipping ancestor
stops eating it. `AppShellContent` and `SidebarInset` gain `landmark="region"` for shells embedded
in a page that already owns a `<main>`. The favourite star fills with neutral ink, not warning.
