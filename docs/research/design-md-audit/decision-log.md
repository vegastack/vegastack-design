# Design reference decision log

Date: 2026-07-22

The source snapshots are evidence, not new authorities. Locked VegaStack decisions win whenever an
external recommendation conflicts. Stable rule IDs and final dispositions live in
`unified-reference.md`; this log records the non-obvious calls.

## Locked outcomes retained

- Sentence case remains universal for product content.
- The active type ladder is 14px product / 16px docs, with named tracking and weight roles.
- Hover, active, and focus colour changes are immediate.
- Radius values remain 2/6/8/12/full, with concentric nested geometry.
- Elevation stays flat: `shadow-overlay` and `shadow-lit` are the only shadow roles.
- Focus stays neutral (`ring = primary`), with the text-entry border-tint exception.
- Accessibility is stated as WCAG 2.2 AA.
- Responsive behavior now explicitly covers touch targets, safe areas, RTL, long content, and first-line icon alignment.

## Kumo rule-by-rule disposition

| Kumo rule                  | Disposition         | Decision                                                                                                                                |
| -------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `content-text-size`        | **adapt**           | Adopt 14px for product content; retain the locked 16px documentation prose ladder.                                                      |
| `heading-case`             | **adopt**           | Sentence case matches VegaStack.                                                                                                        |
| `font-tracking`            | **adapt**           | Ban arbitrary tracking utilities, but retain audited named label/display/mono tracking roles.                                           |
| `font-weight`              | **adapt**           | Keep VegaStack’s 400/500/rare-600 hierarchy; do not import Kumo’s semibold heading default.                                             |
| `related-text-spacing`     | **adopt**           | Related text is grouped more tightly than surrounding sections/actions.                                                                 |
| `text-spacing`             | **adopt**           | Optical vertical/horizontal padding differences are allowed through recipes and the spacing scale.                                      |
| `hover-color-transitions`  | **adopt**           | Interaction colours change immediately.                                                                                                 |
| `shadow-borders`           | **reject**          | VegaStack intentionally uses its one solid border together with `shadow-overlay`; substituting a ring would reopen the border contract. |
| `concentric-border-radius` | **adopt**           | Expressed through the named 2/6/8/12/full values.                                                                                       |
| `icon-alignment`           | **adopt**           | Wrapping rows align icons to the first line through a line-height wrapper.                                                              |
| `inline-monospace-size`    | **already-covered** | `text-code` 13px and `text-code-sm` 12px are already smaller than 14px product body.                                                    |
| `sticky-borders`           | **already-covered** | Sticky separators consume the one `border` token.                                                                                       |
| `collapse-content-size`    | **adopt**           | Closing size animation preserves the inner content’s intrinsic size and avoids reflow.                                                  |
| `layer-card-nesting`       | **adopt**           | Avoid nested cards/panels as a hierarchy shortcut; use spacing and surface roles.                                                       |
| `dialog-rendering`         | **adapt**           | Keep Base UI dialog roots mounted and drive visibility through `open` so lifecycle transitions run.                                     |

## Vercel decisions

- Reused `docs/research/design-md-references/Vercel_DESIGN.md` after confirming it byte-matched the live
  `https://vercel.com/design.md` retrieval (`sha256:17bec17…deade4`). Its structured frontmatter inspired
  the generated contract, but VegaStack resolves both themes and retains a human doctrine layer.
- Vercel Geist’s blue two-layer focus and broader radius/elevation ladders were **adapted**, not copied:
  VegaStack keeps neutral focus, the 2/6/8/12/full radius set, flat surfaces, and two named shadows.
- Vercel Web Interface Guidelines’ Title Case recommendation was **rejected** in favor of sentence case.
  Its accessibility, form, touch, safe-area, content robustness, locale, and reduced-motion guidance was
  adopted or marked already covered in the unified ledger.
- The guidelines’ transform/opacity-only animation preference was **adapted**: those properties are the
  default, while disclosures and sanctioned layout engines may animate geometry when the content box
  remains stable and the motion communicates state.

## Generation decision

The generator reads the current DTCG source files directly and runs the repository’s Style Dictionary
preprocessor/transforms in memory. It does not trust a potentially stale `dist/tokens.json`, does not
edit token sources, and does not invoke `registry:build`. A small configuration file owns only recipes
and metadata; token values never live there. The YAML serializer and parser come from the already
installed lockfile dependency graph, so no package changes were required.
