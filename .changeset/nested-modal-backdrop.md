---
"@vegastack/ui": patch
---

🔧 **Nested modals keep the backdrop** (`dialog`, `alert-dialog`; OVL-23): a `Dialog` or `AlertDialog` opened from inside another dialog or a sheet now dims and blurs the page like any other modal — the overlay sets Base UI's `forceRender`, which otherwise skips a nested backdrop. Popovers and menus are unchanged.
