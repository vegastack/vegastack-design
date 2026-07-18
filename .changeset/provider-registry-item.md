---
'@vegastack/ui': minor
---

New `provider` registry item — `VegaStackProvider` + `useVegaStackTheme` ship as a copy-in
(`shadcn add @vegastack/provider`, composing the `sonner` Toaster item), closing the gap where
downstream projects had no sanctioned install path for the app-root wiring (theme, toasts,
tooltip coordination, direction). The private package's provider is now a documented mirror of
the canonical registry source.
