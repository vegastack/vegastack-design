---
"@vegastack/ui": minor
---

🔧 **`Image` lazy-loads and decodes off-thread by default.** `loading="lazy" decoding="async"`
are now the defaults, matching what MarkdownView already did for its images. Pass `loading="eager"`
for an above-the-fold hero, where deferring the fetch delays LCP rather than saving it.
[docs](https://design.vegastack.com/docs/components/image)
