# Visual review during a release

**There is no committed capture lane or baseline.** A shipping agent may make temporary targeted
captures for visual judgment; they are never committed or accepted as a CI result.

What remains is affected geometry plus targeted agent judgment.

## What the gate already covers

`packages/ui/test/geometry.browser.test.tsx`, selected by affected PR CI for changed components and
their transitive reverse dependents:

- **320px reflow** — no horizontal overflow at the narrowest supported viewport.
- **RTL containment** — nothing escapes its container under `dir="rtl"`.
- **Effective 24px pointer target** — measured with a real `elementFromPoint` probe, not
  `getComputedStyle`, so an invisible hit area counts and a visually-large-but-unhittable control
  does not.

It mounts only the selected preview fixtures with real compiled token CSS, while its CSS/token
sentinels and barrel/exclusion/dynamic metadata guards always run.

`contrast.browser.test.tsx` covers colour contrast in both themes. `stacking.browser.test.tsx` and
`overlay-portal.browser.test.tsx` cover z-order and portal theme scope.

## What the gate does not cover, and you must

Layout drift can be legal, contained, contrasting, and still wrong: a changed rhythm, a wrong
alignment, a hover wash that lost its inset, a radius that no longer matches its neighbour. No
assertion in this repository can see all of that. The shipping agent must look.

## Protocol

1. Build and serve the docs from the working tree:

   ```bash
   pnpm -F @vegastack/docs dev
   ```

2. Open every route the change can reach: the component's own page, every page whose component
   composes it (follow `registryDependencies` in `packages/ui/registry.json`), and — for a token, a
   docs-shell, or a preview-infrastructure change — a representative page from each family.
3. Look at each in **light and dark**, and at **narrow and wide**. Interaction states are part of the
   surface: rest, hover, pressed, focus-visible, disabled.
4. Describe what changed, route by route, and classify each: **intended** (consistent with the
   changeset), **unintended**, or **uncertain**.
5. Record the list — route, what changed, verdict, one-line reasoning — in the ship report.
6. Under an explicit `ship it`, continue automatically when every route is intended. Treat an
   unintended or uncertain result as a defect and enter the bounded corrective loop. Never report
   "looks fine" for a route you did not open.

## Division of labour

| Stage          | Who                    | Why                                        |
| -------------- | ---------------------- | ------------------------------------------ |
| Detection      | the geometry contracts | Deterministic, blocking, in CI             |
| Interpretation | the developer's agent  | Opens the routes, judges intended vs not   |
| Decision       | the shipping agent     | Bounded by the explicit ship authorization |

## The cost, stated plainly

Nothing enforces layout drift in CI. That is a deliberate trade, made because the previous gate's
only escape hatch was overwriting the evidence under review — a gate that can be cleared by
regenerating its own baseline is not a gate. If several people begin merging component changes
independently, this is the first thing to revisit, and it needs its own plan.
