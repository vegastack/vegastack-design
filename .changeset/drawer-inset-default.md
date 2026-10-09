---
"@vegastack/ui": patch
---

🔧 **Drawer** floats inset by default (OVL-21): `--spacing(2)` off every viewport edge, every corner rounded and a full border, in all four directions, as shadcn's inset styles ship it. Pass `flush` on `Drawer` for the previous edge-to-edge sheet. Width overrides are unchanged (`w-*`/`max-w-*` on `DrawerContent`), and a different inset is `[--drawer-inset:--spacing(4)]`.
[docs](https://design.vegastack.com/docs/components/drawer)
