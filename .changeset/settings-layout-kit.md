---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **SettingsLayout** (new): the two-pane Settings frame. `SettingsLayout nav={…}` puts a `SettingsNav` in a 220px column that sticks below the page's top edge and the page in one column of up to 960px; `SettingsLayoutContent kind="form"` caps a page at 720px and `kind="list"` fills the column, both on the same left edge. Below 42rem of its own width it shows one pane at a time: `view="nav"` makes the nav the screen (44px rows with a chevron), `view="content"` shows the page with a "‹ Settings" link to `backHref` (`backLabel`). `SettingsNav sections={[{ label, items: [{ href, label, badge }] }]}` marks the current page from `activeHref` (a nested path marks its section) or `isActive`, with `aria-current="page"`; links render through `linkRender` (your router's `Link`). [docs](https://design.vegastack.com/docs/components/settings-layout)
