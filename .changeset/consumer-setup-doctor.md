---
"@vegastack/design": minor
---

Add `vegastack-design doctor`, and stop the drift gate failing open.

**`doctor`** — a read-only setup check for consuming projects. It verifies the package is
installed, `preset.css` is imported, the Tailwind PostCSS plugin is configured, Tailwind is not
imported twice, the `@vegastack` registry is declared, and (in a workspace) that `@source`
directives are present. Understands monorepo layouts: it looks for the PostCSS config in the
package that owns the preset-importing stylesheet, and walks up for `components.json`.

Motivated by a real consumer failure. A missing `@tailwindcss/postcss` plugin has two misleading
symptoms and no obvious cause: under Turbopack the build dies with `Can't resolve 'tw-animate-css'`,
naming a dependency that is installed and fine; under webpack the build **succeeds** with the token
theme applied and **zero utility classes generated**, which reads as "the design system is broken".

**`check-updates --fail-on-update` now exits 1 when it finds zero components.** It previously exited
0, so any project whose components sit outside the default path — every monorepo — got a
permanently green CI drift gate that scanned nothing. Zero components under an explicit gate is a
misconfiguration, not a clean bill of health. Without the flag the behaviour is unchanged, since
"no components yet" is legitimate mid-setup.
