---
---

📚 The registry-auth banner no longer paints over the site header on a phone.

Fumadocs' `Banner` is a fixed-height sticky box — it writes the same `height` into its own inline
style and into `--fd-banner-height`, which every sticky offset below it is measured from. The notice
was long enough to need six lines at 320px inside that 48px box, so 72px of it overflowed and, at
`z-40` over the header's `z-30`, rendered on top of the VegaStack logo row. The layout boxes never
overlapped and there was no horizontal scroll, which is why nothing caught it: the defect was
content overflowing its own container, not a broken grid.

The trailing enumeration — the Base UI shadcn project, the `@vegastack` namespace, the Cloudflare
Access service token — is now shown from `lg` up, which is measured rather than guessed: the full
sentence occupies six lines at 320px, three at 480px, two at 768px and one from 1024px. Below that
the lead sentence and its link to [the registry setup](/docs/install) are unconditional, so the
notice itself is intact at every width and the detail is deferred to the page that performs it,
one tap away. The banner stays one line and 48px everywhere, and the wide layout is unchanged.
