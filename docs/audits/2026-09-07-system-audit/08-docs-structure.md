# 08 — Docs structure proposal (humans and agents)

MK's brief (2026-09-07): the docs must adhere to the design system end to end (Fumadocs chrome
included), look like a modern design-system site, work equally for humans and agents, have one
consistent page shape with the right sections and formatting everywhere, leverage Fumadocs
features where they help, and carry a clear verification stream so adding or updating a component
keeps every page correct. "Props isn't working properly in all comps" was the trigger.

## 1 · What is actually broken today (measured)

| #              | finding                                                                                                                                                                                                                                                                                                                                                                                                                           | evidence                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DS-01 · HIGH   | **Agents get no props and no example code.** The per-page markdown route and `llms-full.txt` emit the _processed_ MDX with the JSX tags left in: `<AutoTypeTable path=… name="ButtonProps" />` appears verbatim in 107 of 110 component `.md` pages and 260 times in `llms-full.txt`; `<ComponentPreview name=… file=… />` (6 per Button page) likewise. An agent reading the docs sees zero prop tables and zero example source. | `apps/docs/out/docs/components/button.md`, `lib/source.ts:39-42` (`getText("processed")` with no components) |
| DS-02 · MEDIUM | **Human prop tables hide the useful part.** Fumadocs `TypeTable` rows are collapsed accordions: the visible cell shows `variant? union` and the values/description only appear on click. A reader must expand every row to learn that `variant` is `default \| secondary \| …`.                                                                                                                                                   | `out/docs/components/button.html` API section (`data-state="closed"`, `simplifiedType`)                      |
| DS-03 · MEDIUM | **138 placeholder rows.** 18 pages render "(no own props)" rows, 4–24 per page (combobox 24, dropdown-menu 18, context-menu 18, select 14, navigation-menu 14, popover 12): the API Reference of a compound component is mostly noise.                                                                                                                                                                                            | same export, `mdx.tsx:110-131`                                                                               |
| DS-04 · MEDIUM | **No section canon is enforced.** `content-lint.mjs` checks skipped visual tests and CSS import order only. Pages carry "Scope", "Playground", "Anatomy", "Notes", "Voice", "How it works", "Lit finish" (after Do/Don't), "Strip variant" (after Do/Don't), "Illustration & value tiers" (after Do/Don't) in varying positions.                                                                                                  | `tooling/content-lint.mjs`; section dumps in batches 4–9                                                     |
| DS-05 · MEDIUM | **Docs chrome breaks the system it documents.** Weight 600 headings/sidebar/strong, `.vs-type-product` scope that leaves the inherited 15px/28px prose base under demos, a hand-rolled fullscreen dialog with no trap, six toolbars per page, mixed `fd-*`/system tokens, raw `<button>`/`<kbd>` specimens, no skip link, a focusable `<div>` per icon.                                                                           | `05-docs-chrome.md` DC-01…DC-17                                                                              |
| DS-06 · LOW    | **Fumadocs features available but unused or half-used.** `remarkLLMs` `output: "function"` + `asMarkdown()` (agent output), `Steps` for install, `Files` for anatomy trees, `Banner` for the registry notice (once, not per page), OpenAPI-style "playground" not needed. Search is Orama static (fine).                                                                                                                          | Fumadocs 16.11 docs                                                                                          |

## 2 · The page canon (one shape for every component)

Ordered, fixed headings; every section has a required _machine-readable_ part and an optional prose
part. Generated where possible, linted always.

| #   | section                                              | required content                                                                                                                                                                                                                                                                             | source of truth                                                                                                       |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 0   | **Frontmatter**                                      | `title`, `description`, `preview` (hero fixture), `registry` (item name), `status` (`stable \| preview \| deprecated`), `since` (version), `a11y` (pattern name, e.g. `APG grid`)                                                                                                            | frontmatter, validated by `source.config.ts` schema                                                                   |
| 1   | **Install**                                          | one `Steps` block: `shadcn add @vegastack/<name>` + the registry callout rendered **once per site** as a `Banner`, not per page; the item's `registryDependencies` and sanctioned engines listed automatically                                                                               | generated from `registry.json`                                                                                        |
| 2   | **Usage**                                            | minimal import + one canonical JSX snippet (the "if you copy one thing" example)                                                                                                                                                                                                             | hand-written, ≤12 lines, linted for presence                                                                          |
| 3   | **Scope** _(composite components only)_              | three bullets max: owns / does not own / compose with                                                                                                                                                                                                                                        | hand-written; required when the contract marks the item `composite`                                                   |
| 4   | **Anatomy** _(compound components only)_             | the part tree as a `Files`-style tree with one line per part, and the `data-slot` names                                                                                                                                                                                                      | generated from the component's exported parts + `data-slot` attributes                                                |
| 5   | **Examples**                                         | each `ComponentPreview` with the fixture name, one-line intent, **source code included in the markdown export**                                                                                                                                                                              | `components/preview/<name>.tsx`; each fixture is also a contract-lane route                                           |
| 6   | **Playground** _(where a curated playground exists)_ | the `PropsPlayground`; the Story "Explorer" only where no playground exists (DD-2/3 decision)                                                                                                                                                                                                | `components/playground/*`                                                                                             |
| 7   | **API Reference**                                    | one table per exported part; **own props only, expanded by default** (name · type with the literal union · default · description); parts with no own props listed in one sentence, never as placeholder rows; `data-*` attributes and CSS variables the part exposes in a second small table | generated by `AutoTypeTable` + a custom renderer (flat table) and a `component-contracts.json` `dataAttributes` field |
| 8   | **Accessibility**                                    | pattern name + link, keyboard table (key → action), screen-reader announcements, the states tested (default/hover/focus/loading/empty/error/success/disabled)                                                                                                                                | keyboard table hand-written; the states row generated from the contract's `states` field                              |
| 9   | **Do / Don't**                                       | ≥2 pairs, each pair a fixture or a sentence                                                                                                                                                                                                                                                  | `DoDont`                                                                                                              |
| 10  | **Changelog** _(generated)_                          | the item's entries from `/CHANGELOG.md` filtered by name                                                                                                                                                                                                                                     | `sync-changelog.mjs`                                                                                                  |

Nothing after Do/Don't except the generated Changelog. "Notes", "Voice", "How it works" fold into
Usage or Scope. Marketing-only leaves (RuledBand, Testimonial) skip Scope/Anatomy/Playground and
keep the rest.

## 3 · The agent export

- Switch `remarkLLMs` to `output: "function"` and pass `getMDXComponents()` to
  `getText("processed", { components })`; give `ComponentPreview`, `AutoTypeTable` (flat table),
  `DoDont`, `RegistryInstallCallout`, `Steps`, `Tabs` an `asMarkdown()` branch so the `.md` route
  and `llms-full.txt` contain the fixture source, the flat prop tables and the do/don't pairs.
- `llms.txt` keeps the index + `design.md`; add the component-contracts route list and the public
  skill roster so an agent can go from "I need a data grid" to the page, the contract and the
  install command without scraping.
- Ship the same markdown into `packages/design/skills/**` reference sections where a skill quotes a
  page today (the mirror already exists).

## 4 · The verification stream (adding or updating a component)

One command, one order, every surface generated from the two authorities (`registry/ui/<name>.tsx`
and `component-contracts.json`):

1. `pnpm component:new <name>` scaffolds: source, test, preview file with a hero fixture, MDX page
   from the canon template with the required sections pre-filled, `meta.json` entry, contract
   record with `states`, `composite`, `compound`, `dataAttributes`, `a11y.pattern`.
2. `pnpm registry:build` + `pnpm design:derived` regenerate copy-ins, registry JSON, contract
   routes, matrix, home catalog, §Numbers, the Anatomy blocks and the API `dataAttributes` tables.
3. `content-lint` (extended): section order and presence per canon; every `ComponentPreview` name
   exists in the preview file and in the contract routes; Usage snippet compiles (`tsc` on the
   fenced block); no `{@link}`; frontmatter schema; no heading after Do/Don't except Changelog;
   Accessibility keyboard table present for interactive items; Scope present for composites.
4. `verify-docs-export`: build the `.md` for every page and fail if any `<[A-Z]` JSX tag survives
   (the DS-01 regression guard) or any API table is empty.
5. Contract lane: every fixture is a route (already), plus the state-probe geometry rules (hover
   inset, radius, focus clipped) from `07-state-probe.md`.
6. `pnpm gates:component <name>` runs 2–5 for one component in ~30s; `pre-push` runs them scoped.

## 5 · Chrome: adhere end to end

From `05-docs-chrome.md`: remap Fumadocs weights to the 400/500 ladder (`--font-weight-semibold`/
`bold` → 500), set `.vs-type-product` font-size/line-height on the scope, rebuild fullscreen on
`Dialog`, one Copy Prompt in the page header, hero preview through `ComponentPreview`, skip link,
`RegistryInstallCallout` → `Alert`, home tablist → `Tabs`, specimens use real `Button`/`Kbd`/`Input`,
`AnimatedIconCard` a real button, icon gallery on its own route segment, a `verify-docs-base-mirror`
gate for the hand-copied base.css blocks. Add a `--docs-shell` design-lint lane that also scans
Fumadocs' emitted classes for `font-semibold`, `rounded-xl`, `shadow-*` and raw palette.

## 6 · Decisions folded in

D19 (Scope), D26 (Playground): both sanctioned as canon sections with the placement above, required
or forbidden by the contract flags rather than left to each author. DD-1 (weights → 500),
DD-2/3 (toolbar and Explorer), DD-4 (Dialog) applied. Open for MK: nothing blocking — the canon
itself is the proposal; §2 is the table to approve or amend.
