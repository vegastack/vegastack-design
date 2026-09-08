---
"@vegastack/ui": minor
---

Display leaves (audit batch Di1). `Badge` adopts the system's variant vocabulary —
`solid · soft · outline · minimal`, with `subtle` renamed to `soft` — and gains three REAL
size tiers (`sm` 16px · `md` 20px · `lg` 24px) instead of one height with three padding
values. `minimal` becomes ink only (no fill, no border, no horizontal padding) and carries a
leading dot by default so a container-less badge never signals status by colour alone; a new
`icon` prop takes the dot's place. An indeterminate `Progress` is no longer a full-width bar
that reads as 100% complete — it is a 35% segment sweeping the track, with `aria-valuenow`
omitted. `RelativeTime` server-renders the absolute date and swaps to the relative label after
hydration, so there is no empty first frame. `TruncatedText` / `IconText` / `TableCellText` /
`RelativeTime` gain `focusable`, and a `TruncationFocusProvider` lets a host with its own
roving focus turn every cell tab stop off in one place. `TooltipKbd` renders `Kbd` instead of a
second key chip, `Kbd` defaults to `os="other"` (the caller resolves the platform with
`usePlatform`), `StatusIcon` sizes move to the `--icon-*` role tokens, a `Skeleton` line uses
the text radius, and twelve components drop `"use client"` because they never touched a hook.
