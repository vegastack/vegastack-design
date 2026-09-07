---
title: "M2 · Rich text prose recipe, Base UI Toolbar, docked-control motion"
labels: [audit-2026-09, components, motion]
---

## Context

Audit 2026-09-07: `02-batch-04` B4-09, B4-10, B4-11; `02-batch-08` B8-11; `02-batch-09` B9-08;
motion register M-39/M-49. Base UI `Toolbar` exists in 1.6+ (after **D1** confirms 1.8).
Motion decision D11 (overlay timings measured from Vercel/Linear; exits never slower than enters).

## Problem

- `markdown-view.tsx:33-274` (a `Components` map) and `text-edit.tsx:34-57` (`[&_h1]:` selectors,
  69 descendant rules) restate the same heading/paragraph/list/code/blockquote recipe; TextEdit's
  `[&_pre]` is a third copy of CodeBlock's surface.
- `text-edit.tsx:123-206` is a `role="toolbar"` of `Toggle`s with no roving tab stop (every button a
  tab stop); ActionBar (`action-bar.tsx:161`) and FilterBar are `role="group"` rows with the same
  gap.
- `action-bar.tsx:181` enters at `duration-base ease-emphasized` and **exits slower**
  (`duration-slow ease-exit`) with `scale-95`; `message-scroller.tsx` `MessageScrollerButton`
  copies the same recipe. Vercel/Linear/Base UI exit at or faster than enter; a docked bar needs no
  scale.
- `MessageScrollerButton` sets `variant="secondary"` then overrides `bg-background border-border
hover:bg-muted` inline.

## Do

1. `prose.ts` in `@vegastack/design` (or a registry `lib` item): class strings per element
   (h1–h4, p, ul/ol/li, code, pre, blockquote, table, hr, a, img) consumed by MarkdownView's
   components map and TextEdit's editor class; `pre` renders CodeBlock's surface classes.
2. Adopt Base UI `Toolbar` (`Toolbar.Root`, `Toolbar.Group`, `Toolbar.Separator`, `Toolbar.Button`
   wrapping `Toggle`/`IconButton`) in TextEdit, ActionBar and FilterBar: roving focus, one tab stop,
   arrow keys. Keep each component's public API.
3. `motion-dock-in` / `motion-dock-out` utilities in `utilities.css` (translate + fade, 150ms in
   `ease-emphasized`, 100ms out `ease-exit`, no scale); ActionBar and MessageScrollerButton use
   them; MessageScrollerButton becomes `variant="outline"` with no inline override (after F2).
4. Docs: `text-edit.mdx` "Scope" moves into the canon position (Do1 will lint it); `code-block`
   headerless + long-line fixtures; `tool-call-chip` interactive + running fixtures.
5. Doctrine: `design.md` §Motion — docked controls 150 in / 100 out, no scale; §Prose — one recipe.

## Acceptance

- TextEdit toolbar: Tab enters once, arrows move, Shift+Tab leaves (unit test); axe clean.
- `grep -c "\[&_" packages/ui/registry/ui/text-edit.tsx` < 10; MarkdownView and TextEdit render the
  same computed styles for h1/p/code in the capture harness.
- `probe-states.mjs --routes action-bar,message-scroller,text-edit` clean; motion register M-39/
  M-49 updated in `docs/ledger/`.
- `pnpm gates:component text-edit markdown-view action-bar message-scroller filter-bar`.
