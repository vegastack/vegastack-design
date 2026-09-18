---
"@vegastack/design": minor
---

⚠️ **The shadcn `base-nova` reset — the runtime and token bridge are rebuilt on shadcn `base-nova`, with no compatibility layer.**

The optional `lucide-react` peer range moves to `^1.47.0`, matching the version the system is built
and tested against; a consumer on an older lucide should upgrade alongside this release.

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
the migration guide § 6.
