# Docs / Previews / Registry-Pipeline Audit — 2026-07-14

Scope: documentation and showcase completeness, and integrity of the canonical → copy-in →
registry-JSON generation pipeline, for all 68 canonical components in
`packages/ui/registry/ui/*.tsx` (excluding `*.test.tsx` and the `icons/` subdir).

**Bottom line: the pipeline is in excellent shape.** Every one of the 68 components has 1:1
coverage across MDX docs, preview file, preview-index export, `registry.json` entry, and
`public/r/*.json`. Canonical source and the docs copy-in are byte-identical for all 68 files.
Every provenance header matches its registry JSON `meta.integrity`. Docs quality is unusually
consistent — no stub pages found. The one real bug found is a stale/incorrect
`registryDependencies` entry on `notification-bell` (see §b).

---

## (a) Coverage matrix

68/68 canonical components have all five artifacts. No gaps, no missing pieces, in any of:

| Artifact                                        | Location                                  | Coverage                                |
| ----------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| MDX docs page                                   | `apps/docs/content/docs/components/*.mdx` | 68/68                                   |
| Preview file                                    | `apps/docs/components/preview/*.tsx`      | 68/68                                   |
| Preview barrel export                           | `apps/docs/components/preview/index.tsx`  | 68/68 (`export * from './<name>'`)      |
| Registry JSON                                   | `apps/docs/public/r/<name>.json`          | 68/68                                   |
| `registry.json` item entry                      | `packages/ui/registry.json`               | 68/68                                   |
| Copy-in (`apps/docs/components/ui/*.tsx`)       | —                                         | 68/68, byte-identical to canonical (§b) |
| Nav entry (`content/docs/components/meta.json`) | —                                         | 68/68, correctly grouped (§f)           |

One naming wrinkle, **not a gap**: the registry item / canonical file / copy-in file are named
`sonner`, but the MDX page and nav entry are `toast.mdx` / "Toast". This is intentional and
self-documented inside `toast.mdx`: _"The component is documented as Toast because that is the
design-system pattern; the registry item is named `sonner` because it wraps and re-exports
Sonner."_ Confirmed no separate `sonner.mdx` orphan exists and no `toast` canonical component
exists — clean 1:1 mapping once the alias is accounted for.

### Reverse check — orphans (docs/previews/registry items with no canonical component)

None found:

- `apps/docs/content/docs/components/*.mdx` — 68 files, all map to a canonical component (via the
  toast↔sonner alias above).
- `apps/docs/components/preview/*.tsx` — 71 files = 68 component previews + `index.tsx` (barrel),
  `utilities.tsx` (shimmer/marker helper demos, referenced from `utilities.mdx`), `wrapper.tsx`
  (shared preview scaffold, used by 70/71 preview files). No dangling previews.
- `apps/docs/public/r/*.json` — 509 files total, but 441 of those are individual **icon** registry
  items (lucide icons mirrored 1:1 for `AnimatedIcon`/`shadcn add @vegastack/<icon>`), which is
  expected per `docs/foundations/icons.mdx` and not in scope of "components." The 68 component
  items all match canonical names exactly.
- `packages/ui/registry.json` — same story, 507 unique item names = 68 components + ~439 icons,
  no unexplained extras.

---

## (b) Sync integrity

**Canonical ↔ copy-in byte-identity:** Verified via SHA-256 hash comparison (not naive `diff`,
which stalled on this tree — see note) across all 68 pairs
(`packages/ui/registry/ui/<name>.tsx` vs `apps/docs/components/ui/<name>.tsx`).
**Result: 0 mismatches.** Every copy-in file is byte-for-byte identical to its canonical source,
confirming `npm run registry:build` is doing its job and no one has hand-edited a copy-in file
since the last rebuild.

**Provenance header ↔ registry JSON integrity:** Every canonical file's first line
(`// @vegastack <name>@<version> sha256-<hash>`) was cross-checked against
`apps/docs/public/r/<name>.json`'s `meta.integrity`. **Result: 0 mismatches across all 68** — the
stamped header and the built JSON agree everywhere.

**`registryDependencies` / `dependencies` spot-check (10 components, including compound ones):**
Cross-referenced `packages/ui/registry.json`'s declared `registryDependencies` against the actual
`@/components/ui/*` imports found in each canonical source file.

