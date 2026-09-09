---
---

🛠 **Patch/minor alignment across the workspace, and an explicit supply-chain floor.** Seventeen
packages moved to their current patch or minor, including the three Tailwind siblings brought to a
matching 4.3.3. The release-age floor is now **explicit** (`minimumReleaseAge: 1440` +
`minimumReleaseAgeStrict: true`) rather than inherited. Measured on pnpm 11.7.0: inherited, pnpm
appends a `minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml` and installs the too-new version
anyway; explicit, the install fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` and writes nothing.
The two stale `fumadocs-*@16.10.5` excludes were written by pnpm that way, not by a human, and are
deleted.

`@hookform/resolvers` moves 5.4.0 → 5.9.1 in the same pass: `zodResolver`'s overloads did not accept
a schema built by zod 4.5, so `field-form.test.tsx` — which exists to fail the typecheck when the
RHF/Zod surface drifts — stopped compiling. It did its job.
