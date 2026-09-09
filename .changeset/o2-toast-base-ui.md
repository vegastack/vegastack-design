---
"@vegastack/ui": minor
"@vegastack/design": minor
"@vegastack/design-tokens": minor
---

⚠️ **Toasts run on Base UI, and the `toast()` API changed with them.** `sonner` is removed from the
system and the registry item is renamed `sonner` → `toast`. `toast()` now takes a title plus Base
UI's options: `action: { label, onClick }` becomes `actionProps: { children, onClick }`, `duration`
becomes `timeout` (and `0`, not `Infinity`, disables auto-dismiss), and ids are strings.
`toast.message` is gone — it was `toast()`. `toast.custom` now renders the toast BODY inside a real
toast, so a custom notification keeps stacking, swipe-to-dismiss, `Escape` and the live region
instead of opting out of them. Resolving a loading toast is `toast.update(id, …)` rather than
re-firing with the same id. `Toaster` loses sonner's props: `position` values are logical
(`bottom-end`, not `bottom-right`), `expand` is gone because the stack expands on hover by design,
and `offset` / `mobileOffset` / `theme` are gone — the viewport carries the safe-area insets itself
and reads the theme from the cascade. `VegaStackProvider` always mounts the toast context now:
`toaster={false}` still suppresses the visible viewport — the part that must not mount twice — but
the provider `toast()` writes into is unconditional, so a host rendering its own `<Toaster />`
shares one queue. `@vegastack/design` gains `TIMINGS.tooltipOpenDelayMs` /
`TIMINGS.tooltipCloseDelayMs`, which the provider applies to `Tooltip.Provider` so every tooltip in
an app shares one rhythm. `@vegastack/design-tokens` gains a third z band, `--z-toast` (60): the
toast viewport mounts with the app provider, before any dialog exists, so DOM order alone would put
every later-opened dialog on top of it — and a toast fired from inside a modal must stay visible.
Sonner supplied that from its own private z-index, which is why elevation doctrine carried a
library-shaped exception; it is now a token with exactly one caller.
[docs](https://design.vegastack.com/docs/components/toast)