| Component         | Declared `registryDependencies`         | Actual imports                          | Match? |
| ----------------- | --------------------------------------- | --------------------------------------- | ------ |
| `button`          | `[]`                                    | (none)                                  | Yes    |
| `date-picker`     | `popover`, `button`                     | `popover`, `button`                     | Yes    |
| `split-button`    | `button`, `dropdown-menu`               | `button`, `dropdown-menu`               | Yes    |
| `color-picker`    | `popover`, `button`                     | `popover`, `button`                     | Yes    |
| `emoji-picker`    | `popover`, `button`, `input`            | `popover`, `button`, `input`            | Yes    |
| `command`         | `dialog`                                | `dialog`                                | Yes    |
| `sidebar`         | `separator`                             | `separator`                             | Yes    |
| `field-inline`    | `input`                                 | `input`                                 | Yes    |
| `auto-save-input` | `input`                                 | `input`                                 | Yes    |
| `country-select`  | `popover`, `command`, `button`          | `popover`, `command`, `button`          | Yes    |
| `state-select`    | `popover`, `command`, `button`, `input` | `popover`, `command`, `button`, `input` | Yes    |

I then ran this comparison programmatically across **all 68** components (import-scan vs
declared `registryDependencies`), not just the 10 above. **1 mismatch found:**

> **BUG — `packages/ui/registry.json`, item `notification-bell`** (also propagated to the built
> `apps/docs/public/r/notification-bell.json`): `registryDependencies` lists
> `["@vegastack/separator", "@vegastack/button", "@vegastack/icon-button"]`, but
> `packages/ui/registry/ui/notification-bell.tsx` only imports `@/components/ui/icon-button`
> (confirmed via `grep -n "^import"` — no other `@/components/ui/*` import, and `grep -i
"separator"` returns zero matches anywhere in the file or its preview). `button` is at least
> a legitimate transitive dependency (icon-button depends on it) even if redundant for a shadcn
> registry (the CLI resolves transitive deps on its own), but `@vegastack/separator` is flatly
> incorrect — it looks like a copy-paste artifact from another item's entry. A consumer running
> `shadcn add @vegastack/notification-bell` would pull down `separator` for no reason. Low
> severity (extra unused file, not a broken install) but should be cleaned up — fix by editing
> `packages/ui/registry.json`'s `notification-bell` entry, then `npm run registry:build`.

**`public/r/*.json` integrity headers exist:** Confirmed present and well-formed
(`meta.integrity` field, `sha256-...` format) for all 68 sampled/verified items — see the
header-match check above, which implicitly required the field to exist on every item.

_Note on method:_ An initial `diff`-in-a-shell-loop across all 68 pairs hung past the 2-minute
tool timeout for an unclear reason (likely shell/subprocess overhead, not a data problem — file
counts and line counts on both sides were confirmed normal beforehand). Switched to
`shasum -a 256` per file + `sort`/`diff` on the hash lists, which completed in seconds with a
clean (empty) diff. Flagging this only so a future agent doesn't re-hit the same stall with the
naive approach.

---

## (c) Docs quality (structural sweep of all 68 + close reading of 15)

Ran a structural check across **all 68** MDX pages (not just the 15-page sample) for four
required sections: `## Installation`, `## Accessibility`, `<DoDont ...>`, and a props table
(`AutoTypeTable`/`TypeTable`). **Result: 0 gaps** — every single component page has all four.
There are no stub pages in this docs set.

Close-read sample (15 pages spanning simple → complex, plus the two shortest pages overall):
`accordion`, `button`, `date-picker`, `split-button`, `sidebar`, `command`, `dialog`, `select`,
`data-list`, `message`, `bubble`, `auto-save-input`, `text-edit`, `filter-bar`, `toast`, plus
`separator` (shortest file, 64 lines) as a floor check.

Findings:

- **`separator.mdx`** (64 lines, the shortest doc in the set) is still complete: installation,
  usage, orientation variant, full props table, a dedicated a11y table (`role` /
  `aria-orientation` / `data-orientation` per state), and Do/Don't. No stub risk even at minimum
  length.
- **`button.mdx`** (68 lines, second-shortest) documents 15 variants × 8 sizes, states
  (loading/disabled with `aria-busy` semantics), a variant×size interaction matrix, full props
  table, and unusually precise a11y notes (focus-ring behavior per variant, `render`-for-links
  guidance). Dense, not thin.
