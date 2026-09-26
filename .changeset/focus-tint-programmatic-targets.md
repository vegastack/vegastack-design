---
"@vegastack/design-tokens": patch
"@vegastack/design": patch
---

Programmatic focus targets (`tabindex="-1"`) no longer paint the `:focus-visible` background tint. Before this, clicking the empty part of AppShell's `<main>` and then pressing any key (Shift or ⌘ alone) tinted the whole page grey. Combobox chips keep the cue.
