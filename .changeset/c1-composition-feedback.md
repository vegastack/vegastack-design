---
"@vegastack/ui": minor
---

Composition and feedback (audit C1, batch 7).

- `Item` takes `role="listitem"` only inside an `ItemGroup`, which now provides the context that licenses it; a standalone row renders no role, so it can no longer raise an axe `aria-required-parent` critical, and `Timeline` drops its `role="none"` workaround.
- `ItemTitle` moves to the system list-row type — `text-label` (14/500), `text-label-sm` at `size="sm"`.
- `Alert` is a polite `role="status"` for every intent; a new `live` prop marks a runtime announcement and escalates a `destructive`/`warning` intent to the assertive `role="alert"`. `AnnouncementBanner` carries no live role at load and takes the same `live` prop.
- `NotificationBell` replays its pop-in through `useAnimationReplay` against a `previousCount` held in state, replacing a mount ref read during render and a `key`-remount; the cue fires only when the count rises after mount into a visibly different badge.
- `OnboardingChecklist` composes `ProgressIndicator segments` instead of hand-rolling a second `role="progressbar"`; `ProgressIndicator` gains `segmentsFill` and accepts a single segment.
- `Empty` replaces `bordered` + `surface` with one `variant: plain | card | dashed`, and `EmptyTitle` takes an `as` prop for the heading level.
- Accordion and Collapsible triggers hover with `surfaceInteractive` — with the padding, inner radius and hairline inset the wash requires — instead of a link underline; a navigable `Stepper` label is a `link`-variant Button.
