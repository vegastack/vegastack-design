---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Keep calendar dates and due labels live across viewer midnight, with stable request-time hydration.

- DateTime and DueLabel use the existing shared clock; explicit DateTime options.now stays controlled and formatting/tooltip choices remain intact.
- Use the bundled full Chromium headless channel for component verification after repeated legacy headless renderer crashes. CI retains native failures and reports only process/signal metadata, never memory contents.
