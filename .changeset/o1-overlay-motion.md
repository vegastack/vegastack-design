---
"@vegastack/ui": minor
---

🔧 **Overlay motion follows one measured scale.** Every floating surface enters and leaves at
`duration-fast` (150ms); NavigationMenu takes `duration-base` (200ms) because it resizes between
items rather than simply appearing; the modal family — Dialog, AlertDialog, Sheet — is
`duration-base`. Timings were measured against Vercel and Linear rather than chosen.
[docs](https://design.vegastack.com/docs/foundations/motion)
