---
---

🧩 **`toast`** — the toast surface on Base UI's Toast primitive, replacing the sonner wrapper. It
ships the whole vocabulary rather than a configured library root: `ToastProvider`, `Toaster`,
`Toast` and every part (`ToastRoot`, `ToastContent`, `ToastTitle`, `ToastDescription`,
`ToastAction`, `ToastClose`, `ToastViewport`, `ToastPortal`, `ToastPositioner`, `ToastArrow`), plus
`useToast` and the imperative `toast()`. Stacking with expand-on-hover, swipe-to-dismiss, `F6` into
the viewport landmark and `Escape` on the focused toast come from the primitive; promise toasts and
a custom `render` come with it. The surface is the floating-family recipe at 16px padding and a
typed toast wears Alert's exact tint recipe, so the two status surfaces read as one design. Six
types (`default · success · error · warning · info · loading`) — the strings follow the engine,
which writes `loading`/`success`/`error` in `promise()` itself, while the tokens follow the house
families. The live-region policy is enforced in code: `error` and `warning` announce urgently,
everything else politely, derived from the type.
[docs](https://design.vegastack.com/docs/components/toast)
