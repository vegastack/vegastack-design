# Visual review during a release

**There is no capture tool.** The before/after pixel lane — its script, its output directory, and its
Playwright fixture and full-page projects — was removed on 2026-09-08 with the rest of the
attestation stack (`docs/plans/2026-09-08-verification-rebuild.md` § 3.3). Nothing in this repository
takes a screenshot, and nothing ever committed one.

What remains is a gate and a human, and this file is about the human half.

## What the gate already covers

`packages/ui/test/geometry.browser.test.tsx`, inside `pnpm verify` — so on every pull request, on the
release push, and before every deploy:

- **320px reflow** — no horizontal overflow at the narrowest supported viewport.
- **RTL containment** — nothing escapes its container under `dir="rtl"`.
- **Effective 24px pointer target** — measured with a real `elementFromPoint` probe, not
  `getComputedStyle`, so an invisible hit area counts and a visually-large-but-unhittable control
  does not.

It mounts the preview fixtures directly with the real compiled token CSS. It takes no screenshots and
needs no baselines, so it cannot be cleared by regenerating its own evidence — which is exactly what
made the old baseline gate worthless.

`contrast.browser.test.tsx` covers colour contrast in both themes. `stacking.browser.test.tsx` and
`overlay-portal.browser.test.tsx` cover z-order and portal theme scope.

## What the gate does not cover, and you must

Layout drift that is legal, contained, contrasting, and still wrong: a changed rhythm, a wrong
alignment, a hover wash that lost its inset, a radius that no longer matches its neighbour. No
assertion in this repository can see any of that. A person has to look.

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
5. Present the list — route, what changed, verdict, one-line reasoning.
6. **Stop. The developer decides.** Never self-clear a visual change, and never report "looks fine"
   for a route you did not open.

## Division of labour

| Stage          | Who                    | Why                                      |
| -------------- | ---------------------- | ---------------------------------------- |
| Detection      | the geometry contracts | Deterministic, blocking, in CI           |
| Interpretation | the developer's agent  | Opens the routes, judges intended vs not |
| Decision       | the developer          | Authority never leaves the human         |

## The cost, stated plainly

Nothing enforces layout drift in CI. That is a deliberate trade, made because the previous gate's
only escape hatch was overwriting the evidence under review — a gate that can be cleared by
regenerating its own baseline is not a gate. If several people begin merging component changes
independently, this is the first thing to revisit, and it needs its own plan.
