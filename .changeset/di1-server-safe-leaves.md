---
"@vegastack/ui": minor
---

🔧 **Twelve components are server-safe again.** Avatar, Button, Collapsible, Field, Progress,
Resizable, ScrollArea, Separator, Slider, Switch, Tabs and Toggle carried `"use client"` without
touching a hook or a handler. A client module poisons every RSC importer downstream —
`buttonVariants` could not be read from a server component. 84 client leaves in the registry became 72.
[docs](https://design.vegastack.com/docs/components/button)
