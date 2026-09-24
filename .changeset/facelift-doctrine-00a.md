---
"@vegastack/design": patch
---

📚 The doctrine now describes the form, toast and overlay behaviour that shipped in the facelift fixes.

- **Forms**: the skill and design.md say `Field` wires its control through Base UI Field — label, description and error ids, and `aria-invalid` from `data-invalid` — so ids are passed only to override, and an explicit `aria-*` prop merges with the Field's. [docs](https://design.vegastack.com/docs/components/field)
- **Toast**: one action, one toast — a repeat rewrites the live toast with `toast.update`. [docs](https://design.vegastack.com/docs/components/toast)
- **Elevation**: one overlay width table for Dialog, Sheet and CommandDialog `size`. [docs](https://design.vegastack.com/docs/foundations/elevation)
