---
title: "Do1 · Docs: one page canon for humans and agents, real API tables in the markdown export, chrome that obeys the system"
labels: [audit-2026-09, documentation]
---

## Context

Audit 2026-09-07, `08-docs-structure.md` (the canon — §2 is the table to implement),
`05-docs-chrome.md` DC-01…DC-17, batch docs findings (B1-17, B2-11, B3-13, B4-11, B5-14, B6-11,
B7-10, B8-12, B9-12). Decisions: D19/D26 (canon decided by the audit: Scope and Playground are
sanctioned sections with fixed placement), DD-1 ("fix all the docs styling — Fumadocs styling
adheres to the design system end to end"), DD-2/3 (Copy Prompt once in the header, width/
fullscreen per frame, Explorer only where no curated playground), DD-4 (fullscreen on the system
`Dialog`), DD-5 (`.vs-type-product` scope rule). MK's brief: pages must look like a modern design
system site and serve humans and agents alike, with a clear verification stream when components
are added or updated.

## Problem (measured)

- **Agents get no props and no example code**: `lib/source.ts:39-42` returns
  `getText("processed")` with no components, so `<AutoTypeTable …/>` survives verbatim in 107 of
  110 `.md` pages and 260× in `llms-full.txt`; `<ComponentPreview …/>` likewise (DS-01).
- Human API tables collapse every row to `name? union` (DS-02); 138 "(no own props)" placeholder
  rows across 18 pages (DS-03); no section canon enforced (`content-lint.mjs` checks only skipped
  visual tests and CSS import order) — pages carry Scope/Playground/Anatomy/Notes/Voice/How it
  works in varying positions and three pages have sections after Do/Don't (DS-04).
- Chrome: weight 600 headings/sidebar/strong; `.vs-type-product` leaves demos on a 15px/28px prose
  base (measured); fullscreen `role="dialog"` without a trap; six toolbars on the Button page; hero
  preview is a different frame; no skip link; `RegistryInstallCallout` hand-rolls an Alert with
  physical margins on 110 pages; home tablist hand-rolled from Buttons; specimens use raw
  `<button>`/`<kbd>`/`<input>`; two copies of the markdown-copy state machine; `AnimatedIconCard`
  focusable div; `IconGallery` in the global MDX map; three hand-copied base.css blocks with no
  gate (DC-01…DC-17).

## Do

1. **Canon** — implement `08-docs-structure.md` §2: frontmatter schema (`title`, `description`,
   `preview`, `registry`, `status`, `since`, `a11y`) validated in `source.config.ts`; sections in
   the fixed order Install → Usage → Scope (composites) → Anatomy (compounds) → Examples →
   Playground (where curated) → API Reference → Accessibility → Do/Don't → Changelog (generated);
   nothing else after Do/Don't. Migrate all 110 component pages (+ hooks, block); fold Notes/
   Voice/How it works into Usage/Scope.
2. **Agent export** — `remarkLLMs` `output: "function"`; `getText("processed", { components:
getMDXComponents() })`; `asMarkdown()` branches for `ComponentPreview` (inline the fixture
   source), `AutoTypeTable` (flat table), `DoDont`, `RegistryInstallCallout`, `Steps`, `Tabs`,
   `Callout`. `llms.txt` adds the contract route list and the public skill roster.
3. **API tables** — flat, expanded rows (name · type with the literal union · default ·
   description); own props only; parts without own props in one sentence, never placeholder rows;
   a `dataAttributes`/CSS-variables table generated from a new `component-contracts.json` field.
4. **Generated sections** — Install (`Steps` from `registry.json` deps + engines; the registry
   notice once as a site `Banner`), Anatomy (part tree + `data-slot`s), Accessibility "states
   tested" row from the contract, Changelog per item from `/CHANGELOG.md`.
5. **Verification stream** — `pnpm component:new <name>` scaffold (source, test, preview with hero,
   canon MDX, meta entry, contract record); `content-lint` extended (section order/presence per
   component class, every `ComponentPreview` name exists in the preview file and the contract
   routes, Usage snippet type-checks, frontmatter schema, no `{@link}`); `verify-docs-export`
   fails on any JSX tag or empty table in the built `.md`. (G1 wires these into `pnpm lint`.)
6. **Chrome** — weights remapped (`--font-weight-semibold/bold` → 500) and every Fumadocs default
   audited against the system (`design-lint --docs-shell` extended to emitted classes); `.vs-type-
product` sets font-size/line-height; fullscreen on `Dialog`; Copy Prompt in the page header,
   width/fullscreen per frame; hero through `ComponentPreview`; skip link first in `<body>`;
   `RegistryInstallCallout` → `Alert` (logical spacing, `Link`); home trace on `Tabs`; specimens use
   `Button`/`Kbd`/`Input`; one `useMarkdownCopy` hook; `AnimatedIconCard` a real button (I1 moves
   the gallery route); `min-h-dvh`; `max-w-(--preview-frame-max-width)`; `verify-docs-base-mirror`
   gate for the copied base.css blocks; Explorer only where no playground.
7. Doctrine: `design.md` §Docs canon (the table), and the `component` skill §6 rewritten to the
   canon.

## Acceptance

- `grep -c "<[A-Z]" apps/docs/out/docs/components/*.md` → 0 for all; `llms-full.txt` contains the
  Button prop table with `variant: solid | soft | …` and the `buttonVariants` fixture source.
- Every component page passes `content-lint` canon checks; `(no own props)` count 0.
- `design-lint --docs-shell` reports 0 `font-semibold|font-bold|rounded-xl|shadow-` in emitted
  docs CSS classes; capture of the Button page shows headings at 500.
- axe on button/dialog/data-grid docs pages: no duplicate main (with N1), no focusable div, skip
  link first tab stop; fullscreen traps focus (unit test).
- `pnpm lint`, both `SITE_VISIBILITY` builds, `pnpm gates:push`.
