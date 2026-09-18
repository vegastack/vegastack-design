---
"@vegastack/design": major
---

⚠️ **1.0 — the runtime and token bridge are rebuilt on shadcn `base-nova`, with no compatibility layer.**

`cn` is plain `twMerge` again, because the custom font-size class group it extended no longer exists,
and seven shared class-string recipes are **deleted with no alias**: `surfaceInteractive`,
`surfaceInteractiveGroup`, `fillInteractive`, `FillTone`, `fieldControl`, `fieldControlGroup` and
`selectedChipVariants`. Each described a system — a three-rung surface ladder, a per-tone fill map, a
shared text-entry chrome, a raised-chip recipe — that the reset deleted; replace each with the literal
it expanded to, or compose the upstream component it was re-deriving. `cn`, `TIMINGS`, `FLOATING`,
`mergeRefs`, `prose`/`proseClassName`, the icon runtime, the Tailwind preset and the
`vegastack-design` CLI are unchanged. The shipped agent skills are rewritten for the new vocabulary.

**Who this affects:** every consumer. Nothing is deprecated first — an import of a removed export
fails to resolve. The complete break, with a replacement for each removed export, is
`docs/MIGRATING-1.0.md` § 6.
