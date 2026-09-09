---
"@vegastack/design": minor
"@vegastack/ui": minor
---

🛠 **Animated icons are one factory plus 439 data modules.** Every mirrored `lucide-animated`
icon used to carry its own copy of the controller — the animation controls, the reduced-motion gate,
five pointer/focus handlers, the imperative handle and a block-level host — so a change to any of
that meant regenerating 439 files and trusting that all 439 agreed. The controller now lives once in
`createAnimatedIcon`, exported from the new `@vegastack/design/create-animated-icon` subpath, and
each icon is a `createAnimatedIcon({ … })` call describing only its geometry, its Motion variants,
and (for 49 icons) its non-default start/stop steps. `motion` becomes an OPTIONAL peer dependency —
only an animated icon pulls it in, so `Icon`/`BrandIcon` consumers are unaffected. The corpus went
from 79,078 lines to 12,951 (-84%) and from 2.06 MiB to 0.57 MiB of source; the served registry fell
from 4.48 MiB to 2.92 MiB. `tooling/mirror-animated-icons.mjs` emits the data modules and fails
closed on any upstream archetype it cannot model; `tooling/verify-animated-icons.mjs` asserts the
controller contract once against the factory, holds every module to a schema whose central clause is
that a data module contains no controller at all, pins each generated module by SHA-256 in
`packages/ui/animated-icon-sources.json` so a hand-edited path or timing value is rejected outright,
and carries a `--self-test` that proves fifteen distinct regressions are rejected.
[docs](https://design.vegastack.com/docs/foundations/icons)
