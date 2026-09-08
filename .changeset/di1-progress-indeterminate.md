---
"@vegastack/ui": minor
---

🐛 **An indeterminate `Progress` no longer reads as 100% complete.** Base UI writes no inline
width when `value` is `null`, so an indicator styled only for the determinate case inherited the
track's full width — an upload in progress looked finished. It is now a 35% segment sweeping the
track on the one sanctioned looping utility, `motion-indeterminate`, whose keyframes rest on the same
frame at both ends so reduced motion leaves a static segment rather than a full bar, and
`aria-valuenow` is omitted.
[docs](https://design.vegastack.com/docs/components/progress)
