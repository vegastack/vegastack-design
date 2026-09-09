---
"@vegastack/ui": minor
---

🔧 **Navigation and layout take one selection recipe and one hover geometry.** **Tabs**,
**Segmented**, **Toggle** and **ToggleGroup** move onto the shared `selectedChipVariants` recipe
from `@vegastack/design`, and a **selected** chip now hovers and presses again — it used to be
excluded from both by `not-data-pressed:*`/`not-data-[active]`, so the one chip a user is most
likely to click was the one that answered nothing. The **Tabs `line`** trigger's hover wash used to
end exactly on the rule the underline indicator rides along, in both orientations; it is held one
4px step off it with a logical margin, so the vertical variant mirrors onto the inline-start rail
and RTL follows for free. **`SidebarProvider`** gains `persist` (default `true`) around the cookie
write: `persist={false}` keeps the component out of `document.cookie` entirely and `onOpenChange`
fires either way, so a host under a consent regime persists the state itself and loses nothing — the
docs section is renamed from "SSR persistence" to "Persistence". **`ScrollArea`**'s viewport is a
tab stop only once its content actually overflows, measured on mount and on resize; Board's column
viewports inherit it. **`AppShellContent`** and **`SidebarInset`** gain `landmark="region"`, which
renders a `<div role="region">` instead of a `<main>` for a shell embedded in a page that already
owns one. **`SidebarTrigger`** is an `IconButton` rather than a hand-rolled `useRender` button, so
it inherits the one box, ink and hover/pressed grammar, and **`PageHeader`**'s back affordance swaps
its physical `-ml-2` for a logical `-ms-2`. **`PageHeader`**'s active favourite star fills with
`foreground` instead of `warning` ink, which read as caution on a control that means "I marked
this".
[docs](https://design.vegastack.com/docs/components/tabs)
