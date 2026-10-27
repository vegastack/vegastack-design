---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **HelpMenu** (new): the sidebar-footer Help item — one menu with What's new, Docs, Keyboard shortcuts and Contact support, in that order, and the build version at its foot (`version`). Each entry in `links` is a link (`href`, rendered through `linkRender`, `external` for a new tab) or an action (`onSelect`); omit one to hide it. `whatsNewUnread` puts the unread dot on What's new and on the trigger and adds "(new updates)" to both names. In the collapsed rail it is the help icon with a tooltip, the dot on the icon. [docs](https://design.vegastack.com/docs/components/help-menu)