- **`message.mdx`** correctly has _no_ "states" section — `Message` is documented as pure
  presentational layout with no loading/disabled concept, and the page explicitly covers the one
  state-adjacent pattern that matters (a `destructive` bubble + retry affordance for a failed
  message) under "Actions." This is a deliberate omission, not a gap.
- **`command.mdx`** (544 lines, the longest sampled) documents loading and empty states explicitly
  (`Loading`, `empty state` both present), 11 props-table blocks (multiple sub-components), and
  composition into `country-select`/`state-select`.
- **`data-list.mdx`** documents empty, loading, and error states with explicit `aria-busy` /
  live-region behavior — thorough for a data-heavy component.
- No component in the 15-page sample or the full-68 structural sweep reads as auto-generated
  boilerplate; every Do/Don't pair is component-specific (not a templated "do use it, don't
  misuse it").

**Foundations pages** (`docs/foundations/*.mdx`, 10 files, 41–143 lines each): all substantive.
`icons.mdx` and `motion.mdx` are the shortest (41–42 lines) but dense — `icons.mdx` covers all
three sanctioned icon sources (`Icon`/`BrandIcon`/`AnimatedIcon`), sizing tokens, a11y defaults,
and reduced-motion guidance in that space, plus embeds `<IconGallery />`. No stubs found here
either.

No TODO/FIXME/stub markers found anywhere in `content/docs/components/*.mdx` or
`components/preview/*.tsx` (grepped explicitly; all "placeholder" hits are the legitimate
`placeholder` prop, not stub markers).

---

## (d) Preview hygiene

Grepped all 71 files in `apps/docs/components/preview/` for the violation patterns called out in
the mission (styling overrides masking component defaults, hardcoded colors, inconsistent
scaffolding). **No violations found:**

- **Hardcoded hex/rgb colors:** zero real hits (`#` matches were all in prose text like `#482`
  PR-number strings and `<code>` samples, not CSS).
- **Non-semantic Tailwind palette classes** (`bg-red-500`, `text-neutral-900`, etc., which
  AGENTS.md explicitly bans): zero hits anywhere in `preview/*.tsx`.
- **Inline `style={{...}}`:** zero occurrences.
- **`!important` / bang-modifier classNames:** zero occurrences.
- **Raw pixel arbitrary values** (`w-[400px]` etc.): zero occurrences.
- **className overrides on component tags:** the only hits (44, across `command.tsx`,
  `date-picker.tsx`, `scroll-area.tsx`, `message-scroller.tsx`, `collapsible.tsx`,
  `context-menu.tsx`, `skeleton.tsx`, `truncated-text.tsx`, `field-inline.tsx`,
  `relative-time.tsx`) are all legitimate composition, not restyling:
  - Sizing/positioning on _container_ components that have no intrinsic dimensions by design
    (`ScrollArea`, `Command`, `MessageScroller`, `Collapsible` — e.g.
    `apps/docs/components/preview/scroll-area.tsx:53` `className="h-56 w-56 rounded-lg border
border-border"`), which is the documented/expected shadcn pattern — these components are
    meant to be sized by the consumer.
  - All colors used are semantic tokens (`border-border`, `bg-popover`, `shadow-overlay`,
    `text-muted-foreground`) — never raw palette values, consistent with the design-system rule.
  - `TruncatedText` (`apps/docs/components/preview/truncated-text.tsx:26,38,55`) and
    `FieldInline` (`apps/docs/components/preview/field-inline.tsx:40`, demoing the `borderless`
    prop) are typography-agnostic components whose whole API contract is "consumer supplies
    text-size/color via className" — this is intended usage, not a masked default.

**Scaffolding consistency:** 70 of 71 preview files import and wrap their examples in the shared
`Wrapper` component from `./wrapper` (the 71st is `index.tsx`, the barrel, which correctly has
no content of its own). No ad-hoc/one-off preview scaffolding found.

---

## (e) Registry UX / `docs/RELEASING.md` accuracy

Read `docs/RELEASING.md` and cross-checked every documented command against the actual
implementation in `packages/utils/bin/`:

- **`vegastack-design check-updates`** (`packages/utils/bin/check-updates.mjs`): doc claims it
  "compares by integrity hash... avoids false 'update' noise when the global version bumps but a
  given component's content didn't change." Source code comment (lines 12–14) and implementation
  (`status = c.hash === r.integrity ? 'current' : 'update'`, line 261) match exactly.
