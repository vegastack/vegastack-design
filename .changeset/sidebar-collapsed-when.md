---
"@vegastack/ui": patch
---

🔧 **Sidebar**: `SidebarStateScript` takes `collapsedWhen`, a media query. With no `sidebar_state` cookie yet, a window it matches starts the panel collapsed before the first paint, and the cookie records it. A width-dependent default no longer has to collapse the panel after hydration, which slid it shut and shifted the page. A cookie (a person's own choice) always wins.
