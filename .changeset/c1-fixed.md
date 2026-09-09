---
"@vegastack/ui": minor
---

🐛 **The notification badge pops for real activity only.** `NotificationBell` read a mount ref during
render and flipped it in an effect that scheduled no re-render, so the pop-in class first landed on
whatever unrelated re-render happened next: a parent state change animated the badge with no new
notification behind it. The previous count is now held in state and the cue is replayed through
`useAnimationReplay` when the count rises after mount **and** the badge visibly changes — so it never
fires on mount, never on a re-render, and never for 100 → 101 (both read `"99+"`). The `Timeline`
hero fixture, which sat under the 24px pointer-target floor, is lifted off it.
[docs](https://design.vegastack.com/docs/components/notification-bell)
