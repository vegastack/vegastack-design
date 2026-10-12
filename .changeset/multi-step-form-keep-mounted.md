---
"@vegastack/ui": patch
---

🐛 **Multi-step form**: a step body now stays mounted (hidden) after its first visit, so a move no longer replaces the node, resets its state or re-runs its effects. The entrance animation plays only on a move, never on first paint.
[docs](https://design.vegastack.com/docs/components/multi-step-form)
