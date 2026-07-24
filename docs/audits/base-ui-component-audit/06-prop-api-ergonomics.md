# Prop and API Ergonomics

## Principles For Future Fixes

- Preserve downstream flexibility where it prevents app teams from forking components.
- Do not expose duplicate aliases for Base UI behavior unless VegaStack intentionally owns a different abstraction.
- Prefer compound child components for structural flexibility; prefer props only for common, design-system-controlled knobs.
- When wrapping a third-party primitive, either preserve its important composition props or explicitly narrow the public type/docs.
- Avoid breaking API without migration notes.

## High-Value API Fixes

| Priority | Area                        | Evidence                                                                                                    | Direction                                                                                                           |
| -------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P1       | Button polymorphism/loading | `Button` exposes `render` but lacks Base UI `nativeButton` and `focusableWhenDisabled`.                     | Rebase on Base UI Button or implement equivalent semantics. Document anchor-as-button styling via `buttonVariants`. |
| P1       | Field dependency contract   | `FieldControl` hides an `Input` dependency.                                                                 | Add registry dependency or make `FieldControl` a pure Base Field control wrapper.                                   |
| P2       | Select content              | `SelectContent` hides `alignItemWithTrigger` and does not expose all relevant Base UI positioning controls. | Add first-class `alignItemWithTrigger`, `positionerProps`, and decide whether to add `Select.List`.                 |
| P2       | ToggleGroup                 | `toggleMultiple` exists while Base `multiple` remains in public props and can conflict.                     | Choose one API and enforce it with type omissions.                                                                  |
| P2       | Accordion                   | `openMultiple` defaults to true, unlike Base UI default.                                                    | Either switch default to official single-open or document VegaStack behavior as intentional.                        |
| P2       | Overlay positioners         | Popover/HoverCard/Tooltip/Menu/ContextMenu expose inconsistent portal/positioner knobs.                     | Standardize `portalProps`, `positionerProps`, safe className merge, and supported positioning props.                |
| P2       | DatePicker wrappers         | `Calendar` forwards DayPicker props, wrappers are narrow.                                                   | Add guarded `calendarProps` or promote high-value DayPicker props such as timezone/localization/caption controls.   |
| P2       | CommandDialog               | Wrapper does not expose root `Command` props like filter/loop/value.                                        | Add `commandProps` or let consumers render `Command` inside Dialog.                                                 |
| P2       | DataList state/a11y         | Loading rows not hidden/busy; empty preview not in docs.                                                    | Add `aria-busy`/status and document all core states.                                                                |
| P2       | Slider range labels         | One `aria-label` applies to every thumb.                                                                    | Add `thumbAriaLabels` or `getThumbAriaLabel`.                                                                       |
| P2       | Country/State selects       | Custom data/className semantics do not match docs.                                                          | Derive selected value from effective data; split `className` from `containerClassName`.                             |
| P2       | Image/Avatar alt            | Optional `alt` silently creates decorative images.                                                          | Require `alt` or require explicit `decorative` for empty alt.                                                       |

## Props To Treat As Intentional Flexibility

- `Button` variants and sizes: broad but consistent with downstream consistency goals.
- `DatePicker` owning wrappers plus lower-level `Calendar`: good split, but needs more passthrough.
- `DataList` column/render props: justified for downstream table reuse.
- `Sidebar` simplified API: reasonable if documented as VegaStack's narrower sidebar, not full upstream shadcn parity.
- `TextEdit` Tiptap dependency: justified for rich text, but keep isolated from docs barrels and general bundles.
