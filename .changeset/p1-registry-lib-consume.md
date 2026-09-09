---
"@vegastack/design": patch
---

🐛 `registry:lib` files are now modeled as shadcn-transformed in the shipped consume verifier. `shadcn
add` removes a JS/TS file's entire leading comment prologue as it writes it, for every file type it
touches — but `verify-registry-item.mjs` listed only `registry:ui`, `registry:hook`, `registry:page`
and `registry:component`, so the first `registry:lib` items (`geo-data`, `drag-item`) compared the
copy-in against unstripped source and failed post-write verification with a line-count mismatch —
i.e. the gate reported a TOCTOU signal for a transform the CLI is sanctioned to perform.
`check-updates` reads the same set, so its diffs were affected identically.
