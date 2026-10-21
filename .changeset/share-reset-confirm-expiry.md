---
"@vegastack/ui": patch
---

🔧 **ShareDialog**: Reset link asks first ("Reset the public link?"), as Stop publishing does, since the current link stops working at once. `publicLink.expiresAt` (the instant the link lapses) shows under Expires as "Until Oct 22 · 2:30 PM" in the viewer's zone, so a link opened again later says when it ends, not only the preset that was chosen.