- **`vegastack-design verify [--hash-only] [--save <path>] <name>`** and
  **`vegastack-design verify --post-write --item <path> --target-dir <dir>`**
  (`packages/utils/bin/verify-registry-item.mjs`): all four flags referenced in `RELEASING.md`'s
  "Receive an update" snippet (`--save`, `--post-write`, `--item`, `--target-dir`) exist verbatim
  in the script's own `USAGE` string and argument parsing.
- **Deprecated alias**: AGENTS.md and the doc reference `vegastack-verify-registry-item` as a
  deprecated alias for `vegastack-design verify`. Confirmed in `packages/utils/package.json`'s
  `bin` map (both entries present) and a live deprecation warning at
  `packages/utils/bin/verify-registry-item.mjs:353`
  (`'[deprecated] \`vegastack-verify-registry-item\` is now \`vegastack-design verify\` — please switch.'`).
- **Dispatcher wiring** (`packages/utils/bin/vegastack-design.mjs`): `check-updates` is imported
  in-process, `verify` is spawned as a subprocess with `VEGASTACK_DESIGN_DISPATCH=1` set (to
  suppress the deprecation notice when called via the non-deprecated entrypoint) — matches the
  doc's implicit assumption that both subcommands "just work" under the one bin.

**No doc drift found.** The `RELEASING.md` runbook is accurate against current script behavior in
every particular checked.

---

## (f) IA — nav / `meta.json` review

`apps/docs/content/docs/components/meta.json` groups all 68 components into 9 logical,
non-overlapping sections: Buttons & Actions, Inputs & Controls, Overlays, Menus & Commands,
Navigation, Layout & Structure, Data Display, Feedback & Status, Content & Typography, Chat &
Communication (10 sections total). Verified programmatically that the page list is exactly the
68 canonical components (accounting for the toast/sonner alias) — no duplicates, no omissions,
no stray entries.

Groupings read as sensible to a component consumer (e.g. `country-select`/`state-select` sit with
other input controls next to `select`, not off on their own; `command` is grouped with
`dropdown-menu`/`context-menu` under "Menus & Commands" even though it's also a dependency of the
select-family components — a reasonable primary-use-case placement).

`apps/docs/content/docs/foundations/meta.json` covers all 10 foundation pages requested by the
mission's checklist and more: `design-principles`, `colors`, `typography`, `spacing`, `radius`,
`elevation`, `motion`, `icons`, `accessibility`, `theming`. **No missing foundation pages** — color,
typography, spacing, motion, and icons (the five the mission explicitly named) are all present,
plus radius/elevation/accessibility/theming/design-principles beyond the minimum.

`apps/docs/content/docs/utilities/meta.json` covers `shimmer` and `scroll-fade` — smaller
cross-cutting CSS utilities, correctly kept out of the component tree.

Root `apps/docs/content/docs/meta.json` orders top-level sections as: index, install,
foundations, components, utilities, changelog — a sensible onboarding order (concept → install →
building blocks → components → utilities → changelog).

---

## Prioritized fix list

1. **[Low, but real] Fix `notification-bell`'s stray `registryDependencies`.** Edit the
   `notification-bell` item in `packages/ui/registry.json`, remove `@vegastack/separator`
   (unused — confirmed zero references in source or preview), and consider dropping
   `@vegastack/button` too (redundant: `icon-button` already declares it as its own dependency,
   and shadcn resolves transitive deps automatically). Then run `npm run registry:build` to
   regenerate `apps/docs/public/r/notification-bell.json` and re-stamp the hash. This is the only
   confirmed data-integrity bug found in this audit.
2. **[Cosmetic, optional] Document the toast/sonner naming split more prominently.** It's already
   explained inline in `toast.mdx`, but a first-time contributor scanning `packages/ui/registry/ui/`
   for a "toast" component and finding none could be confused; a one-line pointer in
   `AGENTS.md`'s locked-decisions list (alongside the message-scroller exception) would close the
   loop for future agents. Not urgent — the current in-page explanation is sufficient for docs
   readers, this is purely an agent-onboarding nicety.
3. **[Process note, no action needed]** No further fixes identified. Coverage, sync integrity
   (byte-identity + header/JSON hash agreement), docs quality, preview hygiene, the RELEASING.md
   runbook, and nav/IA all passed clean.
