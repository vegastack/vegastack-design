---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **RouteTabs** (new): tabs whose panels are pages — a named `nav` (`label`) of links drawn as the pill tabs, one URL per tab, the current one from `currentHref` (or a tab's `also` paths) with `aria-current="page"`, counts, and `overflow="scroll"` keeping the current tab in view. A clicked tab is current at once with a pending bar until `currentHref` moves (or drive it with `pendingHref` / `onPendingHrefChange`); links render through `linkRender`. **RouteTabsPanel** dims and is `aria-busy` while a page loads (`pending`, or from a **RouteTabsProvider** shared with the tabs). [docs](https://design.vegastack.com/docs/components/route-tabs)
