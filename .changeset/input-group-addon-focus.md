---
"@vegastack/ui": patch
---

🐛 `InputGroupAddon` focuses its input only when the click started inside the addon itself, so choosing an item in a menu (or any portalled popup) opened from the addon no longer pulls focus into the field (INT-14).
