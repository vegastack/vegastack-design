# Conventions for components we own — the authoring side

`design.md` § Conventions for components we own is the table: one spelling per concern, and the
known deviations still waiting for their file to be touched. This file is how to apply it while
authoring. A component shadcn ships is out of scope here — it takes upstream's names verbatim, and a
difference needs a decision row.

## Where a new thing goes

Ask in order and stop at the first yes:

1. **An existing component already owns the job** → a `variant` or a prop on it.
2. **It is a new named region of an existing compound** → a part (a new flat export).
3. **It is reused, configured through props and tracked for updates** → a component
   (`registry:ui`), recorded in `packages/ui/upstream/ours.json`.
4. **It is a page composition copied once that composes at least two components in a way no single
   docs example shows** → a block (`registry:block`).
5. **Otherwise** → a docs example on the owning component's page.

A block, when step 4 is the answer:

- uses `PageHeader`, `FilterBar`, `DataList`, `Empty` and `ActionBar` wherever the page has that
  region — a block never re-derives one;
- has no `href="#"` — a link goes somewhere real, or it is a button;
- lays itself out with container queries, and uses `dvh` for any viewport height;
- is sentence case, with the default copy the conventions table names;
- imports its own parts relatively (`./components/<x>`), per `SKILL.md` § 6.

## Before you add a prop

1. **Grep the siblings for the axis word and its value set, and reuse both.** `size` is
   `xs · sm · default · lg`; an overlay width is `sm · default · lg · xl`; a hue-only axis is
   `intent` (API-17). A new synonym is naming-canon drift.
2. **Check the async shapes and accessors in the conventions table** — `loading`, `error`, one
   `loadMore` object, `emptyState` / `emptyMessage`, `onValueCommitted`, the `itemTo…` and
   `getRow…` accessors — before inventing a shape.
3. **Every string the component renders gets a label prop** with a sentence-case default
   (`<action>Label` or `…Message`); a `labels` object only past about six strings.
4. **`data-slot` on every part, prefixed with the exported component's kebab-case name**, and a
   container-query name equal to the slot name.
5. **A heading level is chosen through `render`** on the heading part, never a new `as` or
   `titleAs`.
6. **Does a Base UI part already do this?** `Combobox.Status`, `Field`, Tabs `orientation`,
   `focusableWhenDisabled` — prefer the engine over a bespoke context or a hand-rolled region.
7. **Does a sibling docs example already answer it?** Then it is a docs change, not a prop.
