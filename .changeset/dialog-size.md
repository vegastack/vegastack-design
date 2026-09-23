---
"@vegastack/ui": minor
---

🔧 `DialogContent` takes a `size` prop — `sm`, `default`, `lg` or `xl`, published as `data-size` — so a bulk-edit table or an attribute editor gets a wider dialog without a `className` override. `default` keeps upstream's `sm:max-w-sm`; `sm`, `lg` and `xl` step the cap to `max-w-xs`, `max-w-2xl` and `max-w-5xl`. The axis mirrors `AlertDialogContent`'s (decision OVL-16).
