---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🗑 `EmptyIllustration` is removed: empty states use `Empty` with `EmptyMedia variant="icon"` and a lucide icon only. Replace `<EmptyIllustration name="tasks" />` with `<EmptyMedia variant="icon"><ListTodo /></EmptyMedia>` (or pass the icon to `Empty`'s `icon` prop).
