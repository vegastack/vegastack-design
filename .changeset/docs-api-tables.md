---
---

📚 **API tables are flat and expanded, on every page at once.** One table per exported part —
name, the literal union (`"default" | "secondary" | …`, not `union`), the `@default` value, the
description — instead of collapsed accordion rows. This one lands everywhere immediately: the
renderer is registered under the legacy `AutoTypeTable` name the 107 unmigrated pages author, so no
page body had to change for it. Own props only, and a part with no own props of its own gets one
sentence instead of the 138 "(no own props)" placeholder rows that filled 18 pages. A second table
lists the `data-*` attributes and CSS variables the part exposes.
[example](/docs/components/dialog)
