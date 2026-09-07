---
title: "C1 · Composition and feedback: Item role and type, polite alerts, NotificationBell replay, Empty variants"
labels: [audit-2026-09, components, a11y]
---

## Context

Audit 2026-09-07, `02-batch-07-composition-feedback.md` B7-01…B7-10. Decisions: D23 (`status` by
default; `alert` only for destructive/warning rendered after mount), D24 (Item title 14/500,
description 12; `size="sm"` keeps 12/12). Depends on F1 (disclosure hover wash), F2 (`IconButton`
dismiss, link-style button).

## Problem

- `item.tsx:122` sets `role="listitem"` whenever `render` is absent → axe `aria-required-parent`
  (critical) on every standalone Item; `timeline.tsx:86-91` documents a `role="none"` workaround.
- `alert.tsx:160` every Alert is `role="alert"` (assertive); `announcement-banner` `role="status"`
  on a strip present at load.
- `notification-bell.tsx:80-97` documents its own bug: the pop-in fires on the next unrelated
  render.
- `onboarding-checklist.tsx:142-160` hand-rolls the segmented progress bar `ProgressIndicator
segments` already provides (`progress-indicator.tsx:243-296`).
- `ItemTitle`/`ItemDescription` are 12/12 (`item.tsx:241,267`) while every other row type is 14.
- `alert.tsx:186-195`, `announcement-banner.tsx:87-97`, `onboarding-checklist.tsx:123-133`
  hand-roll dismiss buttons.
- `empty.tsx:21-31` `bordered` and `surface="card"` overlap; `EmptyTitle` hard-codes `<h3>`.
- `collapsible.tsx:82`, `accordion.tsx:115` `hover:underline` (link affordance) on disclosures.
- `stepper.tsx:281-283` strips a Button to look like inline text.
- Docs: `alert.mdx` "Strip variant" and `empty.mdx` "Illustration & value tiers" after Do/Don't;
  thin previews/tests for announcement-banner, onboarding-checklist, card, timeline.

## Do

1. `ItemGroup` provides context; `Item` sets `role="listitem"` only inside it (or an explicit
   `role`); remove the Timeline workaround.
2. Alert: `role="status"` for `default|info|success`; `role="alert"` for `destructive|warning`
   **only** when `live` (rendered after mount — a `live` prop like `AttachmentDescription`); no
   live role for static content. AnnouncementBanner: no live role at load; `live` prop for
   runtime banners.
3. NotificationBell: `previousCount` in state; when `count` increases after mount set an
   `animate` flag cleared on `animationend` via `useAnimationReplay`; delete the key-remount trick.
4. OnboardingChecklist composes `ProgressIndicator segments`; dismiss/collapse buttons →
   `IconButton variant="ghost" size="xs"` (Alert, Banner, Onboarding).
5. `ItemTitle` `text-base`/500 (`text-label`), `ItemDescription` `text-sm`; `size="sm"` 12/12.
6. `Empty variant: plain | card | dashed` replaces `bordered` + `surface`; `EmptyTitle` accepts
   `render`/`as`. Disclosure triggers hover with `surface-2`, no underline. Stepper's navigable
   label uses `Button variant="link" tone="neutral"`.
7. Docs: move the two post-Do/Don't sections into Examples; add fixtures/tests per B7-10.
8. Doctrine: `design.md` §Live regions (D23), §Lists (row type 14/500 + 12).

## Acceptance

- axe: 0 `aria-required-parent` across item, timeline, sortable-list routes.
- Unit tests: Alert static → `status`; destructive `live` → `alert`; NotificationBell pops exactly
  once when count increases, never on mount.
- `grep -rn "hover:underline" packages/ui/registry/ui` → only `link`-role components.
- `pnpm gates:component item timeline alert announcement-banner notification-bell
onboarding-checklist empty collapsible accordion stepper`.
