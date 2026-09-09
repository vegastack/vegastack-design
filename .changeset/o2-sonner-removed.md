---
---

🗑 **`sonner`** — the registry item and the dependency. Removing it deletes a rendering engine, the
CSS override layer that fought the library's internal greys, its z-index exemption and a
`:focus-visible` box-shadow glow the design system bans everywhere else. Toasts are now
`@vegastack/toast`. The toaster-mirror gate stays but points at `toast.tsx` — the private
`@vegastack/ui` package still needs a byte-identical `Toaster` — and the
`sonner-human-facing-alias` contract exemption is gone, because it existed only while the registry
item was named `sonner` and its page was `/docs/components/toast`; the two now match.
[docs](https://design.vegastack.com/docs/components/toast)
