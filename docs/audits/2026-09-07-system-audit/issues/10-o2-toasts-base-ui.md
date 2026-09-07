---
title: "O2 · Toasts: migrate from sonner to Base UI Toast, keep the system's style"
labels: [audit-2026-09, components, overlays]
---

## Context

Audit 2026-09-07, `02-batch-03-overlays.md` B3-07 and decision **D13**: "migrate to Base UI Toast
keeping our style and design system — supporting all variants and features Base UI Toast offers"
(https://base-ui.com/react/components/toast). `02-batch-09` B9-02 (the provider mounts sonner's
`Toaster`; tooltip delays have no home). Depends on D1 (Base UI 1.8) and O1's floating/motion
values; padding 16px (D14).

## Problem

- Sonner ships its own focus styles (a box-shadow glow), its own motion and its own colour
  handling that the toaster mirror gate has to patch (`sonner.tsx`, `verify-toaster-mirror`).
- The provider (`provider.tsx`) is coupled to sonner; consumers import `toast` from sonner.

## Do

1. New `toast` registry item on Base UI Toast: `ToastProvider` (limit, timeout, swipe directions),
   `ToastViewport`, `Toast` with `title`, `description`, `action`, `close`, `type: default |
success | warning | destructive | info`, promise toasts, custom `render`, stacking/expand on
   hover, keyboard (F6 / Escape), `useToastManager` re-export as `useToast`/`toast()`.
2. Our styling: `surface-2` on `card`, alpha border, 16px padding, `shadow-overlay`, D11 timings,
   `motion-dock`-style enter/exit, tone strip via `StatusIcon`; standard focus ring.
3. Provider: mount the Base UI `ToastProvider` + viewport; `toaster` prop keeps its shape
   (`boolean | ReactNode`); set `Tooltip.Provider` `delay`/`closeDelay` from `TIMINGS` here.
4. Remove `sonner` from the registry item deps, `packages/ui/package.json`, the provider's
   `registryDependencies`, and delete `verify-toaster-mirror` (or repoint it at the new item).
5. Docs: `toast.mdx` rewritten (all variants, promise, action, stacking, RTL, reduced motion);
   contract fixtures for each type; Changelog `⚠️` (API change) and `🗑` (sonner).
6. Doctrine: `design.md` §Feedback — toasts on Base UI Toast; live-region policy (D23) applies.

## Acceptance

- `grep -rn "sonner" packages apps --include=*.ts --include=*.tsx --include=*.json` → 0.
- Toast fixtures pass the contract lane in five lanes; keyboard: Escape dismisses, F6 reaches the
  viewport; axe clean; forced-colours probe shows the standard ring.
- `pnpm gates:component toast provider`; `verify-shadcn-consume` passes with the new item.
