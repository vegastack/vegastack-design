---
"@vegastack/ui": patch
---

🔧 The indeterminate loading mark is now lucide `Loader` everywhere, in place of `LoaderCircle`.

- [Spinner](/docs/components/spinner), [Toast](/docs/components/toast)'s loading icon and [Sonner](/docs/components/sonner)'s loading icon move from `Loader2Icon` — an alias of lucide's `LoaderCircle` — to `LoaderIcon`, so they match [StatusIcon](/docs/components/status-icon)'s `progress` and upstream's own `dashboard-01` block. One loader shape across the system.
- Every component that composes `Spinner` inherits the new mark, including [Button](/docs/components/button) and [Toggle](/docs/components/toggle) in their `loading` state.
- Recorded as decision ICO-8 and enforced by design-lint's new `loader-mark` rule, so the upstream mark cannot return one file at a time.
