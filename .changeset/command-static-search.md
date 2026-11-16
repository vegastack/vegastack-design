---
"@vegastack/ui": patch
---

🔧 `CommandLoading`'s search icon pulses with CSS instead of the animated icon, so `command` no longer depends on `icon-search` and an app's palette pulls in no `motion` runtime. The pulse stops under reduced motion.
