---
"@vegastack/ui": patch
---

🐛 **ShareDialog**: Space access's mode is a quiet pill like `RecordChip`'s ghost form — no border, a tint and a ▾ on hover. `generalAccess.level` is optional: leave it out when members open the item with their own space role, and no level shows. While everyone in a named space can open the item, the footer reads "Members of Sales and people with access can open it" (new `copyLinkHintSpace` label) instead of "Only people with access can open it".
[docs](https://design.vegastack.com/docs/components/share-dialog)
